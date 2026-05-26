import { proxyInternalGet } from "../../_proxy";

export async function GET() {
  return proxyInternalGet(
    "/internal/product/connectivity",
    "Could not load connectivity events.",
  );
}
