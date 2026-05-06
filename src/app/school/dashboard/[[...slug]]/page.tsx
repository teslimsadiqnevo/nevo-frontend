import { redirect } from "next/navigation";
import { SchoolAdminDashboard } from "@/features/Dashboard/ui/SchoolAdminDashboard";
import {
  getDashboardPath,
  getDashboardViewFromSlug,
  getLoginPathForRole,
} from "@/shared/lib";
import {
  getServerDashboardContext,
  resolveDashboardUser,
} from "@/features/Dashboard/lib/serverDashboardContext";

export default async function SchoolDashboardPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const view = getDashboardViewFromSlug("school", slug);
  if (!view) {
    redirect(getDashboardPath("school", "home"));
  }

  const { session, sessionRole, cookieUser, cookieRole } =
    await getServerDashboardContext();

  if (!sessionRole) {
    redirect(getLoginPathForRole("school"));
  }

  if (sessionRole !== "school") {
    redirect(getDashboardPath(sessionRole, "home"));
  }

  const resolvedUser = resolveDashboardUser({
    sessionUser: session?.user as Record<string, unknown> | undefined,
    cookieUser,
    activeRole: "school",
    cookieRole,
  });

  return <SchoolAdminDashboard view={view} user={resolvedUser as any} />;
}
