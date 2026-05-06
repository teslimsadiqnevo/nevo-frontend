import { redirect } from "next/navigation";
import { TeacherDashboard } from "@/features/Dashboard/ui/TeacherDashboard";
import {
  getDashboardPath,
  getDashboardViewFromSlug,
  getLoginPathForRole,
} from "@/shared/lib";
import {
  getServerDashboardContext,
  resolveDashboardUser,
} from "@/features/Dashboard/lib/serverDashboardContext";

export default async function TutorsDashboardPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const view = getDashboardViewFromSlug("teacher", slug);
  if (!view) {
    redirect(getDashboardPath("teacher", "home"));
  }

  const { session, sessionRole, cookieUser, cookieRole } =
    await getServerDashboardContext();

  if (!sessionRole) {
    redirect(getLoginPathForRole("teacher"));
  }

  if (sessionRole !== "teacher") {
    redirect(getDashboardPath(sessionRole, "home"));
  }

  const resolvedUser = resolveDashboardUser({
    sessionUser: session?.user as Record<string, unknown> | undefined,
    cookieUser,
    activeRole: "teacher",
    cookieRole,
  });

  return <TeacherDashboard view={view} user={resolvedUser as any} />;
}
