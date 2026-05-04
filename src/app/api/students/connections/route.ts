import { NextResponse } from "next/server";
import { auth } from "@/features/Auth/api/auth";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/shared/lib/api";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const tokenFromSession = (session?.user as any)?.apiToken;

    const cookieStore = await cookies();
    const tokenFromCookie = cookieStore.get("access_token")?.value;
    const accessToken = tokenFromSession || tokenFromCookie;

    if (!accessToken) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const url = `${API_BASE_URL}/students/me/connections`;

    const backendRes = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await backendRes.json().catch(() => ({}));
    if (!backendRes.ok) {
      return NextResponse.json(
        {
          detail:
            (data as any)?.detail ||
            (data as any)?.message ||
            (data as any)?.error ||
            "Could not fetch connections.",
        },
        { status: backendRes.status },
      );
    }
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    return NextResponse.json(
      { detail: "Could not fetch connections. Please try again." },
      { status: 500 },
    );
  }
}
