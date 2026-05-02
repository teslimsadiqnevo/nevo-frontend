import { NextResponse } from "next/server";
import { auth } from "@/features/Auth/api/auth";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/shared/lib/api";

async function getTeacherSchoolId() {
  const session = await auth();
  const schoolIdFromSession = (session?.user as any)?.schoolId;
  if (schoolIdFromSession) {
    return String(schoolIdFromSession);
  }

  const cookieStore = await cookies();
  const userRaw = cookieStore.get("user")?.value;
  if (!userRaw) return null;

  try {
    const user = JSON.parse(decodeURIComponent(userRaw));
    return user?.school_id ? String(user.school_id) : null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const schoolId = await getTeacherSchoolId();
    if (!schoolId) {
      return NextResponse.json({ detail: "School not found." }, { status: 400 });
    }

    const backendRes = await fetch(`${API_BASE_URL}/schools/${schoolId}/classes`, {
      method: "GET",
    });

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { detail: "Could not fetch teacher classes." },
      { status: 500 },
    );
  }
}
