'use client';

import type { LessonMicroQuizPromptOverlayData } from '../api/types';

type LessonMicroQuizPromptOverlayProps = {
    prompt: LessonMicroQuizPromptOverlayData;
    onPrimary: () => void;
    onSecondary: () => void;
};

export function LessonMicroQuizPromptOverlay({
    prompt,
    onPrimary,
    onSecondary,
}: LessonMicroQuizPromptOverlayProps) {
    return (
        <div className="absolute inset-0 z-20 bg-black/30">
            <div className="absolute inset-x-0 bottom-0 rounded-t-[20px] bg-parchment px-5 pb-6 pt-3">
                <div className="flex justify-center">
                    <div className="h-1 w-8 rounded-full bg-[#C8C1B4]" />
                </div>

                <div className="mt-4 flex justify-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${prompt.hintLabel ? 'bg-lavender-15' : 'bg-[#E8A84A]/15'}`}>
                        {prompt.hintLabel ? (
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M9 15V14" stroke="#9A9CCB" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M6.75 7.25C6.75 6.00736 7.75736 5 9 5C10.2426 5 11.25 6.00736 11.25 7.25C11.25 8.14331 10.7293 8.915 9.9749 9.27737C9.40788 9.54967 9 10.0961 9 10.725V11" stroke="#9A9CCB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="9" cy="9" r="7.25" stroke="#9A9CCB" strokeWidth="1.5" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <circle cx="9" cy="9" r="7.25" stroke="#E8A84A" strokeWidth="1.5" />
                                <path d="M9 4.5V9" stroke="#E8A84A" strokeWidth="1.5" strokeLinecap="round" />
                                <circle cx="9" cy="12.25" r="0.875" fill="#E8A84A" />
                            </svg>
                        )}
                    </div>
                </div>

                <h2 className="mt-3 text-center text-[15px] font-semibold leading-[22px] text-indigo">
                    {prompt.heading}
                </h2>
                {prompt.description ? (
                    <p className="mt-1 text-center text-[13px] leading-5 text-graphite/65">
                        {prompt.description}
                    </p>
                ) : null}

                {prompt.hintLabel ? (
                    <div className="mt-3 rounded-lg bg-lavender-10 px-3 py-3 text-[15px] leading-6 text-graphite">
                        {prompt.hintLabel}
                    </div>
                ) : null}

                <button
                    type="button"
                    onClick={onPrimary}
                    className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-indigo text-[14px] font-semibold text-parchment cursor-pointer border-none"
                >
                    {prompt.primaryCtaLabel}
                </button>
                <button
                    type="button"
                    onClick={onSecondary}
                    className="mt-2 flex h-5 w-full items-center justify-center bg-transparent text-[12px] leading-4 text-lavender cursor-pointer border-none"
                >
                    {prompt.secondaryCtaLabel}
                </button>
            </div>
        </div>
    );
}
