'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { clearClientSessionState } from '@/shared/lib';

type StaleSessionBannerProps = {
    title?: string;
    description?: string;
    ctaLabel?: string;
    callbackUrl?: string;
    onDismiss?: () => void;
};

export function StaleSessionBanner({
    title = "You've been added to a school.",
    description = 'Sign in again to refresh your access and see your classes.',
    ctaLabel = 'Sign in again',
    callbackUrl = '/login/teacher',
    onDismiss,
}: StaleSessionBannerProps) {
    const [submitting, setSubmitting] = useState(false);

    const handleClick = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            await clearClientSessionState();
            await signOut({ callbackUrl });
        } catch {
            setSubmitting(false);
        }
    };

    return (
        <div
            role="status"
            className="mb-6 flex flex-wrap items-center gap-3 rounded-[12px] border border-[#9A9CCB]/40 bg-[rgba(154,156,203,0.12)] px-5 py-4"
        >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9A9CCB]/30">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="8" stroke="#3B3F6E" strokeWidth="1.6" />
                    <path d="M9 5.5V9.5" stroke="#3B3F6E" strokeWidth="1.6" strokeLinecap="round" />
                    <circle cx="9" cy="12.25" r="0.95" fill="#3B3F6E" />
                </svg>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold leading-5 text-[#3B3F6E]">{title}</p>
                <p className="text-[13px] leading-5 text-[#3B3F6E]/70">{description}</p>
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={handleClick}
                    disabled={submitting}
                    className="h-9 rounded-[10px] bg-[#3B3F6E] px-4 text-[13px] font-semibold leading-5 text-[#F7F1E6] cursor-pointer border-none disabled:opacity-60 disabled:cursor-default"
                >
                    {submitting ? 'Signing out…' : ctaLabel}
                </button>
                {onDismiss ? (
                    <button
                        type="button"
                        onClick={onDismiss}
                        aria-label="Dismiss"
                        className="flex h-9 w-9 items-center justify-center text-[#3B3F6E]/60 hover:text-[#3B3F6E] cursor-pointer bg-transparent border-none"
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                    </button>
                ) : null}
            </div>
        </div>
    );
}
