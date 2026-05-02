import { auth } from "@/features/Auth/api/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SchoolAdminDashboard, TeacherDashboard, StudentDashboard } from "@/features/Dashboard";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const session = await auth();
    const resolvedParams = await searchParams;
    const view = Array.isArray(resolvedParams?.view) ? resolvedParams.view[0] : resolvedParams?.view;

    const cookieStore = await cookies();
    const cookieUserRaw = cookieStore.get("user")?.value;
    let cookieUser: any = null;
    if (cookieUserRaw) {
        try {
            cookieUser = JSON.parse(decodeURIComponent(cookieUserRaw));
        } catch {
            cookieUser = null;
        }
    }

    // Fallback to the `user` cookie for teacher onboarding flows after verification.
    const role =
        (session?.user as any)?.role?.toLowerCase() ||
        cookieUser?.role?.toLowerCase() ||
        null;

    // If there is no session and no disconnected role, redirect to login
    if (!role) {
        redirect("/login/school"); // A sensible default redirect
    }

    if (role === "school_admin") {
        return <SchoolAdminDashboard user={(session?.user as any) || cookieUser} />;
    } else if (role === "teacher") {
        return <TeacherDashboard view={view || "home"} user={(session?.user as any) || cookieUser} />;
    } else if (role === "student") {
        const studentKey =
            (session?.user as any)?.id ||
            (session?.user as any)?.nevoId ||
            (session?.user as any)?.email ||
            (session?.user as any)?.name ||
            'student';
        return <StudentDashboard key={studentKey} view={view || "home"} user={(session?.user as any) || cookieUser} />;
    }

    return (
        <div className="p-8 flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold">Unknown Role</h1>
            <p className="mt-4 text-graphite-60">We couldn't determine your dashboard view.</p>
        </div>
    );
}
