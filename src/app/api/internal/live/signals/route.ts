import { NextRequest } from "next/server";
import { proxyInternalGet } from "../../_proxy";

export async function GET(request: NextRequest) {
  const limit = request.nextUrl.searchParams.get("limit") ?? "30";
  return proxyInternalGet(
    `/internal/live/signals?limit=${encodeURIComponent(limit)}`,
    "Could not load internal live signals.",
  );
}
