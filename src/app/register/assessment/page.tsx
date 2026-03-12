'use client'

import { useState } from "react";
import { Question1, Question2, Question3, Question4, Question5, Question6, Question7, Completion, Onboarding, Connect } from "@/features/RegistrationAssessment";
import { MiniFooter } from "@/widgets";
import { useRouter } from "next/navigation";

const FOOTER_TEXTS = [
    "",
    "Tap one option — Nevo will adapt lessons to you.",
    "There’s no wrong answer — this helps Nevo adjust pacing.",
    "Nevo uses this to support you when learning feels difficult.",
    "This helps Nevo match your learning rhythm.",
    "Nevo uses this to support you when learning feels difficult.",
    "Nevo uses this to support you without pressure.",
    "Nevo will use this to create a calmer learning experience.",
    "Nevo doesn't label you. It simply adapts to support you better.",
    "If you ever forget your PIN, your teacher can help you reset it."
];

export default function AssessmentPage() {
    const [step, setStep] = useState(1);
    const router = useRouter();

    const handleNext = () => setStep(s => s + 1);
    const handleFinish = () => router.push("/");

    return (
        <div className="flex flex-col min-h-screen">
            <MiniFooter speaker={step !== 10} />
            <div className="flex-1 pb-6 w-full flex flex-col justify-between items-center">
                <div className="w-full">
                    {step === 1 && <Question1 onNext={handleNext} />}
                    {step === 2 && <Question2 onNext={handleNext} />}
                    {step === 3 && <Question3 onNext={handleNext} />}
                    {step === 4 && <Question4 onNext={handleNext} />}
                    {step === 5 && <Question5 onNext={handleNext} />}
                    {step === 6 && <Question6 onNext={handleNext} />}
                    {step === 7 && <Question7 onNext={handleNext} />}
                    {step === 8 && <Completion onNext={handleNext} />}
                    {step === 9 && <Onboarding onNext={handleNext} />}
                    {step === 10 && <Connect />}
                </div>
                {step <= 9 && (
                    <p className="font-medium text-sm text-graphite-60 mt-auto pt-6 text-center">
                        {FOOTER_TEXTS[step]}
                    </p>
                )}
            </div>
        </div>
    )
}