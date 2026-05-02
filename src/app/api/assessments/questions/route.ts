import { NextResponse } from "next/server";
import { apiFetch } from "@/shared/lib/api";

export async function GET() {
  try {
    const backendRes = await apiFetch("/assessments/questions");
    const data = await backendRes.json().catch(() => ({}));

    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json({ detail: "Failed to fetch assessment questions." }, { status: 500 });
  }
}
