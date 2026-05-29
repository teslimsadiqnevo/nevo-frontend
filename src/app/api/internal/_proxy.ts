import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/shared/lib/api";

const INTERNAL_TOKEN_COOKIE = "internal_ops_token";

export async function proxyInternalGet(path: string, fallbackDetail: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(INTERNAL_TOKEN_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const backendRes = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json({ detail: fallbackDetail }, { status: 500 });
  }
}

export async function proxyInternalPost(
  path: string,
  body: unknown,
  fallbackDetail: string,
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(INTERNAL_TOKEN_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const backendRes = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json({ detail: fallbackDetail }, { status: 500 });
  }
}

export async function proxyInternalPatch(
  path: string,
  body: unknown,
  fallbackDetail: string,
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(INTERNAL_TOKEN_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const backendRes = await fetch(`${API_BASE_URL}${path}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json({ detail: fallbackDetail }, { status: 500 });
  }
}
