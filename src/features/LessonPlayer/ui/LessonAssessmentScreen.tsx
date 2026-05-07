'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRegistrationStore, type LearningMode } from '@/shared/store/useRegistrationStore';
import { useLessonTts } from '../api/useLessonTts';
import type {
    LessonAssessmentOption,
    LessonAssessmentQuestion,
    LessonAssessmentVariant,
    LessonPlayerData,
} from '../api/types';

type LessonAssessmentScreenProps = {
    lessonId: string;
    data: LessonPlayerData;
};

type AssessmentView = 'question' | 'correct' | 'incorrect' | 'correction';

function getAssessmentVariant(age: string, mode: LearningMode): LessonAssessmentVariant {
    const ageNumber = Number.parseInt(age, 10);
    if (!Number.isNaN(ageNumber) && ageNumber <= 9) {
        return 'kids';
    }
    return mode;
}

function AssessmentIcon({ option, kids }: { option: LessonAssessmentOption; kids: boolean }) {
    const color = option.color ?? '#9A9CCB';
    const icon = option.icon;

    if (kids) {
        return (
            <div className="flex h-16 w-16 items-center justify-center shrink-0">
                {icon === 'sun' ? (
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <circle cx="32" cy="32" r="12" fill={color} />
                        <path d="M32 8V18" stroke={color} strokeWidth="3" strokeLinecap="round" />
                        <path d="M32 46V56" stroke={color} strokeWidth="3" strokeLinecap="round" />
                        <path d="M8 32H18" stroke={color} strokeWidth="3" strokeLinecap="round" />
                        <path d="M46 32H56" stroke={color} strokeWidth="3" strokeLinecap="round" />
                        <path d="M15 15L22 22" stroke={color} strokeWidth="3" strokeLinecap="round" />
                        <path d="M42 42L49 49" stroke={color} strokeWidth="3" strokeLinecap="round" />
                        <path d="M15 49L22 42" stroke={color} strokeWidth="3" strokeLinecap="round" />
                        <path d="M42 22L49 15" stroke={color} strokeWidth="3" strokeLinecap="round" />
                    </svg>
                ) : null}
                {icon === 'leaf' ? (
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <path d="M52 12C38 13 22 21 16 38C13 46 16 52 24 52C42 52 50 34 52 12Z" fill={color} />
                        <path d="M20 44C28 38 35 31 43 20" stroke="#F7F1E6" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                ) : null}
                {icon === 'drop' ? (
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <path d="M32 10C26 20 18 29 18 39C18 47 24 54 32 54C40 54 46 47 46 39C46 29 38 20 32 10Z" fill={color} />
                    </svg>
                ) : null}
            </div>
        );
    }

    if (icon === 'speaker') {
        return (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0 opacity-30">
                <path d="M8 11V17H12L16 20.5V7.5L12 11H8Z" stroke="#3B3F6E" strokeWidth="1.75" strokeLinejoin="round" />
                <path d="M19 10C20 11 20 17 19 18" stroke="#3B3F6E" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
        );
    }

    if (icon === 'seedling') {
        return (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="shrink-0">
                <path d="M16 6V12" stroke="#3B3F6E" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                <path d="M12 22C12 16.5 14.5 13 16 13C17.5 13 20 16.5 20 22" stroke="#3B3F6E" strokeWidth="1.5" opacity="0.6" />
                <path d="M16 15C12.5 15 9.5 12.5 9.5 9.5C13.5 9.5 16 12 16 15Z" stroke="#3B3F6E" strokeWidth="1.5" opacity="0.6" />
                <path d="M16 15C19.5 15 22.5 12.5 22.5 9.5C18.5 9.5 16 12 16 15Z" stroke="#3B3F6E" strokeWidth="1.5" opacity="0.6" />
            </svg>
        );
    }

    return (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-lavender-10 shrink-0">
            {icon === 'sun' ? (
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="opacity-60">
                    <circle cx="24" cy="24" r="10" fill="#9A9CCB" />
                    <path d="M24 4V10" stroke="#9A9CCB" strokeWidth="2" strokeLinecap="round" />
                    <path d="M24 38V44" stroke="#9A9CCB" strokeWidth="2" strokeLinecap="round" />
                    <path d="M4 24H10" stroke="#9A9CCB" strokeWidth="2" strokeLinecap="round" />
                    <path d="M38 24H44" stroke="#9A9CCB" strokeWidth="2" strokeLinecap="round" />
                </svg>
            ) : null}
            {icon === 'leaf' ? (
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="opacity-60">
                    <path d="M39 10C28 11 16 17 12 30C10 36 13 39 18 39C32 39 38 26 39 10Z" fill="#9A9CCB" />
                </svg>
            ) : null}
            {icon === 'water' || icon === 'drop' ? (
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="opacity-60">
                    <path d="M24 8C19 16 13 23 13 31C13 37.5 18.5 43 24 43C29.5 43 35 37.5 35 31C35 23 29 16 24 8Z" fill="#9A9CCB" />
                </svg>
            ) : null}
        </div>
    );
}

