'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function TeacherInviteAcceptPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const [message, setMessage] = useState('Preparing your class access...');
    const [error, setError] = useState<string | null>(null);
    const token = searchParams.get('token') || '';

    const loginRedirect = useMemo(() => {
        const path = `/teacher/invite/accept?token=${encodeURIComponent(token)}`;
        return `/login/teacher?invite_token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(path)}`;
    }, [token]);

    useEffect(() => {
        if (!token) {
            setError('This invite link is incomplete.');
            return;
        }

        if (status === 'loading') return;

        if (!session?.user) {
            router.replace(loginRedirect);
            return;
        }

        if ((session.user as any).role !== 'teacher') {
            setError('This invite can only be accepted by a teacher account.');
            return;
        }

        let cancelled = false;

        void (async () => {
            setMessage('Joining your school class...');
            const res = await fetch('/api/auth/teacher/accept-school-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });

            const data = await res.json().catch(() => ({}));
            if (cancelled) return;

            if (!res.ok) {
                setError(
                    String(
                        data?.detail ||
                        data?.message ||
                        'We could not finish attaching your class. Please try again.'
                    ),
                );
                return;
            }

            setMessage('Class attached. Taking you to your students...');
            router.replace('/dashboard?view=students');
        })();

        return () => {
            cancelled = true;
        };
    }, [token, status, session, router, loginRedirect]);

    return (
        <div className="min-h-screen bg-[#F7F1E6] flex items-center justify-center px-6">
            <div className="w-full max-w-[420px] rounded-[20px] border border-[#E0D9CE] bg-white px-8 py-10 text-center shadow-[0_12px_40px_rgba(59,63,110,0.08)]">
                <div className="mx-auto mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[rgba(154,156,203,0.18)]">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3B3F6E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 12h8" />
                        <path d="M12 8v8" />
                        <path d="M20 12c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8Z" />
                    </svg>
                </div>
                <h1 className="text-[24px] font-bold text-[#3B3F6E]">Teacher invite</h1>
                <p className="mt-3 text-[14px] leading-[22px] text-[#2B2B2F]/65">
                    {error || message}
                </p>
                {error ? (
                    <button
                        type="button"
                        onClick={() => router.replace('/dashboard?view=connect')}
                        className="mt-7 inline-flex h-[44px] items-center justify-center rounded-[12px] border border-[#3B3F6E] px-5 text-[14px] font-medium text-[#3B3F6E]"
                    >
                        Go to dashboard
                    </button>
                ) : null}
            </div>
        </div>
    );
}
