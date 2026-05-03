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

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("class_id");

    let url = `${API_BASE_URL}/teachers/students/assignable`;
    if (classId) {
      url += `?class_id=${encodeURIComponent(classId)}`;
    }

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
            "Could not fetch assignable students.",
        },
        { status: backendRes.status },
      );
    }
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { detail: "Could not fetch assignable students. Please try again." },
      { status: 500 },
    );
  }
}
