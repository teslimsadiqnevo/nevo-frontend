import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/shared/lib/api";

const INTERNAL_TOKEN_COOKIE = "internal_ops_token";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(INTERNAL_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const backendRes = await fetch(`${API_BASE_URL}/internal/live/signals/stream`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!backendRes.ok || !backendRes.body) {
      return NextResponse.json(
        { detail: "Live signal stream is unavailable." },
        { status: backendRes.status || 502 },
      );
    }

    return new Response(backendRes.body, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream",
      },
    });
  } catch {
    return NextResponse.json(
      { detail: "Live signal stream is unavailable." },
      { status: 500 },
    );
  }
}
