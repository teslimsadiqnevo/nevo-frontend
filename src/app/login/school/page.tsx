import { SchoolLoginForm } from "@/features/SchoolLogin";
import { MiniFooter } from "@/widgets";

export default function SchoolLoginPage() {
    return(
        <div className="">
            <MiniFooter speaker />
            <div className="mt-15.25 flex flex-col items-center justify-center gap-10">
                <header className="flex flex-col items-center justify-center gap-4">
                    <h1 className="font-extrabold text-40px">School Admin Sign in</h1>
                </header>
                
                <SchoolLoginForm />
            </div>
        </div>
    )
}
