import { NextResponse } from "next/server";
import { auth } from "@/features/Auth/api/auth";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/shared/lib/api";

async function getAccessToken() {
  const session = await auth();
  const tokenFromSession = (session?.user as any)?.apiToken;

  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get("access_token")?.value;
  return tokenFromSession || tokenFromCookie;
}

export async function GET(req: Request) {
  try {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const backendRes = await fetch(`${API_BASE_URL}/lessons/teacher/manage${suffix}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { detail: "Could not load lessons. Please try again." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    const backendRes = await fetch(`${API_BASE_URL}/lessons`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    const data = await backendRes.json().catch(() => ({}));
    if (!backendRes.ok) {
      return NextResponse.json(
        {
          detail:
            (data as any)?.detail ||
            (data as any)?.message ||
            (data as any)?.error ||
            "Could not publish lesson.",
        },
        { status: backendRes.status },
      );
    }
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { detail: "Could not create lesson. Please try again." },
      { status: 500 },
    );
  }
}

