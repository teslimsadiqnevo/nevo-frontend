import { NextResponse } from "next/server";
import { auth } from "@/features/Auth/api/auth";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/shared/lib/api";

async function authHeader() {
  const session = await auth();
  const tokenFromSession = (session?.user as { apiToken?: string } | undefined)
    ?.apiToken;
  if (tokenFromSession) {
    return { Authorization: `Bearer ${tokenFromSession}` };
  }

  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get("access_token")?.value;
  if (tokenFromCookie) {
    return { Authorization: `Bearer ${tokenFromCookie}` };
  }

  return null;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ conceptId: string }> },
) {
  try {
    const headers = await authHeader();
    if (!headers) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const { conceptId } = await context.params;
    const backendRes = await fetch(
      `${API_BASE_URL}/concepts/${encodeURIComponent(conceptId)}/image`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      },
    );

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { detail: "Could not load concept image." },
      { status: 500 },
    );
  }
}
