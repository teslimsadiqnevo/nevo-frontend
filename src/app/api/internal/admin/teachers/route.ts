import type { NextRequest } from "next/server";
import { proxyInternalGet } from "../../_proxy";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  return proxyInternalGet(
    `/internal/admin/teachers${query ? `?${query}` : ""}`,
    "Could not load internal teachers.",
  );
}
