import { NextResponse } from "next/server";
import { auth } from "@/features/Auth/api/auth";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/shared/lib/api";

async function authHeader() {
  const session = await auth();
  const tokenFromSession = (session?.user as { apiToken?: string } | undefined)?.apiToken;
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

export async function GET() {
  try {
    const header = await authHeader();
    if (!header) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const backendRes = await fetch(`${API_BASE_URL}/system/ai-diagnostics`, {
      headers: header,
      cache: "no-store",
    });
    const data = await backendRes.json().catch(() => ({}));

    return NextResponse.json(
      {
        ...data,
        tts: {
          configured: Boolean(process.env.YARNGPT_API_KEY),
          provider: "yarngpt",
          status: process.env.YARNGPT_API_KEY ? "ready" : "missing_key",
        },
      },
      { status: backendRes.status },
    );
  } catch {
    return NextResponse.json(
      { detail: "Could not load AI diagnostics." },
      { status: 500 },
    );
  }
}
