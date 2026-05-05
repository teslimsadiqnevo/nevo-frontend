'use client'

import { useState, Suspense } from "react";
import { Step1, Step2, Step3 } from "@/features/StudentRegistration";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SplashScreen } from "@/shared/ui/SplashScreen";

function StudentRegistrationFlow() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    
    // Read step from URL, default to 1
    const step = Number(searchParams.get('step')) || 1;

    const [isCompleting, setIsCompleting] = useState(false);

    const setStep = (newStep: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('step', newStep.toString());
        router.push(`${pathname}?${params.toString()}`);
    }
    
    // Also trigger loading on completion push
    const handleComplete = () => {
        setIsCompleting(true);
        router.push('/register/assessment');
    }

    if (isCompleting) {
        return <SplashScreen />;
    }

    return (
        <div className="flex flex-col min-h-screen">
            <div className={step === 1 ? 'block' : 'hidden'}>
                <Step1 onNext={() => setStep(2)} />
            </div>
            
            <div className={step === 2 ? 'block' : 'hidden'}>
                <Step2 onNext={() => { setStep(3); }} onBack={() => setStep(1)} />
            </div>
            
            <div className={step === 3 ? 'block' : 'hidden'}>
                <Step3 onNext={handleComplete} onBack={() => setStep(2)} />
            </div>
        </div>
    )
}

export default function StudentRegisterPage() {
    return (
        <Suspense fallback={<SplashScreen />}>
            <StudentRegistrationFlow />
        </Suspense>
    )
}
