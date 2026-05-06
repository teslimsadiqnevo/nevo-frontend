import { auth } from "@/features/Auth/api/auth";
import { cookies } from "next/headers";
import { normalizeDashboardRole, type DashboardRole } from "@/shared/lib";

export type CookieUser = {
  role?: string;
  id?: string;
  nevoId?: string;
  email?: string;
  name?: string;
  school_id?: string | number;
};

export type DashboardUser = Record<string, unknown> | CookieUser;

export async function getServerDashboardContext() {
  const session = await auth();
  const cookieStore = await cookies();
  const cookieUserRaw = cookieStore.get("user")?.value;

  let cookieUser: CookieUser | null = null;
  if (cookieUserRaw) {
    try {
      cookieUser = JSON.parse(decodeURIComponent(cookieUserRaw)) as CookieUser;
    } catch {
      cookieUser = null;
    }
  }

  const sessionRole = normalizeDashboardRole(
    (session?.user as { role?: string } | undefined)?.role,
  );
  const cookieRole = normalizeDashboardRole(cookieUser?.role);

  return {
    session,
    sessionRole,
    cookieUser,
    cookieRole,
  };
}

export function resolveDashboardUser(options: {
  sessionUser?: Record<string, unknown>;
  cookieUser: CookieUser | null;
  activeRole: DashboardRole;
  cookieRole: DashboardRole | null;
}) {
  const { sessionUser, cookieUser, activeRole, cookieRole } = options;
  const cookieMatchesRole =
    cookieUser &&
    cookieRole &&
    cookieRole === activeRole;

  return ((sessionUser as Record<string, unknown> | undefined) ??
    (cookieMatchesRole ? cookieUser : undefined) ??
    undefined) as DashboardUser | undefined;
}

