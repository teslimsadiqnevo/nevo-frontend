'use client'

import { useState } from "react";
import { MiniFooter } from "@/widgets";
import { Step1, Step2, Step3 } from "@/features/StudentRegistration";
import { useRouter } from "next/navigation";

export default function StudentRegisterPage() {
    const [step, setStep] = useState(1);
    const router = useRouter();

    return (
        <div className="">
            <MiniFooter />
            {step === 1 && <Step1 onNext={() => setStep(2)} />}
            {step === 2 && <Step2 onNext={() => setStep(3)} />}
            {step === 3 && <Step3 onNext={() => router.push('/register/assessment')} />}
        </div>
    )
}