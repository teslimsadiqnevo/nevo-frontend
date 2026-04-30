import { TeacherLoginForm } from "@/features/TeacherLogin";
import { Icon } from "@/shared/ui";
import Link from "next/link";

export default function TeacherLoginPage() {
    return(
        <div className="flex-1 w-full flex flex-col items-center justify-center p-6 bg-[#F6F5F2] min-h-screen">
            <Link href="/" className="flex items-center justify-center gap-[6px] mb-8">
                <Icon type="default" width={113} height={34} />
            </Link>

            <div className="flex flex-col items-center w-full max-w-[420px]">
                <h1 className="font-extrabold text-[#3B3F6E] text-[22px] mb-[6px] text-center">Welcome back</h1>
                <p className="text-[13px] text-graphite opacity-60 font-medium mb-10 text-center">Log in to your teacher account.</p>
                
                <TeacherLoginForm />
            </div>
        </div>
    )
}
