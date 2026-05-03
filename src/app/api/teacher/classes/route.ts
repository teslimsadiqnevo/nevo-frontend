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

export async function GET() {
  try {
    const accessToken = await getAccessToken();
    const schoolId = await getTeacherSchoolId(accessToken || undefined);

    if (!schoolId) {
      // Teacher has no school — return an empty class list instead of an error
      return NextResponse.json({ classes: [], total: 0 }, { status: 200 });
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
