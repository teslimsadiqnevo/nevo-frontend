import { StudentLoginForm } from "@/features/StudentLogin";
import { Input } from "@/shared/ui";
import { MiniFooter } from "@/widgets";

export default function StudentLoginPage(){
    return(
        <div className="">
            <MiniFooter speaker />
            <div className="mt-15.25 flex flex-col items-center justify-center gap-10">
                <header className="flex flex-col items-center justify-center gap-4">
                    <h1 className="font-extrabold text-40px">Student Sign in</h1>
                    <p className="font-medium text-xl text-graphite-70">Enter your Nevo ID and 4-digit PIN.</p>
                </header>
                
                <StudentLoginForm />
            </div>
        </div>
    )
}