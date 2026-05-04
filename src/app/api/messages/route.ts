import { NextResponse } from "next/server";
import { auth } from "@/features/Auth/api/auth";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/shared/lib/api";

type ErrorPayload = {
  detail?: unknown;
  message?: unknown;
  error?: unknown;
};

function buildErrorDetail(data: ErrorPayload, fallback: string) {
  return (
    data?.detail ||
    data?.message ||
    data?.error ||
    fallback
  );
}

async function getAccessToken() {
  const session = await auth();
  const tokenFromSession =
    session?.user && typeof session.user === "object" && "apiToken" in session.user
      ? String((session.user as { apiToken?: unknown }).apiToken || "")
      : "";

  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get("access_token")?.value;

  return tokenFromSession || tokenFromCookie || null;
}

export async function POST(req: Request) {
  try {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const backendRes = await fetch(`${API_BASE_URL}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch(() => ({}));
    if (!backendRes.ok) {
      return NextResponse.json(
        { detail: buildErrorDetail(data, "Could not send message.") },
        { status: backendRes.status },
      );
    }

    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { detail: "Could not send message." },
      { status: 500 },
    );
  }
}
