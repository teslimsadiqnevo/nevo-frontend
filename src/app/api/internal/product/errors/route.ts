import { NextRequest } from "next/server";
import { proxyInternalGet } from "../../_proxy";

export async function GET(request: NextRequest) {
  const range = request.nextUrl.searchParams.get("range") ?? "today";
  return proxyInternalGet(
    `/internal/product/errors?range=${encodeURIComponent(range)}`,
    "Could not load product errors.",
  );
}
