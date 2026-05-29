import type { NextRequest } from "next/server";
import { proxyInternalGet, proxyInternalPatch } from "../../../_proxy";

type RouteContext = {
  params: Promise<{ lessonId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { lessonId } = await context.params;
  return proxyInternalGet(
    `/internal/admin/lessons/${encodeURIComponent(lessonId)}`,
    "Could not load internal lesson detail.",
  );
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { lessonId } = await context.params;
  const body = await request.json().catch(() => ({}));
  return proxyInternalPatch(
    `/internal/admin/lessons/${encodeURIComponent(lessonId)}`,
    body,
    "Could not update internal lesson.",
  );
}
