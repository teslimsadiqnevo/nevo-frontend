import { NextResponse } from "next/server";
import { auth } from "@/features/Auth/api/auth";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/shared/lib/api";

export async function DELETE(req: Request, context: any) {
  // context.params may be a Promise in some Next types, handle both
  let id: string | undefined;
  try {
    const params = context?.params;
    const resolved =
      params && typeof params.then === "function" ? await params : params;
    id = resolved?.id;
  } catch {
    id = undefined;
  }
  if (!id) {
    return NextResponse.json({ detail: "Missing id" }, { status: 400 });
  }
  try {
    const session = await auth();
    const tokenFromSession = (session?.user as any)?.apiToken;

    const cookieStore = await cookies();
    const tokenFromCookie = cookieStore.get("access_token")?.value;
    const accessToken = tokenFromSession || tokenFromCookie;

    if (!accessToken) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const url = `${API_BASE_URL}/students/me/connection-requests/${encodeURIComponent(id)}`;

    const backendRes = await fetch(url, {
      method: "DELETE",
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
            "Could not cancel request.",
        },
        { status: backendRes.status },
      );
    }

    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    return NextResponse.json(
      { detail: "Could not cancel request." },
      { status: 500 },
    );
  }
}
