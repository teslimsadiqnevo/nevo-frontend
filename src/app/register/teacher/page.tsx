"use client";

import { TeacherForm } from "@/features/TeacherRegistration"
import { useRouter } from "next/navigation"
import { Icon } from "@/shared/ui"

export default function TeacherRegisterPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen w-full bg-[#F7F1E6]">
            <div className="mx-auto flex w-full max-w-[1024px] flex-col px-5 pb-10 pt-5 md:px-6 md:pb-[72px]">
                <div className="h-16 w-full">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex h-11 w-11 items-center justify-center rounded-[12px] p-0 text-[#3B3F6E] hover:bg-[#3B3F6E]/5 transition-colors cursor-pointer"
                    >
                    <Icon type="back" width={16} height={16} />
                    </button>
                </div>

                <div className="flex w-full flex-col items-center pt-8 md:pt-8">
                    <h1 className="text-center text-[22px] font-bold leading-[33px] text-[#3B3F6E]">
                        Create your account
                    </h1>

                    <div className="w-full pt-10">
                        <TeacherForm
                            onSuccess={(payload) => {
                                router.push(`/onboarding/verify-email?email=${encodeURIComponent(payload.workEmail)}`);
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
