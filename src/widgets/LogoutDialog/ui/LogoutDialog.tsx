'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { clearClientSessionState } from '@/shared/lib';
import { toast } from '@/shared/ui';

type LogoutDialogProps = {
    open: boolean;
    onClose: () => void;
    callbackUrl?: string;
    title?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    leftInset?: number;
};

export function LogoutDialog({
    open,
    onClose,
    callbackUrl = '/',
    title = 'Log out of Nevo?',
    description = "Make sure you've saved your log in information.",
    confirmLabel = 'Log out',
    cancelLabel = 'Cancel',
    leftInset = 0,
}: LogoutDialogProps) {
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) {
            setSubmitting(false);
            return;
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !submitting) onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose, submitting]);

    if (!open) return null;

    const handleConfirm = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            await clearClientSessionState();
            await signOut({ callbackUrl });
        } catch (err: any) {
            setSubmitting(false);
            toast({
                title: 'Could not log out',
                message: err?.message || 'Something went wrong. Please try again.',
                variant: 'error',
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50">
            <div
                className="absolute inset-0 bg-black/30 animate-fade-in"
                onClick={() => {
                    if (!submitting) onClose();
                }}
                aria-hidden
                style={{ left: leftInset }}
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="logout-dialog-title"
                className="absolute left-0 right-0 bottom-0 bg-parchment rounded-t-[20px] flex flex-col animate-slide-up shadow-[0_-12px_32px_rgba(0,0,0,0.18)]"
                style={{ left: leftInset }}
            >
                <div className="flex justify-center pt-[10px] pb-1">
                    <div className="w-10 h-1 rounded-full bg-[#C8C1B4]" />
                </div>

                <div className="px-6 pt-5 pb-10">
                    <h3
                        id="logout-dialog-title"
                        className="text-[16px] font-semibold leading-6 text-indigo"
                    >
                        {title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-5 text-graphite/65">
                        {description}
                    </p>

                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={submitting}
                        className="mt-6 w-full h-12 rounded-[12px] border border-[#C0392B] text-[#C0392B] text-[15px] font-semibold leading-[22px] bg-transparent cursor-pointer disabled:opacity-60 disabled:cursor-default"
                    >
                        {submitting ? 'Logging out...' : confirmLabel}
                    </button>

                    <div className="mt-4 flex justify-center">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="text-[15px] leading-[22px] text-indigo/65 hover:text-indigo cursor-pointer bg-transparent border-none disabled:cursor-default"
                        >
                            {cancelLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
