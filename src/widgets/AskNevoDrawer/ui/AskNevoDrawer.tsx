'use client';

import type { ReactNode } from 'react';
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
    const clean = context.replace(/^(You are on|You're on):?\s*/i, '').trim();
    return `You're on: ${clean}`;
}

function renderInlineMarkdown(text: string) {
    const parts: ReactNode[] = [];
    const pattern = /(\*\*\*[^*]+\*\*\*|___[^_]+___|\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*\n]+\*|_[^_\n]+_)/g;
    let lastIndex = 0;
    let key = 0;

    for (const match of text.matchAll(pattern)) {
        const raw = match[0];
        const index = match.index ?? 0;

        if (index > lastIndex) {
            parts.push(text.slice(lastIndex, index));
        }

        if ((raw.startsWith('***') && raw.endsWith('***')) || (raw.startsWith('___') && raw.endsWith('___'))) {
            parts.push(
                <strong key={`inline-${key++}`} className="font-semibold text-current">
                    <em className="italic">{raw.slice(3, -3)}</em>
                </strong>,
            );
        } else if ((raw.startsWith('**') && raw.endsWith('**')) || (raw.startsWith('__') && raw.endsWith('__'))) {
            parts.push(
                <strong key={`inline-${key++}`} className="font-semibold text-current">
                    {raw.slice(2, -2)}
                </strong>,
            );
        } else if (raw.startsWith('`') && raw.endsWith('`')) {
            parts.push(
                <code key={`inline-${key++}`} className="rounded bg-[#F7F1E6]/80 px-1 py-0.5 text-[0.92em] text-[#3B3F6E]">
                    {raw.slice(1, -1)}
                </code>,
            );
        } else if (raw.startsWith('[')) {
            const linkMatch = raw.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            const label = linkMatch?.[1] || raw;
            const href = linkMatch?.[2] || '';
            const isSafeHref = /^https?:\/\//i.test(href) || href.startsWith('/');

            parts.push(
                isSafeHref ? (
                    <a
                        key={`inline-${key++}`}
                        href={href}
                        target={href.startsWith('/') ? undefined : '_blank'}
                        rel={href.startsWith('/') ? undefined : 'noreferrer'}
                        className="font-medium text-[#6E74AA] underline decoration-[#9A9CCB]/45 underline-offset-2"
                    >
                        {label}
                    </a>
                ) : (
                    label
                ),
            );
        } else if ((raw.startsWith('*') && raw.endsWith('*')) || (raw.startsWith('_') && raw.endsWith('_'))) {
            parts.push(
                <em key={`inline-${key++}`} className="italic">
                    {raw.slice(1, -1)}
                </em>,
            );
        }

        lastIndex = index + raw.length;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
}

function isMarkdownBlockStart(line: string) {
    return (
        /^#{1,3}\s+/.test(line) ||
        /^[-*]\s+/.test(line) ||
        /^\d+[.)]\s+/.test(line) ||
        /^>\s?/.test(line) ||
        /^```/.test(line)
    );
}

function MarkdownMessage({ content }: { content: string }) {
    const lines = content.replace(/\r\n/g, '\n').split('\n');
    const blocks: ReactNode[] = [];
    let index = 0;
    let key = 0;

    while (index < lines.length) {
        const line = lines[index];
        const trimmed = line.trim();

        if (!trimmed) {
            index += 1;
            continue;
        }

        if (trimmed.startsWith('```')) {
            const codeLines: string[] = [];
            index += 1;

            while (index < lines.length && !lines[index].trim().startsWith('```')) {
                codeLines.push(lines[index]);
                index += 1;
            }

            if (index < lines.length) index += 1;

            blocks.push(
                <pre key={`block-${key++}`} className="overflow-x-auto rounded-[10px] bg-[#3B3F6E] px-3 py-2 text-[12px] leading-5 text-[#F7F1E6]">
                    <code>{codeLines.join('\n')}</code>
                </pre>,
            );
            continue;
        }

        const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const className =
                level === 1
                    ? 'text-[16px] font-semibold leading-6 text-[#3B3F6E]'
                    : 'text-[15px] font-semibold leading-[22px] text-[#3B3F6E]';

            blocks.push(
                <p key={`block-${key++}`} className={className}>
                    {renderInlineMarkdown(headingMatch[2])}
                </p>,
            );
            index += 1;
            continue;
        }

        if (/^[-*]\s+/.test(trimmed)) {
            const items: string[] = [];
            while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
                items.push(lines[index].trim().replace(/^[-*]\s+/, ''));
                index += 1;
            }

            blocks.push(
                <ul key={`block-${key++}`} className="list-disc space-y-1 pl-5">
                    {items.map((item, itemIndex) => (
                        <li key={`item-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
                    ))}
                </ul>,
            );
            continue;
        }

        if (/^\d+[.)]\s+/.test(trimmed)) {
            const items: string[] = [];
            while (index < lines.length && /^\d+[.)]\s+/.test(lines[index].trim())) {
                items.push(lines[index].trim().replace(/^\d+[.)]\s+/, ''));
                index += 1;
            }

            blocks.push(
                <ol key={`block-${key++}`} className="list-decimal space-y-1 pl-5">
                    {items.map((item, itemIndex) => (
                        <li key={`item-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
                    ))}
                </ol>,
            );
            continue;
        }

        if (/^>\s?/.test(trimmed)) {
            const quoteLines: string[] = [];
            while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
                quoteLines.push(lines[index].trim().replace(/^>\s?/, ''));
                index += 1;
            }

            blocks.push(
                <blockquote key={`block-${key++}`} className="border-l-2 border-[#9A9CCB] pl-3 text-[#2B2B2F]/75">
                    {renderInlineMarkdown(quoteLines.join(' '))}
                </blockquote>,
            );
            continue;
        }

        const paragraphLines = [trimmed];
        index += 1;
        while (index < lines.length && lines[index].trim() && !isMarkdownBlockStart(lines[index].trim())) {
            paragraphLines.push(lines[index].trim());
            index += 1;
        }

        blocks.push(
            <p key={`block-${key++}`} className="whitespace-pre-wrap">
                {renderInlineMarkdown(paragraphLines.join(' '))}
            </p>,
        );
    }

    return <div className="space-y-3">{blocks}</div>;
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
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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

    useEffect(() => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = '0px';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }, [value, open]);

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

                <div
                    ref={listRef}
                    className="ask-nevo-scrollbar flex-1 overflow-y-auto px-2 py-6 sm:px-3"
                >
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
                        <div className="flex w-full flex-col gap-3">
                            {messages.map((message, index) => {
                                const isUser = message.role === 'user';
                                const isLatestNevo = !isUser && index === latestNevoIndex;

                                return (
                                    <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                        <div className="max-w-[min(76%,720px)]">
                                            <div
                                                className={`ask-nevo-message-enter px-4 py-4 text-[15px] leading-[22px] ${
                                                    isUser
                                                        ? 'ask-nevo-user-message rounded-[12px_12px_0px_12px] bg-[#3B3F6E] text-[#F7F1E6]'
                                                        : 'ask-nevo-reply-message rounded-[12px_12px_12px_0px] bg-[rgba(154,156,203,0.12)] text-[#2B2B2F]'
                                                }`}
                                            >
                                                {isUser ? (
                                                    <span className="whitespace-pre-wrap">{message.content}</span>
                                                ) : (
                                                    <MarkdownMessage content={message.content} />
                                                )}
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
                                    <div className="ask-nevo-reply-message rounded-[12px_12px_12px_0px] bg-[rgba(154,156,203,0.12)] px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="ask-nevo-typing-dot h-2 w-2 rounded-full bg-[#9A9CCB]" />
                                            <span className="ask-nevo-typing-dot h-2 w-2 rounded-full bg-[#9A9CCB]" />
                                            <span className="ask-nevo-typing-dot h-2 w-2 rounded-full bg-[#9A9CCB]" />
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

                <div className="border-t border-[#E0D9CE] bg-[#F7F1E6] px-4 py-[14px]">
                    <div className="flex items-end gap-3">
                        <div className="flex min-h-11 flex-1 items-center rounded-[20px] border border-[#E0D9CE] bg-[#F7F1E6] px-5 py-[10px]">
                            <textarea
                                ref={textareaRef}
                                rows={1}
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        void sendMessage();
                                    }
                                }}
                                placeholder={isSending ? 'Sending...' : 'Ask anything...'}
                                className="ask-nevo-scrollbar max-h-[120px] min-h-[22px] w-full resize-none bg-transparent text-[15px] leading-[22px] text-[#2B2B2F] outline-none placeholder:text-[#2B2B2F]/45"
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

            <style jsx global>{`
                .ask-nevo-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(59, 63, 110, 0.35) rgba(224, 217, 206, 0.45);
                }

                .ask-nevo-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }

                .ask-nevo-scrollbar::-webkit-scrollbar-track {
                    background: rgba(224, 217, 206, 0.45);
                    border-radius: 999px;
                }

                .ask-nevo-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(59, 63, 110, 0.35);
                    border: 2px solid rgba(247, 241, 230, 0.9);
                    border-radius: 999px;
                }

                .ask-nevo-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(59, 63, 110, 0.55);
                }

                .ask-nevo-message-enter {
                    animation-fill-mode: both;
                    transform-origin: bottom right;
                    will-change: transform, opacity;
                }

                .ask-nevo-user-message {
                    animation: ask-nevo-user-pop 260ms cubic-bezier(0.2, 0.9, 0.2, 1);
                }

                .ask-nevo-reply-message {
                    animation: ask-nevo-reply-rise 320ms cubic-bezier(0.22, 0.75, 0.22, 1);
                    transform-origin: bottom left;
                    will-change: transform, opacity;
                }

                @keyframes ask-nevo-user-pop {
                    0% {
                        opacity: 0;
                        transform: translate3d(18px, 42px, 0) scale(0.94);
                    }

                    68% {
                        opacity: 1;
                        transform: translate3d(-1px, -2px, 0) scale(1.015);
                    }

                    100% {
                        opacity: 1;
                        transform: translate3d(0, 0, 0) scale(1);
                    }
                }

                @keyframes ask-nevo-reply-rise {
                    0% {
                        opacity: 0;
                        transform: translate3d(-10px, 10px, 0) scale(0.985);
                    }

                    100% {
                        opacity: 1;
                        transform: translate3d(0, 0, 0) scale(1);
                    }
                }

                .ask-nevo-typing-dot {
                    animation: ask-nevo-dot-dance 780ms ease-in-out infinite;
                    display: inline-block;
                }

                .ask-nevo-typing-dot:nth-child(2) {
                    animation-delay: 120ms;
                }

                .ask-nevo-typing-dot:nth-child(3) {
                    animation-delay: 240ms;
                }

                @keyframes ask-nevo-dot-dance {
                    0%,
                    80%,
                    100% {
                        opacity: 0.55;
                        transform: translateY(0);
                    }

                    40% {
                        opacity: 1;
                        transform: translateY(-5px);
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .ask-nevo-user-message,
                    .ask-nevo-reply-message,
                    .ask-nevo-typing-dot {
                        animation: none;
                    }
                }
            `}</style>
        </div>
    );
}
