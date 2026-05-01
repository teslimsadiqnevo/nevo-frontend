import { NextResponse } from "next/server";
import { auth } from "@/features/Auth/api/auth";
import { API_BASE_URL } from "@/shared/lib/api";
import { cookies } from "next/headers";

async function getAuthContext() {
  const session = await auth();
  const tokenFromSession = (session?.user as any)?.apiToken;
  const roleFromSession = (session?.user as any)?.role;

  if (tokenFromSession) {
    return {
      token: tokenFromSession,
      role: typeof roleFromSession === "string" ? roleFromSession.toLowerCase() : null,
    };
  }

  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get("access_token")?.value;
  const userRaw = cookieStore.get("user")?.value;

  let roleFromCookie: string | null = null;
  if (userRaw) {
    try {
      const user = JSON.parse(decodeURIComponent(userRaw));
      roleFromCookie =
        typeof user?.role === "string" ? user.role.toLowerCase() : null;
    } catch {
      roleFromCookie = null;
    }
  }

  return {
    token: tokenFromCookie ?? null,
    role: roleFromCookie,
  };
}

export async function POST(request: Request) {
  try {
    const { token, role } = await getAuthContext();
    if (!token) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    if (role && role !== "student") {
      return NextResponse.json(
        {
          detail:
            "Ask Nevo chat is currently available during student learning sessions.",
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const message =
      typeof body?.message === "string" ? body.message.trim() : "";
    const lessonId =
      typeof body?.lesson_id === "string" && body.lesson_id.trim().length > 0
        ? body.lesson_id.trim()
        : null;

    if (!message) {
      return NextResponse.json(
        { detail: "Message is required." },
        { status: 400 }
      );
    }

    const upstream = await fetch(`${API_BASE_URL}/chat/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
        ...(lessonId ? { lesson_id: lessonId } : {}),
      }),
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error: any) {
    return NextResponse.json(
      { detail: error?.message || "Failed to send Ask Nevo message." },
      { status: 500 }
    );
  }
}
