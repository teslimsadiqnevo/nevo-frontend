import type { NextRequest } from "next/server";
import { proxyInternalGet, proxyInternalPatch } from "../../../_proxy";

type RouteContext = {
  params: Promise<{ schoolId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { schoolId } = await context.params;
  return proxyInternalGet(
    `/internal/admin/schools/${encodeURIComponent(schoolId)}`,
    "Could not load internal school detail.",
  );
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { schoolId } = await context.params;
  const body = await request.json().catch(() => ({}));
  return proxyInternalPatch(
    `/internal/admin/schools/${encodeURIComponent(schoolId)}`,
    body,
    "Could not update internal school.",
  );
}
