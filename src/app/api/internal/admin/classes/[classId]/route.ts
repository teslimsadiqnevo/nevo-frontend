import type { NextRequest } from "next/server";
import { proxyInternalGet, proxyInternalPatch } from "../../../_proxy";

type RouteContext = {
  params: Promise<{ classId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { classId } = await context.params;
  return proxyInternalGet(
    `/internal/admin/classes/${encodeURIComponent(classId)}`,
    "Could not load internal class detail.",
  );
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { classId } = await context.params;
  const body = await request.json().catch(() => ({}));
  return proxyInternalPatch(
    `/internal/admin/classes/${encodeURIComponent(classId)}`,
    body,
    "Could not update internal class.",
  );
}