function getPromptWidthClass(variant: LessonAssessmentVariant) {
    if (variant === 'kids') return 'max-w-[226px] text-[18px] font-normal leading-7';
    if (variant === 'action') return 'max-w-[572px] text-[19px] font-semibold leading-7';
    return 'max-w-[520px] text-[19px] font-semibold leading-7';
}

function AssessmentQuestionView({
    variant,
    question,
    prompt,
    helperLabel,
    submitLabel,
    helperText,
    selectedOptionId,
    onSelect,
    onSubmit,
}: {
    variant: LessonAssessmentVariant;
    question: LessonAssessmentQuestion;
    prompt: string;
    helperLabel?: string;
    submitLabel: string;
    helperText: string;
    selectedOptionId: string | null;
    onSelect: (optionId: string) => void;
    onSubmit: () => void;
}) {
    const isKids = variant === 'kids';
    const optionTextClass = isKids ? 'text-[16px] font-semibold' : 'text-[15px] font-medium';
    const { isLoading, isPlaying, error, togglePlayback } = useLessonTts(prompt);

    return (
        <>
            {variant === 'visual' ? (
                <div className="flex h-20 w-[120px] items-center justify-center">
                    <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
                        <rect x="20" y="20" width="40" height="40" stroke="#3B3F6E" strokeOpacity="0.3" strokeWidth="2" />
                        <rect x="40" y="20" width="40" height="40" stroke="#3B3F6E" strokeOpacity="0.3" strokeWidth="2" />
                        <rect x="60" y="20" width="40" height="40" stroke="#3B3F6E" strokeOpacity="0.3" strokeWidth="2" />
                        <path d="M40 40H80" stroke="#9A9CCB" strokeWidth="2" />
                    </svg>
                </div>
            ) : null}

            {variant === 'audio' ? (
                <button
                    type="button"
                    onClick={() => {
                        void togglePlayback();
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo border-none cursor-pointer"
                    aria-label={isPlaying ? 'Pause question audio' : 'Play question audio'}
                >
                    {isPlaying ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <rect x="4" y="3" width="3" height="10" rx="1" fill="#F7F1E6" />
                            <rect x="9" y="3" width="3" height="10" rx="1" fill="#F7F1E6" />
                        </svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M5 3L12 8L5 13V3Z" fill="#F7F1E6" />
                        </svg>
                    )}
                </button>
            ) : null}

            {(variant === 'kids' || variant === 'reading') && helperLabel ? (
                <div className="flex flex-col items-center">
                    <button
                        type="button"
                        onClick={() => {
                            void togglePlayback();
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo border-none cursor-pointer"
                        aria-label={isPlaying ? 'Pause question audio' : 'Play question audio'}
                    >
                        {isPlaying ? (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <rect x="3.5" y="2.5" width="2.5" height="9" rx="1" fill="#F7F1E6" />
                                <rect x="8" y="2.5" width="2.5" height="9" rx="1" fill="#F7F1E6" />
                            </svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M4 2.5L10.5 7L4 11.5V2.5Z" fill="#F7F1E6" />
                            </svg>
                        )}
                    </button>
                    <span className="mt-1.5 text-[11px] leading-4 text-indigo/50">{helperLabel}</span>
                </div>
            ) : null}

            <div className="mt-4 flex flex-col items-center">
                <h1 className={`${getPromptWidthClass(variant)} text-center text-indigo`}>
                    {prompt}
                </h1>
                {variant === 'audio' && helperLabel ? (
                    <span className="mt-2 text-[12px] leading-4 text-indigo/40">
                        {isLoading ? 'Generating audio...' : helperLabel}
                    </span>
                ) : null}
                {error ? (
                    <span className="mt-2 text-[12px] leading-4 text-[#B54708]">{error}</span>
                ) : null}
            </div>

            <div className={`mt-10 flex w-full ${isKids ? 'max-w-[480px]' : 'max-w-[520px]'} flex-col ${isKids ? 'gap-4' : 'gap-3'}`}>
                {question.options.map((option) => {
                    const isSelected = selectedOptionId === option.id;

                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => onSelect(option.id)}
                            className={[
                                'w-full rounded-2xl text-left cursor-pointer',
                                isKids ? 'h-[100px] px-5' : 'min-h-20 px-4 py-[14px]',
                                isSelected
                                    ? isKids
                                        ? 'border-[3px] border-indigo bg-lavender-10'
                                        : 'border-2 border-indigo bg-lavender-10'
                                    : 'border border-[#E0D9CE] bg-white',
                            ].join(' ')}
                        >
                            <div className="flex items-center">
                                <AssessmentIcon option={option} kids={isKids} />
                                <span className={`${isKids ? 'ml-4' : 'ml-3'} ${optionTextClass} leading-6 text-indigo`}>
                                    {option.label}
                                </span>
                                {isSelected ? (
                                    <div className="ml-auto flex items-center justify-center">
                                        <svg width={isKids ? '32' : '24'} height={isKids ? '32' : '24'} viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M6 12.5L10 16.5L18 8.5"
                                                stroke="#3B3F6E"
                                                strokeWidth={isKids ? '2' : '1.5'}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </div>
                                ) : null}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className={`mt-4 flex w-full flex-col items-center ${isKids ? 'max-w-[480px]' : 'max-w-[520px]'}`}>
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={!selectedOptionId}
                    className={[
                        'h-[52px] w-full rounded-xl text-[15px] font-semibold text-parchment border-none',
                        selectedOptionId ? 'bg-indigo cursor-pointer' : 'bg-indigo/30 cursor-not-allowed',
                    ].join(' ')}
                >
                    {submitLabel}
                </button>
                {!selectedOptionId ? (
                    <span className="mt-2 text-[12px] leading-4 text-graphite/40">{helperText}</span>
                ) : null}
            </div>
        </>
    );
}

function AssessmentBackButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex h-11 w-11 items-center justify-center bg-transparent border-none cursor-pointer"
            aria-label="Back"
        >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 5L8 12L15 19" stroke="#3B3F6E" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </button>
    );
}

export function LessonAssessmentScreen({ lessonId, data }: LessonAssessmentScreenProps) {
    const router = useRouter();
    const age = useRegistrationStore((state) => state.age);
    const isAutoAdapt = useRegistrationStore((state) => state.isAutoAdapt);
    const learningMode = useRegistrationStore((state) => state.learningMode);
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [view, setView] = useState<AssessmentView>('question');
    const [questionIndex, setQuestionIndex] = useState(0);

    const activeMode: LearningMode = isAutoAdapt ? data.recommendedMode : learningMode;
    const variant = getAssessmentVariant(age, activeMode);
    const questions = data.assessment.questionsByVariant[variant];
    const question: LessonAssessmentQuestion = questions[Math.max(0, Math.min(questionIndex, questions.length - 1))];
    const prompt = question.prompt;
    const helperLabel = question.helperLabel;
    const selectedOption = useMemo(
        () => question.options.find((option) => option.id === selectedOptionId) ?? null,
        [question, selectedOptionId]
    );
    const correctOption = useMemo(
        () => question.options.find((option) => option.id === question.correctOptionId) ?? null,
        [question]
    );
    const feedback = data.assessment.feedback;
    const canAdvanceToNextQuestion = questionIndex < questions.length - 1;
    const progressPercent = ((question.questionNumber - 1) / Math.max(1, question.totalQuestions)) * 100 + 20;

    const advanceAfterFeedback = () => {
        if (canAdvanceToNextQuestion) {
            setQuestionIndex((current) => current + 1);
            setSelectedOptionId(null);
            setView('question');
            return;
        }

        router.push(`/lesson/${lessonId}/complete`);
    };

    const submitAnswer = () => {
        if (!selectedOptionId) return;
        setView(selectedOptionId === question.correctOptionId ? 'correct' : 'incorrect');
    };

    if (view === 'correct') {
        return (
            <div className="flex min-h-screen justify-center bg-white px-0 py-0 sm:px-4 sm:py-6 lg:px-6 lg:py-10">
                <div className="flex min-h-screen w-full max-w-[1024px] flex-col bg-[#F0FAF0] shadow-[0_0_0_1px_rgba(224,217,206,0.4)] sm:min-h-[900px]">
                    <div className="h-1 w-full bg-[#F0FAF0]">
                        <div className="h-full rounded-full bg-indigo" style={{ width: `${Math.min(100, progressPercent + 20)}%` }} />
                    </div>
                    <div className="px-4 pt-4 sm:px-8 sm:pt-6 lg:px-12">
                        <AssessmentBackButton onClick={() => router.back()} />
                    </div>
                    <div className="flex flex-1 flex-col items-center px-4 pt-12 sm:px-8 sm:pt-16 lg:px-12">
                        <div className="flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-[#7AB87A] bg-parchment">
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                <path d="M11 20.5L17.5 27L29.5 14.5" stroke="#7AB87A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h1 className="mt-4 text-[22px] font-semibold leading-[33px] text-indigo">
                            {feedback.correct.heading}
                        </h1>
                        <p className="mt-4 max-w-[640px] text-center text-[15px] leading-6 text-graphite/70">
                            {question.explanation || feedback.correct.description}
                        </p>
                        <button
                            type="button"
                            onClick={advanceAfterFeedback}
                            className="mt-8 flex h-[52px] w-full max-w-[240px] items-center justify-center rounded-xl border-none bg-indigo text-[15px] font-semibold text-parchment cursor-pointer"
                        >
                            {canAdvanceToNextQuestion ? 'Next question' : feedback.correct.ctaLabel}
                        </button>
                        <span className="mt-auto pb-8 text-[12px] leading-4 text-lavender/60">
                            {feedback.correct.footerLabel}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'incorrect') {
        return (
            <div className="flex min-h-screen justify-center bg-white px-0 py-0 sm:px-4 sm:py-6 lg:px-6 lg:py-10">
                <div className="flex min-h-screen w-full max-w-[1024px] flex-col bg-parchment shadow-[0_0_0_1px_rgba(224,217,206,0.4)] sm:min-h-[900px]">
                    <div className="h-1 w-full bg-parchment">
                        <div className="h-full rounded-full bg-indigo" style={{ width: `${Math.min(100, progressPercent)}%` }} />
                    </div>
                    <div className="px-4 pt-4 sm:px-8 sm:pt-6 lg:px-12">
                        <AssessmentBackButton onClick={() => router.back()} />
                    </div>
                    <div className="flex flex-1 flex-col items-center px-4 pb-12 pt-12 sm:px-8 sm:pt-16 lg:px-12 lg:pb-[72px]">
                        <div className="flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-[#E8A84A] bg-parchment">
                            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                                <circle cx="18" cy="18" r="15" stroke="#E8A84A" strokeWidth="2.5" />
                                <path d="M18 10V18" stroke="#E8A84A" strokeWidth="2.5" strokeLinecap="round" />
                                <circle cx="18" cy="24" r="1.8" fill="#E8A84A" />
                            </svg>
                        </div>
                        <h1 className="mt-4 text-[20px] font-semibold leading-[30px] text-indigo">
                            {feedback.incorrect.heading}
                        </h1>
                        <p className="mt-4 max-w-[640px] text-center text-[15px] leading-6 text-graphite/70">
                            {feedback.incorrect.description}
                        </p>
                        <div className="mt-8 flex w-full max-w-[360px] flex-col items-center gap-3 sm:flex-row sm:justify-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedOptionId(null);
                                    setView('question');
                                }}
                                className="flex h-12 w-full items-center justify-center rounded-xl border-2 border-indigo bg-transparent text-[15px] font-medium text-indigo cursor-pointer sm:w-40"
                            >
                                {feedback.incorrect.primaryCtaLabel}
                            </button>
                            <button
                                type="button"
                                onClick={() => setView('correction')}
                                className="bg-transparent text-[14px] leading-[21px] text-indigo/65 cursor-pointer border-none"
                            >
                                {feedback.incorrect.secondaryCtaLabel}
                            </button>
                        </div>
                        <span className="mt-3 text-[12px] leading-4 text-graphite/40">
                            {feedback.incorrect.footerLabel}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'correction') {
        return (
            <div className="flex min-h-screen justify-center bg-white px-0 py-0 sm:px-4 sm:py-6 lg:px-6 lg:py-10">
                <div className="flex min-h-screen w-full max-w-[1024px] flex-col bg-parchment shadow-[0_0_0_1px_rgba(224,217,206,0.4)] sm:min-h-[900px]">
                    <div className="h-1 w-full bg-parchment">
                        <div className="h-full rounded-full bg-indigo" style={{ width: `${Math.min(100, progressPercent + 10)}%` }} />
                    </div>
                    <div className="px-4 pt-4 sm:px-8 sm:pt-6 lg:px-12">
                        <AssessmentBackButton onClick={() => router.back()} />
                    </div>
                    <div className="flex flex-1 flex-col items-center px-4 pb-12 pt-12 sm:px-8 sm:pt-16 lg:px-12 lg:pb-[72px]">
                        <div className="w-full max-w-[680px]">
                            <div>
                                <div className="pl-1 text-[11px] uppercase leading-4 text-[#E8A84A]/70">
                                    {feedback.correction.userAnswerLabel}
                                </div>
                                <div className="mt-1 rounded-xl border-l-[3px] border-[#E8A84A] px-4 py-4">
                                    <p className="text-[14px] leading-[22px] text-graphite/70">
                                        {selectedOption?.label ?? 'No answer selected'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-3">
                                <div className="pl-1 text-[11px] uppercase leading-4 text-[#7AB87A]/70">
                                    {feedback.correction.answerLabel}
                                </div>
                                <div className="mt-1 rounded-xl border-l-[3px] border-[#7AB87A] px-4 py-4">
                                    <p className="text-[14px] leading-[22px] text-graphite/80">
                                        {correctOption?.label ?? ''}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <p className="mt-4 max-w-[640px] text-center text-[15px] leading-6 text-graphite/70">
                            {question.explanation || feedback.correction.description}
                        </p>

                        <button
                            type="button"
                            onClick={advanceAfterFeedback}
                            className="mt-8 flex h-[52px] w-full max-w-[240px] items-center justify-center rounded-xl border-none bg-indigo text-[15px] font-semibold text-parchment cursor-pointer"
                        >
                            {canAdvanceToNextQuestion ? 'Next question' : feedback.correction.ctaLabel}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen justify-center bg-white px-0 py-0 sm:px-4 sm:py-6 lg:px-6 lg:py-10">
            <div className="flex min-h-screen w-full max-w-[1024px] flex-col items-center bg-parchment px-4 pb-16 pt-10 shadow-[0_0_0_1px_rgba(224,217,206,0.4)] sm:min-h-[900px] sm:px-8 sm:pb-24 sm:pt-12 lg:px-12 lg:pb-[331px]">
                <div className="mb-4 flex flex-col items-center">
                    <span className="text-[12px] font-medium leading-4 text-indigo/60">
                        {question.moduleNumber ? `Module ${question.moduleNumber}` : 'Final assessment'}
                    </span>
                    <span className="mt-1 text-[12px] leading-4 text-indigo/40">
                        Question {question.questionNumber} of {question.totalQuestions}
                    </span>
                </div>
                <AssessmentQuestionView
                    variant={variant}
                    question={question}
                    prompt={prompt}
                    helperLabel={helperLabel}
                    submitLabel={data.assessment.submitLabel}
                    helperText={data.assessment.helperText}
                    selectedOptionId={selectedOptionId}
                    onSelect={setSelectedOptionId}
                    onSubmit={submitAnswer}
                />
            </div>
        </div>
    );
}
