import { NextRequest } from "next/server";
import { proxyInternalGet } from "../../_proxy";

export async function GET(request: NextRequest) {
  const school = request.nextUrl.searchParams.get("school") ?? "all";
  const location = request.nextUrl.searchParams.get("location") ?? "all";
  return proxyInternalGet(
    `/internal/pilot/metrics?school=${encodeURIComponent(school)}&location=${encodeURIComponent(location)}`,
    "Could not load internal pilot metrics.",
  );
}
