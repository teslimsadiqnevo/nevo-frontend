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

export async function POST(req: Request) {
  try {
    const authHeader = await teacherAuthHeader();
    if (!authHeader) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bucket, file_name, content_type } = body;

    if (!file_name) {
      return NextResponse.json(
        { detail: "file_name is required." },
        { status: 400 }
      );
    }

    const presignRes = await fetch(`${API_BASE_URL}/teachers/me/upload-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      body: JSON.stringify({
        bucket: bucket || "lesson-media",
        file_name,
        content_type: content_type || "application/octet-stream",
      }),
    });

    const presignData = await presignRes.json().catch(() => ({}));
    if (!presignRes.ok) {
      return NextResponse.json(
        { detail: (presignData as any)?.detail || "Could not get upload URL." },
        { status: presignRes.status }
      );
    }

    return NextResponse.json(presignData, { status: presignRes.status });
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || "Could not get upload URL." },
      { status: 500 }
    );
  }
}
