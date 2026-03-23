import { TeacherLoginForm } from "@/features/TeacherLogin";
import { MiniFooter } from "@/widgets";

export default function TeacherLoginPage() {
    return(
        <div className="">
            <MiniFooter speaker />
            <div className="mt-15.25 flex flex-col items-center justify-center gap-10">
                <header className="flex flex-col items-center justify-center gap-4">
                    <h1 className="font-extrabold text-40px">Teacher Sign in</h1>
                </header>
                
                <TeacherLoginForm />
            </div>
        </div>
    )
}
