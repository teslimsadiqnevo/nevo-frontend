import { NextResponse } from "next/server";
import { apiFetch } from "@/shared/lib/api";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get("authorization");
    const backendRes = await apiFetch("/assessments", {
      method: "POST",
      headers: authHeader ? { Authorization: authHeader } : undefined,
      body: JSON.stringify(body),
    });
    const data = await backendRes.json().catch(() => ({}));

    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json({ detail: "Invalid request payload." }, { status: 400 });
  }
}
