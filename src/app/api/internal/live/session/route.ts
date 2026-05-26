import { proxyInternalGet } from "../../_proxy";

export async function GET() {
  return proxyInternalGet(
    "/internal/live/session",
    "Could not load internal live session.",
  );
}
