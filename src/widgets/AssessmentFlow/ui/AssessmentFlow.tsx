'use client'

import { useState, useEffect } from "react";
import { Onboarding, Connect, DynamicQuestion, getQuestions, AssessmentQuestion, CreatePIN, AdaptationSettings } from "@/features/RegistrationAssessment";
import { MiniFooter } from "@/widgets/MiniFooter";
import { useRouter } from "next/navigation";
import { SplashScreen } from "@/shared/ui/SplashScreen";
import { useRegistrationStore } from "@/shared/store/useRegistrationStore";

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

export function AssessmentFlow() {
    const [step, setStep] = useState(1);
    const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { assessmentAnswers, setAssessmentAnswer } = useRegistrationStore();
    const router = useRouter();

    useEffect(() => {
        async function fetchQuestionsData() {
            setIsLoading(true);
            const data = await getQuestions();
            setQuestions(data);
            setIsLoading(false);
        }
        fetchQuestionsData();
    }, []);

    const totalQuestions = questions.length || 7; 

    const handleNextQuestion = (answerIdx: number) => {
        if (!questions[step - 1]) return;
        const currentQId = questions[step - 1].id;
        const answerText = questions[step - 1].options[answerIdx];
        
        setAssessmentAnswer(currentQId.toString(), answerText);
        
        if (step === totalQuestions) {
            setIsLoading(true);
            setTimeout(() => {
                setIsLoading(false);
                setStep(s => s + 1);
            }, 1000);
        } else {
            setStep(s => s + 1);
        }
    };

    const handleNext = () => setStep(s => s + 1);
    const handleFinish = () => router.push("/");

    const isQuestionStep = step <= totalQuestions;
    const isPin = step === totalQuestions + 1;
    const isAdaptation = step === totalQuestions + 2;
    const isOnboarding = step === totalQuestions + 3;
    const isConnect = step === totalQuestions + 4;
    // Answers are now stored globally inside useRegistrationStore

    return (
        <div className="flex flex-col min-h-screen">
            <MiniFooter speaker={!isConnect} />
            <div className="flex-1 pb-6 w-full flex flex-col justify-between items-center">
                <div className="w-full">
                    {isLoading ? (
                        <SplashScreen />
                    ) : (
                        <>
                            {isQuestionStep && questions[step - 1] && (
                                <DynamicQuestion 
                                    key={questions[step - 1].id}
                                    question={questions[step - 1]} 
                                    number={step}
                                    totalQuestions={totalQuestions}
                                    onNext={handleNextQuestion} 
                                />
                            )}
                            {isPin && <CreatePIN onNext={handleNext} onBack={() => setStep(step - 1)} />}
                            {isAdaptation && <AdaptationSettings onNext={handleNext} />}
                            {isOnboarding && <Onboarding onNext={handleNext} />}
                            {isConnect && <Connect />}
                        </>
                    )}
                </div>
                {/* {step < FOOTER_TEXTS.length && !isLoading && (
                    <p className="font-medium text-sm text-graphite-60 mt-auto pt-6 text-center">
                        {FOOTER_TEXTS[step] || ""}
                    </p>
                )} */}
            </div>
        </div>
    )
}
