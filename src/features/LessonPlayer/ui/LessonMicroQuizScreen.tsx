'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LessonMicroQuizQuestion, LessonMicroQuizResultState, LessonPlayerData } from '../api/types';
import { LessonMicroQuizPromptOverlay } from './LessonMicroQuizPromptOverlay';

type LessonMicroQuizScreenProps = {
    lessonId: string;
    data: LessonPlayerData;
    index: number;
};

function OptionStateRow({
    optionLabel,
    letter,
    state,
    selected,
    onClick,
}: {
    optionLabel: string;
    letter: string;
    state: 'default' | 'selected' | 'correct' | 'incorrect';
    selected: boolean;
    onClick: () => void;
}) {
    const stateClass =
        state === 'correct'
            ? 'bg-[#7AB87A] border-[#7AB87A]'
            : state === 'incorrect'
              ? 'bg-[#E8A84A] border-[#E8A84A]'
              : selected
                ? 'bg-parchment border-2 border-indigo'
                : 'bg-parchment border border-[#E0D9CE]';

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center rounded-xl px-4 py-[18px] text-left ${stateClass} ${state === 'correct' || state === 'incorrect' ? 'cursor-default' : 'cursor-pointer'}`}
        >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo/15 text-[13px] font-semibold text-indigo shrink-0">
                {letter}
            </div>
            <span className="ml-3 text-[15px] leading-[22px] text-graphite">{optionLabel}</span>
            {state === 'correct' ? (
                <svg className="ml-auto" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 8L7 11L12 5.5" stroke="#3B3F6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ) : null}
            {state === 'incorrect' ? (
                <svg className="ml-auto" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M5 5L11 11" stroke="#3B3F6E" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M11 5L5 11" stroke="#3B3F6E" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            ) : null}
        </button>
    );
}

export function LessonMicroQuizScreen({ lessonId, data, index }: LessonMicroQuizScreenProps) {
    const router = useRouter();
    const safeIndex = Math.max(0, Math.min(index, data.microQuiz.length - 1));
    const question: LessonMicroQuizQuestion = data.microQuiz[safeIndex];
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [resultState, setResultState] = useState<LessonMicroQuizResultState>('idle');
    const [incorrectAttempts, setIncorrectAttempts] = useState(0);
    const [activePromptIndex, setActivePromptIndex] = useState<number | null>(null);
    const [showSupportExplanation, setShowSupportExplanation] = useState(false);
    const [showHint, setShowHint] = useState(false);

    const selectedOption = useMemo(
        () => question.options.find((option) => option.id === selectedOptionId) ?? null,
        [question.options, selectedOptionId]
    );

    const simplifiedExplanation = question.explanation.split('. ')[0]?.trim();

    const submit = () => {
        if (!selectedOptionId) return;

        if (selectedOptionId === question.correctOptionId) {
            setResultState('correct');
            return;
        }

        const nextPromptIndex = Math.min(incorrectAttempts, question.feedbackPrompts.length - 1);
        setResultState('incorrect');
        setActivePromptIndex(nextPromptIndex);
        setIncorrectAttempts((current) => current + 1);
    };

    const resetForRetry = () => {
        setResultState('idle');
        setSelectedOptionId(null);
        setActivePromptIndex(null);
    };

    const continueFlow = () => {
        if (safeIndex < data.microQuiz.length - 1) {
            router.push(`/lesson/${lessonId}/micro-quiz?index=${safeIndex + 1}`);
            return;
        }

        router.push(`/lesson/${lessonId}/complete`);
    };

    const activePrompt = activePromptIndex !== null ? question.feedbackPrompts[activePromptIndex] : null;

    return (
        <div className="flex min-h-screen justify-center bg-white px-0 py-0 sm:px-4 sm:py-6 lg:px-6 lg:py-10">
            <div className="relative flex min-h-screen w-full max-w-[1024px] flex-col bg-parchment shadow-[0_0_0_1px_rgba(224,217,206,0.4)] sm:min-h-[900px]">
                <div className="h-1 w-full bg-[#E0D9CE]">
                    <div className="h-full bg-indigo" style={{ width: `${question.progressPercent}%` }} />
                </div>

                <div className="flex items-center justify-between px-4 pt-4 pb-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex h-5 w-5 items-center justify-center bg-transparent border-none cursor-pointer"
                        aria-label="Back"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M12.5 4L6.5 10L12.5 16" stroke="#3B3F6E" strokeWidth="1.875" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>

                    <span className="text-[13px] leading-5 text-indigo/60">{question.progressLabel}</span>
                </div>

                <div className="px-4 pt-8 sm:px-6 lg:px-8">
                    <h1 className="text-[17px] font-semibold leading-6 text-indigo">{question.prompt}</h1>
                    {showSupportExplanation ? (
                        <p className="mt-3 text-[14px] leading-[21px] text-graphite/65">
                            {simplifiedExplanation?.endsWith('.') ? simplifiedExplanation : `${simplifiedExplanation}.`}
                        </p>
                    ) : null}
                    {showHint && question.feedbackPrompts[2]?.hintLabel ? (
                        <div className="mt-3 rounded-lg bg-lavender-10 px-3 py-3 text-[15px] leading-6 text-graphite">
                            {question.feedbackPrompts[2].hintLabel}
                        </div>
                    ) : null}
                </div>

                <div className="px-4 pt-6 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-2">
                        {question.options.map((option, optionIndex) => {
                            let state: 'default' | 'selected' | 'correct' | 'incorrect' = 'default';
                            const letter = String.fromCharCode(65 + optionIndex);

                            if (resultState === 'idle' && selectedOptionId === option.id) {
                                state = 'selected';
                            }
                            if (resultState === 'correct' && option.id === question.correctOptionId) {
                                state = 'correct';
                            }
                            if (resultState === 'incorrect' && selectedOptionId === option.id) {
                                state = 'incorrect';
                            }

                            return (
                                <OptionStateRow
                                    key={option.id}
                                    optionLabel={option.label}
                                    letter={letter}
                                    state={state}
                                    selected={selectedOptionId === option.id}
                                    onClick={() => {
                                        if (resultState !== 'idle') return;
                                        setSelectedOptionId(option.id);
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>

                <div className="px-4 pt-4 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        onClick={resultState === 'correct' ? continueFlow : submit}
                        disabled={resultState === 'idle' && !selectedOption}
                        className={[
                            'h-[52px] w-full rounded-xl text-[15px] font-semibold text-parchment border-none',
                            resultState === 'idle' && !selectedOption ? 'bg-indigo/30 cursor-not-allowed' : 'bg-indigo cursor-pointer',
                        ].join(' ')}
                    >
                        {resultState === 'correct' ? question.continueLabel : data.assessment.submitLabel}
                    </button>
                </div>

                {activePrompt ? (
                    <LessonMicroQuizPromptOverlay
                        prompt={activePrompt}
                        onPrimary={() => {
                            if (activePromptIndex === 0 || activePromptIndex === 1) {
                                setShowSupportExplanation(true);
                            }
                            if (activePromptIndex === 2) {
                                setShowHint(true);
                            }
                            resetForRetry();
                        }}
                        onSecondary={() => {
                            if (activePromptIndex === 2) {
                                setShowSupportExplanation(true);
                            }
                            resetForRetry();
                        }}
                    />
                ) : null}
            </div>
        </div>
    );
}
