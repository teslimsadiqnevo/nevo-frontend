import { proxyInternalGet } from "../../_proxy";

export async function GET() {
  return proxyInternalGet("/internal/ai/images", "Could not load image metrics.");
}
