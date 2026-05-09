import { NextResponse } from "next/server";
import { auth } from "@/features/Auth/api/auth";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/shared/lib/api";

async function getAccessToken() {
  const session = await auth();
  const tokenFromSession = (session?.user as any)?.apiToken;

  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get("access_token")?.value;
  return tokenFromSession || tokenFromCookie;
}

async function getTeacherId(accessToken?: string) {
  const session = await auth();
  const teacherIdFromSession = (session?.user as any)?.id;
  if (teacherIdFromSession) return String(teacherIdFromSession);

  const cookieStore = await cookies();
  const userRaw = cookieStore.get("user")?.value;
  if (userRaw) {
    try {
      const user = JSON.parse(decodeURIComponent(userRaw));
      const teacherId = user?.id || user?.teacher_id || user?.sub;
      if (teacherId) return String(teacherId);
    } catch {
      // ignore parse errors
    }
  }

  if (accessToken) {
    const payload = decodeJwtPayload(accessToken);
    const teacherId = payload?.id || payload?.teacher_id || payload?.sub;
    if (teacherId) return String(teacherId);
  }

  return null;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

async function getTeacherSchoolId(accessToken?: string) {
  // 1. Try session
  const session = await auth();
  const schoolIdFromSession = (session?.user as any)?.schoolId;
  if (schoolIdFromSession) {
    return String(schoolIdFromSession);
  }

  // 2. Try user cookie
  const cookieStore = await cookies();
  const userRaw = cookieStore.get("user")?.value;
  if (userRaw) {
    try {
      const user = JSON.parse(decodeURIComponent(userRaw));
      if (user?.school_id) return String(user.school_id);
    } catch {
      // ignore parse errors
    }
  }

  // 3. Decode the JWT access token — school_id is embedded at login
  if (accessToken) {
    const payload = decodeJwtPayload(accessToken);
    if (payload?.school_id) return String(payload.school_id);
  }

  return null;
}

function extractClasses(payload: any): any[] {
  const candidates = [
    payload?.classes,
    payload?.data?.classes,
    payload?.data?.data?.classes,
    payload?.results,
    payload?.data?.results,
    payload?.items,
    payload?.data?.items,
    Array.isArray(payload) ? payload : null,
    Array.isArray(payload?.data) ? payload.data : null,
  ];

  const classes = candidates.find(Array.isArray);
  return classes || [];
}

function teacherAssignmentId(classItem: any) {
  const teacher = classItem?.teacher;
  return (
    classItem?.teacher_id ??
    classItem?.teacherId ??
    classItem?.assigned_teacher_id ??
    classItem?.assignedTeacherId ??
    classItem?.primary_teacher_id ??
    classItem?.primaryTeacherId ??
    teacher?.id ??
    teacher?.teacher_id ??
    null
  );
}

function normalizeClass(classItem: any) {
  return {
    ...classItem,
    id: classItem?.id ?? classItem?.class_id,
    class_id: classItem?.class_id ?? classItem?.id,
    name: classItem?.name ?? classItem?.class_name,
    class_name: classItem?.class_name ?? classItem?.name,
    teacher_name:
      classItem?.teacher_name ??
      classItem?.teacherName ??
      classItem?.teacher?.name ??
      classItem?.teacher?.full_name ??
      undefined,
    student_count:
      classItem?.student_count ??
      classItem?.students_count ??
      classItem?.studentCount ??
      classItem?.students?.length ??
      0,
  };
}

function classesForTeacher(classes: any[], teacherId: string | null) {
  if (!teacherId) return classes;

  const hasTeacherAssignmentFields = classes.some((classItem) => teacherAssignmentId(classItem) != null);
  if (!hasTeacherAssignmentFields) return classes;

  return classes.filter((classItem) => String(teacherAssignmentId(classItem)) === teacherId);
}

export async function GET() {
  try {
    const accessToken = await getAccessToken();
    const teacherId = await getTeacherId(accessToken || undefined);
    let schoolId = await getTeacherSchoolId(accessToken || undefined);

    // Fall back to the live teacher profile so assigned classes still resolve
    // even when the local session/cookie shape does not expose school_id.
    if (!schoolId && accessToken) {
      if (teacherId) {
        const teacherRes = await fetch(`${API_BASE_URL}/teachers/${teacherId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });
        const teacherData = await teacherRes.json().catch(() => ({}));
        if (teacherRes.ok && teacherData?.school_id) {
          schoolId = String(teacherData.school_id);
        }
      }
    }

    if (!schoolId) {
      // Teacher has no school — return an empty class list instead of an error
      return NextResponse.json({ classes: [], total: 0 }, { status: 200 });
    }

    const backendRes = await fetch(`${API_BASE_URL}/schools/${schoolId}/classes`, {
      method: "GET",
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
      cache: "no-store",
    });

    const data = await backendRes.json().catch(() => ({}));
    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    const classes = classesForTeacher(extractClasses(data), teacherId).map(normalizeClass);
    return NextResponse.json(
      {
        ...data,
        classes,
        total: classes.length,
      },
      { status: backendRes.status },
    );
  } catch {
    return NextResponse.json(
      { detail: "Could not fetch teacher classes." },
      { status: 500 },
    );
  }
}
