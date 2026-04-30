import { NextResponse } from "next/server";
import { apiFetch } from "@/shared/lib/api";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";

    const backendRes = await apiFetch(`/schools/search?q=${encodeURIComponent(q)}`);
    const data = await backendRes.json().catch(() => ({}));

    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json({ detail: "Invalid request payload." }, { status: 400 });
  }
}

