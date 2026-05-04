import { NextResponse } from "next/server";
import { auth } from "@/features/Auth/api/auth";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/shared/lib/api";

async function resolveAccessToken(req: Request) {
  const bearerHeader = req.headers.get("authorization");
  if (bearerHeader?.startsWith("Bearer ")) {
    return bearerHeader.slice("Bearer ".length);
  }

  const session = await auth();
  const tokenFromSession =
    session?.user && typeof session.user === "object" && "apiToken" in session.user
      ? String((session.user as { apiToken?: unknown }).apiToken || "")
      : "";
  if (tokenFromSession) return tokenFromSession;

  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value || null;
}

export async function PUT(req: Request) {
  try {
    const accessToken = await resolveAccessToken(req);
    if (!accessToken) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const enabled = url.searchParams.get("enabled");
    if (enabled !== "true" && enabled !== "false") {
      return NextResponse.json({ detail: "Missing or invalid enabled flag" }, { status: 400 });
    }

    const backendRes = await fetch(
      `${API_BASE_URL}/students/me/adaptation?enabled=${encodeURIComponent(enabled)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { detail: "Could not update adaptation preference." },
      { status: 500 },
    );
  }
}
