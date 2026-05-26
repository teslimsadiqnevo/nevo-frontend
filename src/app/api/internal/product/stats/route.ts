import { proxyInternalGet } from "../../_proxy";

export async function GET() {
  return proxyInternalGet(
    "/internal/product/stats",
    "Could not load product stats.",
  );
}
