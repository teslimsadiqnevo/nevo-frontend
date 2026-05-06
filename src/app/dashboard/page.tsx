import { redirect } from "next/navigation";
import {
  getDashboardPath,
  getLoginPathForRole,
  normalizeDashboardRole,
  type DashboardRole,
  type DashboardView,
} from "@/shared/lib";
import { getServerDashboardContext } from "@/features/Dashboard/lib/serverDashboardContext";

const VIEW_FALLBACKS: Partial<Record<DashboardRole, Set<string>>> = {
  student: new Set(["home", "lessons", "downloads", "progress", "connect", "profile"]),
  teacher: new Set(["home", "lessons", "students", "insights", "connect", "profile"]),
  school: new Set(["home", "classes", "teachers", "students", "reports", "settings"]),
};

function normalizeView(role: DashboardRole, value: string | null): DashboardView {
  if (!value) return "home";
  const normalized = value.toLowerCase();
  if (VIEW_FALLBACKS[role]?.has(normalized)) {
    return normalized as DashboardView;
  }
  return "home";
}

export default async function DashboardCompatibilityPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const requestedRoleParam = Array.isArray(params?.role) ? params.role[0] : params?.role;
  const requestedViewParam = Array.isArray(params?.view) ? params.view[0] : params?.view;
  const requestedRole = normalizeDashboardRole(requestedRoleParam);

  const { sessionRole, cookieRole } = await getServerDashboardContext();

  const activeRole = sessionRole || requestedRole || cookieRole || null;

  if (!activeRole) {
    redirect("/login");
  }

  if (!sessionRole && !cookieRole) {
    redirect(getLoginPathForRole(requestedRole || activeRole));
  }

  const view = normalizeView(activeRole, requestedViewParam ?? null);
  redirect(getDashboardPath(activeRole, view));
}

