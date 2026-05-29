'use client';

import type { LessonReorientationData } from '../api/types';

type LessonReorientationOverlayProps = {
    data: LessonReorientationData;
    onSelect: (optionId: string) => void;
    onAskNevo: () => void;
    isLoading?: boolean;
    error?: string | null;
};

function optionIconFromMode(option: LessonReorientationData['options'][number]) {
    if (option.mode === 'visual') return 'image';
    if (option.mode === 'kinesthetic') return 'hands';
    return option.icon;
}

function OptionIcon({ icon }: { icon: LessonReorientationData['options'][number]['icon'] }) {
    if (icon === 'hands') {
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 text-lavender">
                <path d="M10 4V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M14 6V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M7 10L7 15C7 17.761 9.239 20 12 20C14.761 20 17 17.761 17 15V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 11V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M19 11V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        );
    }

    if (icon === 'image') {
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 text-lavender">
                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="9" cy="10" r="1.5" fill="currentColor" />
                <path d="M5.5 17L11 12L14.5 15L17 13L20.5 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }

    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 text-lavender">
            <path d="M7 4.5H17C18.1046 4.5 19 5.39543 19 6.5V19L12 15.5L5 19V6.5C5 5.39543 5.89543 4.5 7 4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
    );
}

export function LessonReorientationOverlay({
    data,
    onSelect,
    onAskNevo,
    isLoading,
    error,
}: LessonReorientationOverlayProps) {
    return (
        <div className="absolute inset-0 z-20 bg-black/30">
            <div className="absolute inset-x-0 bottom-0 rounded-t-[20px] bg-parchment px-6 pb-6 pt-3">
                <div className="flex justify-center">
                    <div className="h-1 w-8 rounded-full bg-indigo/20" />
                </div>

                <div className="mt-5 flex justify-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8A84A]/20">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="7" stroke="#E8A84A" strokeWidth="1.5" />
                            <path d="M12 3V6" stroke="#E8A84A" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M12 18V21" stroke="#E8A84A" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M3 12H6" stroke="#E8A84A" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M18 12H21" stroke="#E8A84A" strokeWidth="1.5" strokeLinecap="round" />
                            <circle cx="12" cy="12" r="2.5" fill="#E8A84A" />
                        </svg>
                    </div>
                </div>

                <h2 className="mt-4 text-center text-[17px] font-semibold leading-[26px] text-indigo">
                    {data.title}
                </h2>
                <p className="mt-2 text-center text-[14px] leading-[21px] text-graphite/65">
                    {data.description}
                </p>

                <div className="mt-6 flex flex-col gap-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2 rounded-xl border border-[#E0D9CE] bg-white/80 px-4 py-5">
                            {[0, 1, 2].map((index) => (
                                <span
                                    key={index}
                                    className="h-2 w-2 animate-bounce rounded-full bg-lavender"
                                    style={{ animationDelay: `${index * 120}ms` }}
                                />
                            ))}
                            <span className="ml-2 text-[13px] leading-5 text-graphite/60">
                                Finding another way in...
                            </span>
                        </div>
                    ) : null}

                    {error ? (
                        <p className="rounded-xl bg-[#FFF3CD] px-4 py-3 text-[12px] leading-5 text-[#9A6412]">
                            {error}
                        </p>
                    ) : null}

                    {data.options.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => onSelect(option.id)}
                            className="flex w-full items-start gap-3 rounded-xl border border-[#E0D9CE] bg-white/90 px-4 py-3 text-left cursor-pointer"
                        >
                            <OptionIcon icon={optionIconFromMode(option)} />
                            <div className="min-w-0">
                                <div className="text-[14px] font-semibold leading-5 text-indigo">{option.title}</div>
                                <div className="mt-1 text-[12px] leading-[17px] text-graphite/60">
                                    {option.description}
                                </div>
                                {option.text ? (
                                    <p className="mt-2 text-[13px] leading-[19px] text-graphite/80">
                                        {option.text}
                                    </p>
                                ) : null}
                            </div>
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={onAskNevo}
                    className="mt-3 flex h-11 w-full items-center justify-center rounded-xl border border-indigo bg-transparent text-[14px] font-semibold text-indigo cursor-pointer"
                >
                    {data.ctaLabel}
                </button>
            </div>
        </div>
    );
}
