import { SchoolLoginForm } from "@/features/SchoolLogin";
import { Icon } from "@/shared/ui";
import Link from "next/link";

export default function SchoolLoginPage() {
    return(
        <div className="flex-1 w-full flex flex-col items-center justify-center p-6 bg-[#F7F1E6] min-h-screen">
            <Link href="/" className="mb-6"><Icon type="default" width={113} height={34} /></Link>
            
            <div className="w-full max-w-[420px] flex flex-col items-center pt-2">
                <h1 className="font-bold text-[#3B3F6E] text-[20px] mb-8 text-center tracking-tight">School admin login</h1>
                <SchoolLoginForm />
            </div>
        </div>
    )
}
