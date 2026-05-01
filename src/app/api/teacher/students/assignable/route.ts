import { NextResponse } from "next/server";
import { auth } from "@/features/Auth/api/auth";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/shared/lib/api";

async function teacherAuthHeader() {
  const session = await auth();
  const tokenFromSession = (session?.user as any)?.apiToken;
  if (tokenFromSession) {
    return { Authorization: `Bearer ${tokenFromSession}` };
  }

  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get("access_token")?.value;
  if (tokenFromCookie) {
    return { Authorization: `Bearer ${tokenFromCookie}` };
  }

  return null;
}

export async function GET(req: Request) {
  try {
    const authHeader = await teacherAuthHeader();
    if (!authHeader) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const studentRes = await fetch(
      `${API_BASE_URL}/teachers/students/assignable`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
      }
    );

    const studentData = await studentRes.json().catch(() => ({}));
    if (!studentRes.ok) {
      return NextResponse.json(
        {
          detail:
            (studentData as any)?.detail ||
            "Could not fetch assignable students.",
        },
        { status: studentRes.status }
      );
    }

    return NextResponse.json(studentData, { status: studentRes.status });
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || "Could not fetch assignable students." },
      { status: 500 }
    );
  }
}
