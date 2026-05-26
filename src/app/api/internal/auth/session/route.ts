import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/shared/lib/api";

const INTERNAL_TOKEN_COOKIE = "internal_ops_token";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(INTERNAL_TOKEN_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const backendRes = await fetch(`${API_BASE_URL}/internal/auth/session`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { detail: "Could not verify internal session." },
      { status: 500 },
    );
  }
}
