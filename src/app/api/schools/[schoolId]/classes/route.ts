import { NextResponse } from "next/server";
import { apiFetch } from "@/shared/lib/api";

export async function GET(
  _req: Request,
  context: { params: Promise<{ schoolId: string }> },
) {
  try {
    const { schoolId } = await context.params;
    const backendRes = await apiFetch(`/schools/${schoolId}/classes`);
    const data = await backendRes.json().catch(() => ({}));

    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json({ detail: "Invalid request payload." }, { status: 400 });
  }
}
