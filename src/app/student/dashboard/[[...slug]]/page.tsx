import { redirect } from "next/navigation";
import { StudentDashboard } from "@/features/Dashboard/ui/StudentDashboard";
import {
  getDashboardPath,
  getDashboardViewFromSlug,
  getLoginPathForRole,
} from "@/shared/lib";
import {
  getServerDashboardContext,
  resolveDashboardUser,
} from "@/features/Dashboard/lib/serverDashboardContext";

export default async function StudentDashboardPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const view = getDashboardViewFromSlug("student", slug);
  if (!view) {
    redirect(getDashboardPath("student", "home"));
  }

  const { session, sessionRole, cookieUser, cookieRole } =
    await getServerDashboardContext();

  if (!sessionRole) {
    redirect(getLoginPathForRole("student"));
  }

  if (sessionRole !== "student") {
    redirect(getDashboardPath(sessionRole, "home"));
  }

  const resolvedUser = resolveDashboardUser({
    sessionUser: session?.user as Record<string, unknown> | undefined,
    cookieUser,
    activeRole: "student",
    cookieRole,
  });

  return <StudentDashboard view={view} user={resolvedUser} />;
}
