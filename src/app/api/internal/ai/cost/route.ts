import { proxyInternalGet } from "../../_proxy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const range = url.searchParams.get("range") ?? "today";
  return proxyInternalGet(
    `/internal/ai/cost?range=${encodeURIComponent(range)}`,
    "Could not load AI cost metrics.",
  );
}
