import { NextResponse } from "next/server";
import { auth } from "@/features/Auth/api/auth";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/shared/lib/api";

type ErrorPayload = {
  detail?: unknown;
  message?: unknown;
  error?: unknown;
};

type RouteContext = {
  params?: { threadId?: string } | Promise<{ threadId?: string }>;
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

export async function GET(req: Request, context: RouteContext) {
  let threadId: string | undefined;

  try {
    const params = context?.params;
    const resolved =
      params && typeof params.then === "function" ? await params : params;
    threadId = resolved?.threadId;
  } catch {
    threadId = undefined;
  }

  if (!threadId) {
    return NextResponse.json({ detail: "Missing threadId" }, { status: 400 });
  }

  try {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const backendRes = await fetch(
      `${API_BASE_URL}/messages/threads/${encodeURIComponent(threadId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const data = await backendRes.json().catch(() => ({}));
    if (!backendRes.ok) {
      return NextResponse.json(
        { detail: buildErrorDetail(data, "Could not fetch thread messages.") },
        { status: backendRes.status },
      );
    }

    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { detail: "Could not fetch thread messages." },
      { status: 500 },
    );
  }
}
