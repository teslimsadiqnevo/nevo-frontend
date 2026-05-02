'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const SUGGESTIONS = ['Explain this differently', "I don't understand", 'Give me an example'];

type AskNevoMessage = {
    role: 'user' | 'nevo';
    content: string;
};

type AskNevoDrawerProps = {
    open: boolean;
    onClose: () => void;
    context?: string | null;
    lessonId?: string | null;
    leftInset?: number;
};

export function AskNevoDrawer({
    open,
    onClose,
    context,
    lessonId,
    leftInset = 0,
}: AskNevoDrawerProps) {
    const [value, setValue] = useState('');
    const [messages, setMessages] = useState<AskNevoMessage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const listRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    useEffect(() => {
        if (!open) {
            setValue('');
            setMessages([]);
            setError(null);
            setIsSending(false);
        }
    }, [open]);

    useEffect(() => {
        if (!listRef.current) return;
        listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages, error, isSending]);

    const hasInput = value.trim().length > 0;
    const showEmptyPrompt = messages.length === 0 && !hasInput && !error;
    const submitLabel = useMemo(() => {
        if (isSending) return 'Sending...';
        return 'Ask anything...';
    }, [isSending]);

    if (!open) return null;

    const handleSend = async () => {
        const message = value.trim();
        if (!message || isSending) return;

        setError(null);
        setIsSending(true);
        setValue('');
        setMessages((current) => [...current, { role: 'user', content: message }]);

        try {
            const res = await fetch('/api/chat/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    ...(lessonId ? { lesson_id: lessonId } : {}),
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const detail =
                    typeof data?.detail === 'string'
                        ? data.detail
                        : 'Ask Nevo could not respond right now.';
                throw new Error(detail);
            }

            const responseText =
                typeof data?.response === 'string' && data.response.trim().length > 0
                    ? data.response.trim()
                    : 'Nevo did not return a response.';

            setMessages((current) => [...current, { role: 'nevo', content: responseText }]);
        } catch (sendError: any) {
            setError(sendError?.message || 'Ask Nevo could not respond right now.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50">
            <div
                className="absolute inset-0 bg-graphite/35 animate-fade-in"
                onClick={onClose}
                aria-hidden
                style={{ left: leftInset }}
            />

            <div
                role="dialog"
                aria-modal="true"
                className="absolute left-0 right-0 bottom-0 h-[55vh] bg-parchment rounded-t-[20px] flex flex-col animate-slide-up shadow-[0_-12px_32px_rgba(0,0,0,0.18)]"
                style={{ left: leftInset }}
            >
                <div className="flex justify-center pt-[10px] pb-1">
                    <div className="w-10 h-1 rounded-full bg-[#C8C1B4]" />
                </div>

                {context ? (
                    <div className="flex items-center gap-2 min-h-9 px-4 py-2 bg-lavender-10">
                        <span className="w-1.5 h-1.5 rounded-full bg-lavender shrink-0" />
                        <span className="text-[13px] leading-5 text-indigo">{context}</span>
                    </div>
                ) : null}

                <div ref={listRef} className="flex-1 overflow-y-auto px-6 py-6">
                    {showEmptyPrompt ? (
                        <div className="h-full flex flex-col items-center justify-center gap-6">
                            <p className="text-[15px] leading-[22px] text-graphite/55 text-center">
                                What can I help you with?
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 max-w-[480px]">
                                {SUGGESTIONS.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => {
                                            setValue(suggestion);
                                            setError(null);
                                        }}
                                        className="flex items-center px-3 h-8 rounded-full bg-lavender-15 text-indigo text-[13px] leading-5 cursor-pointer border-none"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4">
                            {messages.map((message, index) => (
                                <div
                                    key={`${message.role}-${index}`}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-[18px] px-4 py-3 text-[14px] leading-6 shadow-sm ${
                                            message.role === 'user'
                                                ? 'bg-indigo text-parchment'
                                                : 'bg-white border border-[#E0D9CE] text-graphite'
                                        }`}
                                    >
                                        {message.content}
                                    </div>
                                </div>
                            ))}

                            {isSending ? (
                                <div className="flex justify-start">
                                    <div className="rounded-[18px] border border-[#E0D9CE] bg-white px-4 py-3 text-[14px] leading-6 text-graphite/55 shadow-sm">
                                        Nevo is thinking...
                                    </div>
                                </div>
                            ) : null}

                            {error ? (
                                <div className="rounded-[14px] border border-[#E8A84A] bg-[#FFF7EC] px-4 py-3 text-[13px] leading-5 text-[#8C5C17]">
                                    {error}
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>

                <div className="border-t border-[#E0D9CE] bg-parchment px-4 py-[17px]">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-11 bg-parchment border border-[#E0D9CE] rounded-[20px] flex items-center px-[17px]">
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        void handleSend();
                                    }
                                }}
                                placeholder={submitLabel}
                                className="w-full bg-transparent border-none outline-none text-[15px] leading-[22px] text-graphite placeholder:text-graphite/35"
                            />
                        </div>
                        <button
                            type="button"
                            disabled={!hasInput || isSending}
                            onClick={() => void handleSend()}
                            className="flex justify-center items-center w-10 h-10 rounded-full bg-indigo cursor-pointer border-none disabled:cursor-default"
                            style={{ opacity: !hasInput || isSending ? 0.4 : 1 }}
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
