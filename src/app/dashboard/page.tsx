import { auth } from "@/features/Auth/api/auth";
import { redirect } from "next/navigation";
import { SchoolAdminDashboard, TeacherDashboard, StudentDashboard } from "@/features/Dashboard";

export default async function DashboardPage() {
    const session = await auth();

    // If there is no session, redirect to the main login (or onboarding)
    if (!session || !session.user) {
        redirect("/login/teacher"); // A sensible default redirect
    }

    // Role-based rendering
    // Casting to any because NextAuth types might not have `role` explicitly extended yet
    const role = (session.user as any).role || null;

    if (role === "school_admin") {
        return <SchoolAdminDashboard />;
    } else if (role === "teacher") {
        return <TeacherDashboard />;
    } else if (role === "student") {
        return <StudentDashboard />;
    }

    return (
        <div className="p-8 flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold">Unknown Role</h1>
            <p className="mt-4 text-graphite-60">We couldn't determine your dashboard view.</p>
        </div>
    );
}
