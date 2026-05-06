export type DashboardRole = "student" | "teacher" | "school";

export type StudentDashboardView =
  | "home"
  | "lessons"
  | "downloads"
  | "progress"
  | "connect"
  | "profile";

export type TeacherDashboardView =
  | "home"
  | "lessons"
  | "students"
  | "insights"
  | "connect"
  | "profile";

export type SchoolDashboardView =
  | "home"
  | "classes"
  | "teachers"
  | "students"
  | "reports"
  | "settings";

export type DashboardView =
  | StudentDashboardView
  | TeacherDashboardView
  | SchoolDashboardView;

const STUDENT_VIEWS = new Set<StudentDashboardView>([
  "home",
  "lessons",
  "downloads",
  "progress",
  "connect",
  "profile",
]);

const TEACHER_VIEWS = new Set<TeacherDashboardView>([
  "home",
  "lessons",
  "students",
  "insights",
  "connect",
  "profile",
]);

const SCHOOL_VIEWS = new Set<SchoolDashboardView>([
  "home",
  "classes",
  "teachers",
  "students",
  "reports",
  "settings",
]);

export function normalizeDashboardRole(role: string | null | undefined): DashboardRole | null {
  if (!role) return null;
  const normalized = role.toLowerCase();
  if (normalized === "student") return "student";
  if (normalized === "teacher" || normalized === "tutor" || normalized === "tutors") {
    return "teacher";
  }
  if (normalized === "school" || normalized === "school_admin" || normalized === "admin") {
    return "school";
  }
  return null;
}

export function getLoginPathForRole(role: DashboardRole | null) {
  switch (role) {
    case "student":
      return "/login/student";
    case "teacher":
      return "/login/teacher";
    case "school":
      return "/login/school";
    default:
      return "/login";
  }
}

export function getDashboardRootPath(role: DashboardRole) {
  switch (role) {
    case "student":
      return "/student/dashboard";
    case "teacher":
      return "/tutors/dashboard";
    case "school":
      return "/school/dashboard";
  }
}

export function getDashboardPath(role: DashboardRole, view: DashboardView | null | undefined = "home") {
  const root = getDashboardRootPath(role);
  if (!view || view === "home") return root;
  return `${root}/${view}`;
}

export function getDashboardViewFromSlug(
  role: DashboardRole,
  slug: string[] | undefined,
): DashboardView | null {
  if (!slug || slug.length === 0) return "home";
  if (slug.length !== 1) return null;

  const value = slug[0]?.toLowerCase() as DashboardView | undefined;
  if (!value) return null;

  if (role === "student" && STUDENT_VIEWS.has(value as StudentDashboardView)) {
    return value;
  }
  if (role === "teacher" && TEACHER_VIEWS.has(value as TeacherDashboardView)) {
    return value;
  }
  if (role === "school" && SCHOOL_VIEWS.has(value as SchoolDashboardView)) {
    return value;
  }

  return null;
}

