import type { NextRequest } from "next/server";
import { proxyInternalPost } from "../../../../_proxy";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return proxyInternalPost(
    "/internal/admin/support/actions/run",
    body,
    "Could not run internal support action.",
  );
}
