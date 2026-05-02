'use client';

import type { LessonReflectionData } from '../api/types';

type LessonReflectionOverlayProps = {
    data: LessonReflectionData;
    onSelect: (optionId: string) => void;
};

export function LessonReflectionOverlay({ data, onSelect }: LessonReflectionOverlayProps) {
    return (
        <div className="absolute inset-0 z-20 bg-black/30">
            <div className="absolute inset-x-0 bottom-0 rounded-t-[20px] bg-parchment px-6 pb-6 pt-3">
                <div className="flex justify-center">
                    <div className="h-1 w-8 rounded-full bg-indigo/20" />
                </div>

                <div className="mt-8 flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lavender-15">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <path d="M14 26C14 22.134 17.134 19 21 19C24.866 19 28 22.134 28 26V29C28 31.761 25.761 34 23 34H19C16.239 34 14 31.761 14 29V26Z" fill="rgba(154,156,203,0.5)" />
                            <path d="M24 14C24 11.791 25.791 10 28 10C30.209 10 32 11.791 32 14V16.5C32 18.433 30.433 20 28.5 20H27.5C25.567 20 24 18.433 24 16.5V14Z" fill="rgba(154,156,203,0.4)" />
                            <path d="M18 31C18 28.791 19.791 27 22 27C24.209 27 26 28.791 26 31V33.5C26 35.433 24.433 37 22.5 37H21.5C19.567 37 18 35.433 18 33.5V31Z" fill="rgba(154,156,203,0.35)" />
                        </svg>
                    </div>
                </div>

                <h2 className="mt-6 text-center text-[17px] font-semibold leading-[26px] text-indigo">
                    {data.title}
                </h2>
                <p className="mt-2 text-center text-[14px] leading-[21px] text-graphite/65">
                    {data.description}
                </p>

                <div className="mt-4">
                    {data.options.map((option, index) => (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => onSelect(option.id)}
                            className={[
                                'flex h-12 w-full items-center justify-between text-left cursor-pointer border-none bg-transparent px-0 text-[15px] leading-[22px] text-indigo',
                                index < data.options.length - 1 ? 'border-b border-[#E5E7EB]' : '',
                            ].join(' ')}
                        >
                            <span>{option.label}</span>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M8 5L13 10L8 15" stroke="rgba(59,63,110,0.3)" strokeWidth="1.875" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
