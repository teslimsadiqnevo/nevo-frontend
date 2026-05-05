'use client';

import { useCallback, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { useToastStore } from '@/shared/ui/Toast';

export type AuthRole = 'teacher' | 'student' | 'school';

const LOGIN_PATH: Record<AuthRole, string> = {
    teacher: '/login/teacher',
    student: '/login/student',
    school: '/login/school',
};

const AUTH_EXPIRED_PATTERN = /invalid|expired|unauthorized|token/i;

type AuthGuardable = { authExpired?: boolean; error?: string } | null | undefined;

function isExpiredResponse(value: AuthGuardable | AuthGuardable[]): boolean {
    const list = Array.isArray(value) ? value : [value];
    return list.some((entry) => {
        if (!entry) return false;
        if (entry.authExpired) return true;
        if (typeof entry.error === 'string' && AUTH_EXPIRED_PATTERN.test(entry.error)) {
            return true;
        }
        return false;
    });
}

/**
 * Detects expired/invalid auth responses from server actions and centralizes
 * the recovery flow: surface a toast, sign the user out, and bounce them to
 * the right login page. Returns `true` when the caller should stop further
 * work (because we've handed control to the redirect).
 */
export function useAuthGuard(role: AuthRole) {
    const showToast = useToastStore((state) => state.show);
    const triggered = useRef(false);

    return useCallback(
        (response: AuthGuardable | AuthGuardable[]): boolean => {
            if (!isExpiredResponse(response)) return false;
            if (triggered.current) return true;
            triggered.current = true;

            showToast({
                title: 'Session expired',
                message: 'Your session has expired. Please sign in again.',
                variant: 'warning',
                durationMs: 5000,
            });

            void signOut({ redirect: false }).finally(() => {
                if (typeof window !== 'undefined') {
                    window.location.replace(LOGIN_PATH[role]);
                }
            });
            return true;
        },
        [role, showToast],
    );
}
