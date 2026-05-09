'use client'

import { useEffect, useMemo, useState } from "react";
import {
    Onboarding,
    Connect,
    DynamicQuestion,
    getQuestions,
    AssessmentQuestion,
    CreatePIN,
    AdaptationSettings,
    StudentPermissions,
} from "@/features/RegistrationAssessment";
import { useLessonTts } from "@/features/LessonPlayer/api/useLessonTts";
import { useRegistrationStore } from "@/shared/store/useRegistrationStore";
import { SplashScreen } from "@/shared/ui/SplashScreen";
import { MiniFooter } from "@/widgets/MiniFooter";

type AssessmentAudioManifestEntry = {
    url: string;
    hash: string;
    text: string;
};

type AssessmentAudioManifest = Record<string, AssessmentAudioManifestEntry>;

export function AssessmentFlow() {
    const [step, setStep] = useState(1);
    const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
    const [audioManifest, setAudioManifest] = useState<AssessmentAudioManifest>({});
    const [isLoading, setIsLoading] = useState(true);
    const { setAssessmentAnswer } = useRegistrationStore();

    useEffect(() => {
        async function fetchQuestionsData() {
            setIsLoading(true);
            const [questionData, manifestResponse] = await Promise.all([
                getQuestions(),
                fetch('/assessment-audio/manifest.json', { cache: 'no-store' }).catch(() => null),
            ]);

            setQuestions(questionData);

            if (manifestResponse?.ok) {
                const manifestData = (await manifestResponse.json().catch(() => ({}))) as AssessmentAudioManifest;
                setAudioManifest(manifestData);
            } else {
                setAudioManifest({});
            }

            setIsLoading(false);
        }

        fetchQuestionsData();
    }, []);

    const activeQuestion = step <= questions.length ? questions[step - 1] ?? null : null;
    const activeQuestionId = activeQuestion?.id ?? null;
    const narrationText = useMemo(() => {
        if (!activeQuestion) return "";

        const optionsText = activeQuestion.options
            .map((option, index) => `Option ${index + 1}. ${option}.`)
            .join(" ");

        return `${activeQuestion.text} ${optionsText}`.trim();
    }, [activeQuestion]);
    const prefetchedAudioUrl =
        activeQuestionId !== null ? audioManifest[String(activeQuestionId)]?.url ?? null : null;

    const {
        isLoading: isNarrationLoading,
        isPlaying: isNarrationPlaying,
        togglePlayback: toggleNarration,
        replay: replayNarration,
        stop: stopNarration,
    } = useLessonTts(narrationText, prefetchedAudioUrl);

    useEffect(() => {
        if (!activeQuestionId || !narrationText.trim()) {
            stopNarration();
            return;
        }

        void replayNarration();

        return () => {
            stopNarration();
        };
    }, [activeQuestionId, narrationText, replayNarration, stopNarration]);

    const totalQuestions = questions.length || 7;

    const handleNextQuestion = (answerIdx: number) => {
        if (!questions[step - 1]) return;

        stopNarration();
        const currentQuestion = questions[step - 1];
        const answerText = currentQuestion.options[answerIdx];

        setAssessmentAnswer(currentQuestion.id.toString(), answerText);

        if (step === totalQuestions) {
            setIsLoading(true);
            setTimeout(() => {
                setIsLoading(false);
                setStep((currentStep) => currentStep + 1);
            }, 1000);
        } else {
            setStep((currentStep) => currentStep + 1);
        }
    };

    const handleNext = () => setStep((currentStep) => currentStep + 1);

    const isQuestionStep = step <= totalQuestions;
    const isPin = step === totalQuestions + 1;
    const isAdaptation = step === totalQuestions + 2;
    const isPermissions = step === totalQuestions + 3;
    const isOnboarding = step === totalQuestions + 4;
    const isConnect = step === totalQuestions + 5;

    return (
        <div className="flex min-h-screen flex-col">
            <MiniFooter
                speaker={isQuestionStep}
                onSpeakerClick={() => {
                    void toggleNarration();
                }}
                speakerActive={isNarrationPlaying}
                speakerLoading={isNarrationLoading}
            />
            <div className="flex w-full flex-1 flex-col items-center justify-between pb-6">
                <div className="w-full">
                    {isLoading ? (
                        <SplashScreen />
                    ) : (
                        <>
                            {isQuestionStep && questions[step - 1] ? (
                                <DynamicQuestion
                                    key={questions[step - 1].id}
                                    question={questions[step - 1]}
                                    number={step}
                                    totalQuestions={totalQuestions}
                                    onNext={handleNextQuestion}
                                />
                            ) : null}
                            {isPin ? <CreatePIN onNext={handleNext} onBack={() => setStep(step - 1)} /> : null}
                            {isAdaptation ? <AdaptationSettings onNext={handleNext} /> : null}
                            {isPermissions ? <StudentPermissions onNext={handleNext} /> : null}
                            {isOnboarding ? <Onboarding onNext={handleNext} /> : null}
                            {isConnect ? <Connect /> : null}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
