import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/shared/lib/api";

const INTERNAL_TOKEN_COOKIE = "internal_ops_token";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const backendRes = await fetch(`${API_BASE_URL}/internal/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await backendRes.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: backendRes.status });
    if (backendRes.ok && typeof data?.token === "string") {
      response.cookies.set(INTERNAL_TOKEN_COOKIE, data.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: Number(data.expires_in_seconds || 60 * 60 * 12),
        path: "/",
      });
    }
    return response;
  } catch {
    return NextResponse.json(
      { detail: "Internal login is unavailable. Please try again." },
      { status: 500 },
    );
  }
}
