import { TeacherSidebar } from "@/widgets/TeacherSidebar";
import { DashboardCard } from "@/shared/ui";

export function TeacherDashboard() {
    return (
        <div className="flex bg-[#FDF0E1] font-sans h-screen w-full overflow-hidden">
            <TeacherSidebar />
            <main className="flex-1 px-[60px] py-[60px] overflow-y-auto">
                <div className="max-w-[800px]">
                    <h2 className="text-[26px] font-medium text-[#111111] leading-tight">Good afternoon</h2>
                    <p className="text-[#6B6B70] text-[14px] mt-1 mb-10">Here&apos;s a quick overview.</p>
                    
                    <div className="flex flex-col gap-6">
                        <DashboardCard 
                            title="Classes" 
                            subtitle="3 active classes" 
                            actionText="View classes" 
                            actionLink="#" 
                            imageSrc="/images/classes.png" 
                        />
                        <DashboardCard 
                            title="Lessons" 
                            subtitle="2 lessons currently assigned" 
                            actionText="Manage lessons" 
                            actionLink="#" 
                            imageSrc="/images/lessons.png" 
                        />
                        <DashboardCard 
                            title="Students needing support" 
                            subtitle="4 students may need help" 
                            actionText="View students" 
                            actionLink="#" 
                            imageSrc="/images/students.png" 
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
