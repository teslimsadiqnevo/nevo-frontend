'use client';

import type { LearningMode } from '@/shared/store/useRegistrationStore';
import type { Stage } from './types';

type LessonSessionResponse = {
    session_id?: string;
    lesson_id?: string;
};

export type LessonSessionSignalPayload = {
    lesson_section: number;
    concept_id?: string | null;
    learning_mode_delivered?: string | null;
    time_spent_seconds?: number;
    simplify_count?: number;
    expand_count?: number;
    slower_count?: number;
    tts_activated?: boolean;
    tts_completion_rate?: number;
    checkpoint_result?: 'correct' | 'incorrect' | null;
    confidence_self_report?: number | null;
    revisit_count?: number;
    completion_status?: string | null;
    image_viewed?: boolean;
    signal_type: string;
    camera_detected?: boolean | null;
    timestamp?: string;
};

type StoredLessonSession = {
    sessionId: string;
    lessonId: string;
    startedAt: number;
};

const STORAGE_PREFIX = 'nevo:lesson-session:v1:';

function storageKey(routeLessonId: string) {
    return `${STORAGE_PREFIX}${routeLessonId}`;
}

function readStoredSession(routeLessonId: string): StoredLessonSession | null {
    if (typeof window === 'undefined') return null;

    try {
        const raw = window.localStorage.getItem(storageKey(routeLessonId));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<StoredLessonSession>;
        if (!parsed.sessionId || !parsed.lessonId) return null;
        return {
            sessionId: parsed.sessionId,
            lessonId: parsed.lessonId,
            startedAt: Number(parsed.startedAt || Date.now()),
        };
    } catch {
        return null;
    }
}

function writeStoredSession(routeLessonId: string, session: StoredLessonSession) {
    if (typeof window === 'undefined') return;

    try {
        window.localStorage.setItem(storageKey(routeLessonId), JSON.stringify(session));
    } catch {
        // Telemetry must never block the lesson experience.
    }
}

export function getStoredLessonSessionId(routeLessonId: string) {
    return readStoredSession(routeLessonId)?.sessionId ?? null;
}

export async function ensureLessonSession(
    routeLessonId: string,
    lessonIdCandidates: string[],
): Promise<string | null> {
    const stored = readStoredSession(routeLessonId);
    if (stored?.sessionId) {
        return stored.sessionId;
    }

    const candidates = Array.from(
        new Set(lessonIdCandidates.map((candidate) => candidate.trim()).filter(Boolean)),
    );

    for (const lessonId of candidates) {
        try {
            const response = await fetch('/api/lesson-sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lesson_id: lessonId }),
            });
            const payload = (await response.json().catch(() => ({}))) as LessonSessionResponse;
            if (!response.ok || !payload.session_id) {
                continue;
            }

            writeStoredSession(routeLessonId, {
                sessionId: payload.session_id,
                lessonId: payload.lesson_id || lessonId,
                startedAt: Date.now(),
            });
            return payload.session_id;
        } catch {
            // Try the next candidate. Some views use adapted ids while assignments use source ids.
        }
    }

    return null;
}

export async function logLessonSessionSignal(
    sessionId: string,
    signal: LessonSessionSignalPayload,
) {
    try {
        await fetch(`/api/lesson-sessions/${encodeURIComponent(sessionId)}/signal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                time_spent_seconds: 0,
                simplify_count: 0,
                expand_count: 0,
                slower_count: 0,
                tts_activated: false,
                tts_completion_rate: 0,
                revisit_count: 0,
                image_viewed: false,
                ...signal,
                timestamp: signal.timestamp || new Date().toISOString(),
            }),
            keepalive: true,
        });
    } catch {
        // Best-effort telemetry only.
    }
}

export async function completeLessonSession(
    routeLessonId: string,
    payload: {
        time_spent_seconds: number;
        sections_completed: number;
        concepts_covered: number;
        moments_of_clarity?: number;
        tools_used?: Record<string, unknown>;
        quiz_score?: number | null;
    },
) {
    const sessionId = getStoredLessonSessionId(routeLessonId);
    if (!sessionId) return;

    try {
        await fetch(`/api/lesson-sessions/${encodeURIComponent(sessionId)}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                moments_of_clarity: 0,
                tools_used: {},
                quiz_score: null,
                ...payload,
            }),
            keepalive: true,
        });
    } catch {
        // Progress saving remains the source of truth if telemetry completion fails.
    }
}

export function getStageConceptId(stage: Stage | null | undefined) {
    return (
        stage?.modes.visual.conceptId ||
        stage?.modes.reading.keyTerm ||
        stage?.label ||
        null
    );
}

export function getDeliveredMode(mode: LearningMode) {
    if (mode === 'audio') return 'auditory';
    if (mode === 'action') return 'kinesthetic';
    return mode;
}
