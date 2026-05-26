import { proxyInternalGet } from "../../_proxy";

export async function GET() {
  return proxyInternalGet("/internal/ai/health", "Could not load AI health.");
}
