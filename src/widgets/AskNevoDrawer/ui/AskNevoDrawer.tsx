'use client';

import { useEffect, useRef, useState } from 'react';

const SUGGESTIONS = ['Explain this differently', "I don't understand", 'Give me an example'];

type AskNevoMessage = {
    id: string;
    role: 'user' | 'nevo';
    content: string;
};

type AskNevoDrawerProps = {
    open: boolean;
    onClose: () => void;
    context?: string | null;
    page?: string | null;
    lessonId?: string | null;
    leftInset?: number;
};

function createMessage(role: AskNevoMessage['role'], content: string): AskNevoMessage {
    return {
        id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        role,
        content,
    };
}

function formatContextLabel(context?: string | null) {
    if (!context) return null;
    const clean = context.replace(/^You are on\s*/i, '').trim();
    return `You're on: ${clean}`;
}

export function AskNevoDrawer({
    open,
    onClose,
    context,
    page,
    lessonId,
    leftInset = 0,
}: AskNevoDrawerProps) {
    const [value, setValue] = useState('');
    const [messages, setMessages] = useState<AskNevoMessage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [feedbackState, setFeedbackState] = useState<'idle' | 'answered' | 'slower-offered'>('idle');
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
        if (!listRef.current) return;
        listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages, error, isSending, feedbackState]);

    if (!open) return null;

    const sendMessage = async (rawMessage?: string) => {
        const message = (rawMessage ?? value).trim();
        if (!message || isSending) return;

        const userMessage = createMessage('user', message);
        const nextMessages = [...messages, userMessage];

        setError(null);
        setIsSending(true);
        setValue('');
        setMessages(nextMessages);

        try {
            const res = await fetch('/api/chat/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    ...(lessonId ? { lesson_id: lessonId } : {}),
                    ...(context ? { context } : {}),
                    ...(page ? { page } : {}),
                    history: nextMessages.slice(0, -1).map(({ role, content }) => ({ role, content })),
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

            setMessages((current) => [...current, createMessage('nevo', responseText)]);
            setFeedbackState(message.toLowerCase() === 'still confused' ? 'slower-offered' : 'idle');
        } catch (sendError: unknown) {
            const message =
                sendError instanceof Error ? sendError.message : 'Ask Nevo could not respond right now.';
            setError(message);
        } finally {
            setIsSending(false);
        }
    };

    const hasInput = value.trim().length > 0;
    const showEmptyPrompt = messages.length === 0 && !hasInput && !error;
    const latestNevoIndex = [...messages].map((message) => message.role).lastIndexOf('nevo');
    const contextLabel = formatContextLabel(context);
    const showFeedback = latestNevoIndex >= 0 && feedbackState === 'idle' && !isSending;
    const showSlowerMode = latestNevoIndex >= 0 && feedbackState === 'slower-offered' && !isSending;

    return (
        <div className="fixed inset-0 z-50">
            <div
                className="absolute top-0 right-0 bottom-0 bg-black/35 animate-fade-in"
                onClick={onClose}
                aria-hidden
                style={{ left: leftInset }}
            />

            <div
                role="dialog"
                aria-modal="true"
                className="absolute right-0 bottom-0 flex flex-col rounded-t-[20px] bg-[#F7F1E6] shadow-[0_-12px_32px_rgba(0,0,0,0.18)] animate-slide-up"
                style={{
                    left: leftInset,
                    height: 'min(464px, calc(100vh - 112px))',
                }}
            >
                <div className="flex justify-center pt-[10px] pb-0">
                    <div className="h-1 w-10 rounded-full bg-[#C8C1B4]" />
                </div>

                {contextLabel ? (
                    <div className="mt-[10px] flex min-h-9 items-center gap-2 bg-[rgba(154,156,203,0.1)] px-5 text-[13px] leading-5 text-[#3B3F6E]">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#9A9CCB]" />
                        <span>{contextLabel}</span>
                    </div>
                ) : null}

                <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-6">
                    {showEmptyPrompt ? (
                        <div className="flex h-full flex-col items-center justify-center gap-6">
                            <p className="text-center text-[15px] leading-[22px] text-[#2B2B2F]/65">
                                What can I help you with?
                            </p>
                            <div className="flex max-w-[520px] flex-wrap justify-center gap-2">
                                {SUGGESTIONS.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => {
                                            setValue(suggestion);
                                            setError(null);
                                        }}
                                        className="h-8 rounded-xl bg-[rgba(154,156,203,0.12)] px-4 text-[13px] leading-5 text-[#3B3F6E]"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="mx-auto flex w-full max-w-[764px] flex-col gap-3">
                            {messages.map((message, index) => {
                                const isUser = message.role === 'user';
                                const isLatestNevo = !isUser && index === latestNevoIndex;

                                return (
                                    <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                        <div className="max-w-[573px]">
                                            <div
                                                className={`px-4 py-4 text-[15px] leading-[22px] ${
                                                    isUser
                                                        ? 'rounded-[12px_12px_0px_12px] bg-[#3B3F6E] text-[#F7F1E6]'
                                                        : 'rounded-[12px_12px_12px_0px] bg-[rgba(154,156,203,0.12)] text-[#2B2B2F]'
                                                }`}
                                            >
                                                {message.content}
                                            </div>

                                            {isLatestNevo && showFeedback ? (
                                                <div className="mt-2 flex flex-col items-start gap-2">
                                                    <p className="text-[13px] leading-5 text-[#9A9CCB]">Does that help?</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setFeedbackState('answered')}
                                                            className="h-8 rounded-xl bg-[rgba(122,184,122,0.15)] px-4 text-[13px] leading-5 text-[#7AB87A]"
                                                        >
                                                            That helped
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => void sendMessage('Still confused')}
                                                            className="h-8 rounded-xl bg-[rgba(154,156,203,0.15)] px-4 text-[13px] leading-5 text-[#9A9CCB]"
                                                        >
                                                            Still confused
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : null}

                                            {isLatestNevo && showSlowerMode ? (
                                                <div className="mt-2 flex flex-col items-start gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setValue('Switch to Slower mode');
                                                            setFeedbackState('answered');
                                                        }}
                                                        className="h-9 rounded-xl border border-[#3B3F6E] px-4 text-[13px] font-medium leading-5 text-[#3B3F6E]"
                                                    >
                                                        Switch to Slower mode
                                                    </button>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}

                            {isSending ? (
                                <div className="flex justify-start">
                                    <div className="rounded-[12px_12px_12px_0px] bg-[rgba(154,156,203,0.12)] px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-[#9A9CCB]" />
                                            <span className="h-2 w-2 rounded-full bg-[#9A9CCB]" />
                                            <span className="h-2 w-2 rounded-full bg-[#9A9CCB]" />
                                        </div>
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

                <div className="border-t border-[#E0D9CE] bg-[#F7F1E6] px-4 py-[16px]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 flex-1 items-center rounded-[20px] border border-[#E0D9CE] bg-[#F7F1E6] px-5">
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        void sendMessage();
                                    }
                                }}
                                placeholder={isSending ? 'Sending...' : 'Ask anything...'}
                                className="w-full bg-transparent text-[15px] leading-[22px] text-[#2B2B2F] outline-none placeholder:text-[#2B2B2F]/45"
                            />
                        </div>

                        <button
                            type="button"
                            disabled={!hasInput || isSending}
                            onClick={() => void sendMessage()}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3B3F6E] disabled:cursor-default"
                            style={{ opacity: !hasInput || isSending ? 0.45 : 1 }}
                            aria-label="Send"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path
                                    d="M3.12891 8H8.00078M12.8719 8L3.12891 3.27344L5.20078 8L3.12891 12.7266L12.8719 8Z"
                                    stroke="#F7F1E6"
                                    strokeWidth="1.75"
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
