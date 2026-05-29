import { proxyInternalGet } from "../../_proxy";

export async function GET() {
  return proxyInternalGet("/internal/ai/cache", "Could not load AI cache metrics.");
}
