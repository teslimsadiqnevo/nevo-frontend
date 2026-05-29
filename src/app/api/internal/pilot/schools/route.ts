import { proxyInternalGet } from "../../_proxy";

export async function GET() {
  return proxyInternalGet(
    "/internal/pilot/schools",
    "Could not load pilot schools.",
  );
}
