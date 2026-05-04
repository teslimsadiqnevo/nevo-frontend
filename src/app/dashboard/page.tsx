import { auth } from "@/features/Auth/api/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import dynamic from "next/dynamic";

const SchoolAdminDashboard = dynamic(
  () =>
    import("@/features/Dashboard/ui/SchoolAdminDashboard").then(
      (mod) => mod.SchoolAdminDashboard,
    ),
  {
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F1E6] text-[14px] text-[#2B2B2F]/60">
        Loading dashboard...
      </div>
    ),
  },
);

const TeacherDashboard = dynamic(
  () =>
    import("@/features/Dashboard/ui/TeacherDashboard").then(
      (mod) => mod.TeacherDashboard,
    ),
  {
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F1E6] text-[14px] text-[#2B2B2F]/60">
        Loading dashboard...
      </div>
    ),
  },
);

const StudentDashboard = dynamic(
  () =>
    import("@/features/Dashboard/ui/StudentDashboard").then(
      (mod) => mod.StudentDashboard,
    ),
  {
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F1E6] text-[14px] text-[#2B2B2F]/60">
        Loading dashboard...
      </div>
    ),
  },
);

type CookieUser = {
  role?: string;
  id?: string;
  nevoId?: string;
  email?: string;
  name?: string;
  school_id?: string | number;
};

type DashboardUser = Record<string, unknown> | CookieUser;

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const session = await auth();
    const resolvedParams = await searchParams;
    const view = Array.isArray(resolvedParams?.view) ? resolvedParams.view[0] : resolvedParams?.view;

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

    // Fallback to the `user` cookie for teacher onboarding flows after verification.
    const role =
        (session?.user as { role?: string } | undefined)?.role?.toLowerCase() ||
        cookieUser?.role?.toLowerCase() ||
        null;

    // If there is no session and no disconnected role, redirect to login
    if (!role) {
        redirect("/login/school"); // A sensible default redirect
    }

    const resolvedUser = ((session?.user as Record<string, unknown> | undefined) ??
        cookieUser ??
        undefined) as DashboardUser | undefined;

    if (role === "school_admin") {
        return (
          <SchoolAdminDashboard
            user={resolvedUser}
          />
        );
    } else if (role === "teacher") {
        return (
          <TeacherDashboard
            view={view || "home"}
            user={resolvedUser}
          />
        );
    } else if (role === "student") {
        const studentKey =
            (session?.user as { id?: string; nevoId?: string; email?: string; name?: string } | undefined)?.id ||
            (session?.user as { id?: string; nevoId?: string; email?: string; name?: string } | undefined)?.nevoId ||
            (session?.user as { id?: string; nevoId?: string; email?: string; name?: string } | undefined)?.email ||
            (session?.user as { id?: string; nevoId?: string; email?: string; name?: string } | undefined)?.name ||
            'student';
        return (
          <StudentDashboard
            key={studentKey}
            view={view || "home"}
            user={resolvedUser}
          />
        );
    }

    return (
        <div className="p-8 flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold">Unknown Role</h1>
            <p className="mt-4 text-graphite-60">We couldn&apos;t determine your dashboard view.</p>
        </div>
    );
}
