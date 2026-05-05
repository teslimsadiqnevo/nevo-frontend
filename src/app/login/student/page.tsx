import { StudentLoginForm } from "@/features/StudentLogin";
import Link from "next/link";
import { NevoLogo } from "@/shared/ui";

export default function StudentLoginPage() {
    return (
        <div className="min-h-screen w-full bg-[#F7F1E6]">
            <div className="mx-auto flex min-h-screen w-full max-w-[1024px] flex-col items-center px-8 pb-10 pt-8">
                <div className="flex w-full items-start justify-start">
                    <Link
                        href="/login"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#3B3F6E] transition-colors hover:bg-[#3B3F6E]/5"
                        aria-label="Back to welcome screen"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12.5 4.5L7 10L12.5 15.5" />
                        </svg>
                    </Link>
                </div>

                <div className="mt-[-24px] flex flex-col items-center">
                    <NevoLogo width={113} height={34} className="h-[34px] w-auto" />
                </div>

                <div className="mt-8 flex w-full flex-1 flex-col items-center">
                    <div className="flex w-full max-w-[520px] flex-col items-center px-8">
                        <header className="flex flex-col items-center">
                            <h1 className="text-center text-[22px] font-bold leading-[33px] text-[#3B3F6E]">
                                Welcome back
                            </h1>
                            <p className="mt-2 text-center text-[14px] leading-[21px] text-[#2B2B2F]/60">
                                Log in with your Nevo ID and PIN.
                            </p>
                        </header>

                        <div className="mt-8">
                            <StudentLoginForm />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
