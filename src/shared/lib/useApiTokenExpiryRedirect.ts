'use client';

import { useEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { getApiTokenExpiryMs } from './apiTokenExpiry';

export type ApiTokenRole = 'teacher' | 'student' | 'school';

const LOGIN_PATH: Record<ApiTokenRole, string> = {
    teacher: '/login/teacher',
    student: '/login/student',
    school: '/login/school',
};

type SessionUser = {
    role?: string;
    apiToken?: string;
    apiTokenExpiresAt?: number | null;
};

type SessionPayload = {
    user?: SessionUser;
};

export function useApiTokenExpiryRedirect(role: ApiTokenRole) {
    const redirectingRef = useRef(false);

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        let cancelled = false;

        const clearTimer = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
        };

        const redirectToLogin = async () => {
            if (redirectingRef.current || cancelled) return;
            redirectingRef.current = true;
            await signOut({ redirect: false });
            if (!cancelled && typeof window !== 'undefined') {
                window.location.replace(LOGIN_PATH[role]);
            }
        };

        const syncExpiry = async () => {
            clearTimer();

            try {
                const response = await fetch('/api/auth/session', {
                    cache: 'no-store',
                    credentials: 'same-origin',
                });
                const data = (await response.json().catch(() => ({}))) as SessionPayload;
                const user = data?.user;

                if (!user) {
                    await redirectToLogin();
                    return;
                }

                const sessionRole = typeof user.role === 'string' ? user.role.toLowerCase() : '';
                if (
                    (role === 'school' && sessionRole !== 'school_admin' && sessionRole !== 'school') ||
                    (role !== 'school' && sessionRole !== role)
                ) {
                    return;
                }

                const expiryMs =
                    typeof user.apiTokenExpiresAt === 'number' && Number.isFinite(user.apiTokenExpiresAt)
                        ? user.apiTokenExpiresAt
                        : getApiTokenExpiryMs(user.apiToken);

                if (!expiryMs) return;

                const remainingMs = expiryMs - Date.now();
                if (remainingMs <= 0) {
                    await redirectToLogin();
                    return;
                }

                timeoutId = setTimeout(() => {
                    void redirectToLogin();
                }, remainingMs);
            } catch {
                // If session probing fails transiently, leave the current state alone.
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                void syncExpiry();
            }
        };

        void syncExpiry();
        window.addEventListener('focus', syncExpiry);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            cancelled = true;
            clearTimer();
            window.removeEventListener('focus', syncExpiry);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [role]);
}
