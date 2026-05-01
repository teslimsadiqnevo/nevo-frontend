'use client';

import { useEffect, useState } from 'react';

const SUGGESTIONS = ['Explain this differently', "I don't understand", 'Give me an example'];

type AskNevoDrawerProps = {
    open: boolean;
    onClose: () => void;
    context?: string | null;
};

export function AskNevoDrawer({ open, onClose, context }: AskNevoDrawerProps) {
    const [value, setValue] = useState('');

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    useEffect(() => {
        if (!open) setValue('');
    }, [open]);

    if (!open) return null;

    const hasInput = value.trim().length > 0;

    return (
        <div className="fixed inset-0 z-50">
            <div
                className="absolute inset-0 bg-graphite/35 animate-fade-in"
                onClick={onClose}
                aria-hidden
            />

            <div
                role="dialog"
                aria-modal="true"
                className="absolute left-0 right-0 bottom-0 h-[55vh] bg-parchment rounded-t-[20px] flex flex-col animate-slide-up shadow-[0_-12px_32px_rgba(0,0,0,0.18)]"
            >
                <div className="flex justify-center pt-[10px] pb-1">
                    <div className="w-10 h-1 rounded-full bg-[#C8C1B4]" />
                </div>

                {context ? (
                    <div className="flex items-center gap-2 h-9 px-4 bg-lavender-10">
                        <span className="w-1.5 h-1.5 rounded-full bg-lavender shrink-0" />
                        <span className="text-[13px] leading-5 text-indigo">{context}</span>
                    </div>
                ) : null}

                <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
                    {!hasInput ? (
                        <>
                            <p className="text-[15px] leading-[22px] text-graphite/55 text-center">
                                What can I help you with?
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 max-w-[480px]">
                                {SUGGESTIONS.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setValue(s)}
                                        className="flex items-center px-3 h-8 rounded-full bg-lavender-15 text-indigo text-[13px] leading-5 cursor-pointer border-none"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : null}
                </div>

                <div className="border-t border-[#E0D9CE] bg-parchment px-4 py-[17px]">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-11 bg-parchment border border-[#E0D9CE] rounded-[20px] flex items-center px-[17px]">
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="Ask anything..."
                                className="w-full bg-transparent border-none outline-none text-[15px] leading-[22px] text-graphite placeholder:text-graphite/35"
                            />
                        </div>
                        <button
                            type="button"
                            disabled={!hasInput}
                            className="flex justify-center items-center w-10 h-10 rounded-full bg-indigo cursor-pointer border-none disabled:cursor-default"
                            style={{ opacity: hasInput ? 1 : 0.4 }}
                            aria-label="Send"
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path
                                    d="M3.91 10H10M16.09 10L3.91 4.09L6.5 10L3.91 15.91L16.09 10Z"
                                    stroke="#F7F1E6"
                                    strokeWidth="1.875"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
