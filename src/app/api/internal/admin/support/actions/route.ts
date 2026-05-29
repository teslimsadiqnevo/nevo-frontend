import { proxyInternalGet } from "../../../_proxy";

export async function GET() {
  return proxyInternalGet(
    "/internal/admin/support/actions",
    "Could not load internal support actions.",
  );
}
