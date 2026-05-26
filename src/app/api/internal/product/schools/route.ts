import { proxyInternalGet } from "../../_proxy";

export async function GET() {
  return proxyInternalGet(
    "/internal/product/schools",
    "Could not load product schools.",
  );
}
