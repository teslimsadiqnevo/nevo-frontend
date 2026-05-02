'use client';

import { useEffect } from 'react';
import { useToastStore, type Toast as ToastType } from './useToastStore';

const VARIANT_STYLES: Record<ToastType['variant'], { bg: string; fg: string; border: string; iconColor: string }> = {
    info: { bg: '#FFFFFF', fg: '#2B2B2F', border: '#E0D9CE', iconColor: '#3B3F6E' },
    success: { bg: '#FFFFFF', fg: '#2B2B2F', border: '#BCD9C2', iconColor: '#2D6A4F' },
    error: { bg: '#FFFFFF', fg: '#2B2B2F', border: '#E8B4B0', iconColor: '#A8403B' },
    warning: { bg: '#FFFFFF', fg: '#2B2B2F', border: '#E8CFA8', iconColor: '#8C5C17' },
};

function ToastIcon({ variant, color }: { variant: ToastType['variant']; color: string }) {
    if (variant === 'success') {
        return (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="8" fill={color} />
                <path d="M5 9.5L7.5 12L13 6.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }
    if (variant === 'error') {
        return (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="8" fill={color} />
                <path d="M9 5V10" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="9" cy="12.5" r="0.9" fill="white" />
            </svg>
        );
    }
    if (variant === 'warning') {
        return (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1.5L17 16H1L9 1.5Z" fill={color} />
                <path d="M9 6.5V10.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="9" cy="13" r="0.9" fill="white" />
            </svg>
        );
    }
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="8" fill={color} />
            <path d="M9 8V13" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="9" cy="5.5" r="0.9" fill="white" />
        </svg>
    );
}

function ToastItem({ toast }: { toast: ToastType }) {
    const dismiss = useToastStore((s) => s.dismiss);
    const style = VARIANT_STYLES[toast.variant];

    useEffect(() => {
        if (toast.durationMs <= 0) return;
        const t = window.setTimeout(() => dismiss(toast.id), toast.durationMs);
        return () => window.clearTimeout(t);
    }, [toast.id, toast.durationMs, dismiss]);

    return (
        <div
            role="status"
            className="flex items-start gap-3 min-w-[280px] max-w-[420px] rounded-[12px] px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.10)] animate-fade-in"
            style={{ background: style.bg, color: style.fg, border: `1px solid ${style.border}` }}
        >
            <span className="mt-0.5 shrink-0">
                <ToastIcon variant={toast.variant} color={style.iconColor} />
            </span>
            <div className="flex-1 min-w-0">
                {toast.title ? (
                    <p className="text-[13px] font-semibold leading-5">{toast.title}</p>
                ) : null}
                <p className="text-[13px] leading-5 text-graphite/80">{toast.message}</p>
            </div>
            <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
                className="shrink-0 -mr-1 -mt-1 p-1 cursor-pointer bg-transparent border-none text-graphite/40 hover:text-graphite/70"
            >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
            </button>
        </div>
    );
}

export function Toaster() {
    const toasts = useToastStore((s) => s.toasts);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <ToastItem toast={toast} />
                </div>
            ))}
        </div>
    );
}
