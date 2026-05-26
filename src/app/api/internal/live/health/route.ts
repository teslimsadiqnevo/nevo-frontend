import { proxyInternalGet } from "../../_proxy";

export async function GET() {
  return proxyInternalGet(
    "/internal/live/health",
    "Could not load internal live health.",
  );
}
