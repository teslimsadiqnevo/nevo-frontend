'use client';

import { useEffect, useState } from 'react';
import { getLessonPlayer } from './lessonPlayerAdapter';
import type { LessonPlayerData } from './types';

type LessonPlayerHookState = {
    data: LessonPlayerData | null;
    loading: boolean;
    error: string | null;
};

export function useLessonPlayer(lessonId: string): LessonPlayerHookState {
    const [state, setState] = useState<LessonPlayerHookState>({
        data: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        let cancelled = false;
        setState({ data: null, loading: true, error: null });

        getLessonPlayer(lessonId)
            .then((data) => {
                if (cancelled) return;
                setState({ data, loading: false, error: null });
            })
            .catch((err) => {
                if (cancelled) return;
                setState({
                    data: null,
                    loading: false,
                    error: err instanceof Error ? err.message : 'Failed to load lesson',
                });
            });

        return () => {
            cancelled = true;
        };
    }, [lessonId]);

    return state;
}
