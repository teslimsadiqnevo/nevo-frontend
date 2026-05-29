import type { NextRequest } from "next/server";
import { proxyInternalGet, proxyInternalPatch } from "../../../_proxy";

type RouteContext = {
  params: Promise<{ teacherId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { teacherId } = await context.params;
  return proxyInternalGet(
    `/internal/admin/teachers/${encodeURIComponent(teacherId)}`,
    "Could not load internal teacher detail.",
  );
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { teacherId } = await context.params;
  const body = await request.json().catch(() => ({}));
  return proxyInternalPatch(
    `/internal/admin/teachers/${encodeURIComponent(teacherId)}`,
    body,
    "Could not update internal teacher.",
  );
}
