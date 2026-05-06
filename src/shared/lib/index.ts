export { FooterLinks } from "./links";
export { NavLinks } from "./links";
export { features } from "./lib";
export { pathLinks } from "./lib";
export { works } from "./lib";
export { roles } from "./lib";
export { getInitials } from "./getInitials";
export { getApiTokenExpiryMs, isApiTokenExpired } from "./apiTokenExpiry";
export { useApiTokenExpiryRedirect } from "./useApiTokenExpiryRedirect";
export { useAuthGuard } from "./useAuthGuard";
export type { AuthRole } from "./useAuthGuard";
export {
  getDashboardPath,
  getDashboardRootPath,
  getDashboardViewFromSlug,
  getLoginPathForRole,
  normalizeDashboardRole,
} from "./dashboardRoutes";
export type {
  DashboardRole,
  DashboardView,
  StudentDashboardView,
  TeacherDashboardView,
  SchoolDashboardView,
} from "./dashboardRoutes";
