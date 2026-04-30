import { StudentLoginForm } from "@/features/StudentLogin";
import { Input } from "@/shared/ui";
import { MiniFooter } from "@/widgets";

export default function StudentLoginPage(){
    return(
        <div className="">
            <MiniFooter speaker />
            <div className="mt-12 flex flex-col items-center justify-center gap-8">
                <header className="flex flex-col items-center justify-center gap-2">
                    <h1 className="font-extrabold text-[#3B3F6E] text-[22px]">Welcome back</h1>
                    <p className="font-medium text-[13px] text-graphite-60">Log in with your Nevo ID and PIN.</p>
                </header>
                
                <StudentLoginForm />
            </div>
        </div>
    )
}