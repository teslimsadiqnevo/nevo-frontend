import { NextResponse } from "next/server";
import { auth } from "@/features/Auth/api/auth";
import { apiFetch } from "@/shared/lib/api";

export async function POST(req: Request) {
  const session = await auth();
  const apiToken = (session?.user as any)?.apiToken;
  const role = (session?.user as any)?.role;

  if (!apiToken || role !== "teacher") {
    return NextResponse.json(
      { detail: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body?.token || "");

    if (!token) {
      return NextResponse.json(
        { detail: "Invite token is required." },
        { status: 400 },
      );
    }

    const backendRes = await apiFetch("/auth/teacher/accept-school-invite", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { detail: "Invalid request payload." },
      { status: 400 },
    );
  }
}
