'use client';

import { useRouter } from 'next/navigation';
import type { LessonBreakVariant, LessonPlayerData, StageKey } from '../api/types';

type LessonBreakScreenProps = {
    lessonId: string;
    data: LessonPlayerData;
    variant: LessonBreakVariant;
    returnStage: StageKey;
};

export function LessonBreakScreen({ lessonId, data, variant, returnStage }: LessonBreakScreenProps) {
    const router = useRouter();
    const state = data.breakStates[variant];

    const goToStage = () => {
        router.push(`/lesson/${lessonId}/${returnStage}`);
    };

    const toggleVariant = () => {
        const nextVariant = variant === 'quick' ? 'long' : 'quick';
        router.push(`/lesson/${lessonId}/break?variant=${nextVariant}&returnStage=${returnStage}`);
    };

    return (
        <div className="flex min-h-screen justify-center bg-white px-0 py-0 sm:px-4 sm:py-6 lg:px-6 lg:py-10">
            <div className="relative flex min-h-screen w-full max-w-[1024px] items-center justify-center bg-parchment shadow-[0_0_0_1px_rgba(224,217,206,0.4)] sm:min-h-[900px]">
                <button
                    type="button"
                    onClick={() => router.push(`/lesson/${lessonId}/${returnStage}`)}
                    className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center border-none bg-transparent cursor-pointer sm:left-8 sm:top-5 lg:left-12"
                    aria-label="Back to lesson"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M15 5L8 12L15 19"
                            stroke="#3B3F6E"
                            strokeWidth="2.25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>

                <div className="w-full max-w-[316px] px-4 text-center">
                    <div className="mx-auto flex h-[120px] w-[120px] items-center justify-center rounded-full bg-lavender-15">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <path d="M14 16H34" stroke="rgba(59,63,110,0.45)" strokeWidth="3" strokeLinecap="round" />
                            <path d="M14 24H34" stroke="rgba(59,63,110,0.45)" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                    </div>

                    <h1 className="mt-6 text-[20px] font-semibold leading-7 text-indigo">{state.heading}</h1>
                    <p className="mt-2 text-[16px] leading-6 text-graphite-60">{state.subheading}</p>

                    <div className="mx-auto mt-12 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-lavender-20">
                        <span className="text-[13px] leading-5 text-indigo/50">{state.durationLabel}</span>
                    </div>

                    <button
                        type="button"
                        onClick={goToStage}
                        className="mx-auto mt-12 flex h-[52px] w-full max-w-[240px] items-center justify-center rounded-xl border-none bg-indigo text-[15px] font-semibold text-parchment cursor-pointer"
                    >
                        {state.primaryCta}
                    </button>

                    <button
                        type="button"
                        onClick={toggleVariant}
                        className="mt-3 bg-transparent border-none text-[13px] leading-5 text-indigo/50 cursor-pointer"
                    >
                        {state.secondaryCta}
                    </button>
                </div>
            </div>
        </div>
    );
}
