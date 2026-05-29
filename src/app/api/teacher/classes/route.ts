import { NextResponse } from "next/server";
import { auth } from "@/features/Auth/api/auth";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/shared/lib/api";

type ApiRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function sessionUserRecord(session: unknown) {
  return isRecord(session) && isRecord(session.user) ? session.user : {};
}

async function getAccessToken() {
  const session = await auth();
  const tokenFromSession = stringValue(sessionUserRecord(session).apiToken);

  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get("access_token")?.value;
  return tokenFromSession || tokenFromCookie;
}

async function getTeacherId(accessToken?: string) {
  const session = await auth();
  const teacherIdFromSession = sessionUserRecord(session).id;
  if (teacherIdFromSession) return String(teacherIdFromSession);

  const cookieStore = await cookies();
  const userRaw = cookieStore.get("user")?.value;
  if (userRaw) {
    try {
      const user = JSON.parse(decodeURIComponent(userRaw)) as unknown;
      const teacherId = isRecord(user) ? user.id || user.teacher_id || user.sub : null;
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
  const schoolIdFromSession = sessionUserRecord(session).schoolId;
  if (schoolIdFromSession) {
    return String(schoolIdFromSession);
  }

  // 2. Try user cookie
  const cookieStore = await cookies();
  const userRaw = cookieStore.get("user")?.value;
  if (userRaw) {
    try {
      const user = JSON.parse(decodeURIComponent(userRaw)) as unknown;
      if (isRecord(user) && user.school_id) return String(user.school_id);
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

function recordValue(payload: unknown, key: string) {
  return isRecord(payload) ? payload[key] : undefined;
}

function extractClasses(payload: unknown): ApiRecord[] {
  const data = recordValue(payload, "data");
  const nestedData = recordValue(data, "data");
  const candidates = [
    recordValue(payload, "classes"),
    recordValue(data, "classes"),
    recordValue(nestedData, "classes"),
    recordValue(payload, "results"),
    recordValue(data, "results"),
    recordValue(payload, "items"),
    recordValue(data, "items"),
    Array.isArray(payload) ? payload : null,
    Array.isArray(data) ? data : null,
  ];

  const classes = candidates.find(Array.isArray);
  return (classes || []).filter(isRecord);
}

function teacherAssignmentId(classItem: ApiRecord) {
  const teacher = isRecord(classItem.teacher) ? classItem.teacher : {};
  return (
    classItem.teacher_id ??
    classItem.teacherId ??
    classItem.assigned_teacher_id ??
    classItem.assignedTeacherId ??
    classItem.primary_teacher_id ??
    classItem.primaryTeacherId ??
    teacher.id ??
    teacher.teacher_id ??
    null
  );
}

function normalizeClass(classItem: ApiRecord) {
  const teacher = isRecord(classItem.teacher) ? classItem.teacher : {};
  const students = Array.isArray(classItem.students) ? classItem.students : [];
  return {
    ...classItem,
    id: classItem.id ?? classItem.class_id,
    class_id: classItem.class_id ?? classItem.id,
    name: classItem.name ?? classItem.class_name,
    class_name: classItem.class_name ?? classItem.name,
    teacher_name:
      classItem.teacher_name ??
      classItem.teacherName ??
      teacher.name ??
      teacher.full_name ??
      undefined,
    student_count:
      classItem.student_count ??
      classItem.students_count ??
      classItem.studentCount ??
      students.length ??
      0,
  };
}

function classesForTeacher(classes: ApiRecord[], teacherId: string | null) {
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

    if (accessToken) {
      const teacherClassesRes = await fetch(`${API_BASE_URL}/teachers/me/classes`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });
      const teacherClassesData = await teacherClassesRes.json().catch(() => ({}));
      if (teacherClassesRes.ok) {
        const assignedClasses = extractClasses(teacherClassesData).map(normalizeClass);
        if (assignedClasses.length > 0) {
          return NextResponse.json(
            {
              ...teacherClassesData,
              classes: assignedClasses,
              total: assignedClasses.length,
            },
            { status: 200 },
          );
        }
      }
    }

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
        if (teacherRes.ok && isRecord(teacherData) && teacherData.school_id) {
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
