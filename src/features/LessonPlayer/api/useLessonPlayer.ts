'use client';

import { useEffect, useState } from 'react';
import { getLessonPlayer } from './lessonPlayerAdapter';
import type { LessonPlayerData } from './types';

type LessonPlayerHookState = {
    data: LessonPlayerData | null;
    loading: boolean;
    error: string | null;
};

const lessonPlayerCache = new Map<string, LessonPlayerData>();
const lessonPlayerInflight = new Map<string, Promise<LessonPlayerData>>();

function readCachedLessonPlayer(lessonId: string) {
    return lessonPlayerCache.get(lessonId) ?? null;
}

async function loadLessonPlayer(lessonId: string) {
    const cached = lessonPlayerCache.get(lessonId);
    if (cached) {
        return cached;
    }

    const inflight = lessonPlayerInflight.get(lessonId);
    if (inflight) {
        return inflight;
    }

    const request = getLessonPlayer(lessonId)
        .then((data) => {
            lessonPlayerCache.set(lessonId, data);
            lessonPlayerInflight.delete(lessonId);
            return data;
        })
        .catch((error) => {
            lessonPlayerInflight.delete(lessonId);
            throw error;
        });

    lessonPlayerInflight.set(lessonId, request);
    return request;
}

export function useLessonPlayer(lessonId: string): LessonPlayerHookState {
    const [state, setState] = useState<LessonPlayerHookState>({
        data: readCachedLessonPlayer(lessonId),
        loading: !readCachedLessonPlayer(lessonId),
        error: null,
    });

    useEffect(() => {
        let cancelled = false;
        const cached = readCachedLessonPlayer(lessonId);

        setState({
            data: cached,
            loading: !cached,
            error: null,
        });

        loadLessonPlayer(lessonId)
            .then((data) => {
                if (cancelled) return;
                setState({ data, loading: false, error: null });
            })
            .catch((err) => {
                if (cancelled) return;
                setState({
                    data: readCachedLessonPlayer(lessonId),
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
