import type { NextRequest } from "next/server";
import { proxyInternalGet, proxyInternalPatch } from "../../../_proxy";

type RouteContext = {
  params: Promise<{ studentId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { studentId } = await context.params;
  return proxyInternalGet(
    `/internal/admin/students/${encodeURIComponent(studentId)}`,
    "Could not load internal student detail.",
  );
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { studentId } = await context.params;
  const body = await request.json().catch(() => ({}));
  return proxyInternalPatch(
    `/internal/admin/students/${encodeURIComponent(studentId)}`,
    body,
    "Could not update internal student.",
  );
}
