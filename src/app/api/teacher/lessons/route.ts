import { NextResponse } from "next/server";
import { auth } from "@/features/Auth/api/auth";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/shared/lib/api";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const tokenFromSession = (session?.user as any)?.apiToken;

    const cookieStore = await cookies();
    const tokenFromCookie = cookieStore.get("access_token")?.value;
    const accessToken = tokenFromSession || tokenFromCookie;

    if (!accessToken) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    // Read JSON body instead of FormData
    const body = await req.json();

    const backendRes = await fetch(`${API_BASE_URL}/lessons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
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
      { detail: "Could not publish lesson. Please try again." },
      { status: 500 },
    );
  }
}

