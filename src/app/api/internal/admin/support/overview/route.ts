import { proxyInternalGet } from "../../../_proxy";

export async function GET() {
  return proxyInternalGet(
    "/internal/admin/support/overview",
    "Could not load internal support overview.",
  );
}
