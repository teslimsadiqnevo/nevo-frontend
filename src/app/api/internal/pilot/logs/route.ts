import { NextRequest } from "next/server";
import { proxyInternalGet, proxyInternalPost } from "../../_proxy";

export async function GET(request: NextRequest) {
  const limit = request.nextUrl.searchParams.get("limit") ?? "20";
  return proxyInternalGet(
    `/internal/pilot/logs?limit=${encodeURIComponent(limit)}`,
    "Could not load observation logs.",
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return proxyInternalPost(
    "/internal/pilot/logs",
    body,
    "Could not save observation log.",
  );
}
