"use client";

import { TeacherForm } from "@/features/TeacherRegistration"
import { useRouter } from "next/navigation"
import { Icon } from "@/shared/ui"

export default function TeacherRegisterPage() {
    const router = useRouter();

    return (
        <div className="flex-1 w-full flex flex-col items-center mt-6 mb-10 px-6  mx-auto">
            {/* Top Back Arrow */}
            <div className="w-full mb-10">
                <button type="button" onClick={() => router.back()} className="text-[#3B3F6E] opacity-70 hover:opacity-100 transition-opacity p-2 -ml-2 cursor-pointer">
                    <Icon type="back" width={16} height={16} />
                </button>
            </div>

            <div className="w-full flex flex-col items-center">
                <h1 className="font-extrabold text-[#3B3F6E] text-[20px] mb-8 text-center">
                    Create your account
                </h1>
                <TeacherForm
                    onSuccess={(payload) => {
                        // Move into the holding screen flow (localStorage + storage-event advancement).
                        router.push(`/onboarding/verify-email?email=${encodeURIComponent(payload.workEmail)}`);
                    }}
                />
            </div>
        </div>
    )
}