'use client';

import { useEffect, useRef, useState } from 'react';
import { updateLessonProgress } from '@/features/Dashboard/api/student';
import { useLessonPlayer } from '../api/useLessonPlayer';
import { useApiTokenExpiryRedirect } from '@/shared/lib';
import { LessonCompletionScreen } from './LessonCompletionScreen';
import { LessonPlayerSkeleton } from './LessonPlayerSkeleton';
import { completeLessonSession } from '../api/lessonSessionTelemetry';

type LessonCompletionRouteProps = {
    lessonId: string;
    showNextLesson: boolean;
};

function getLessonProgressIdCandidates(...values: Array<string | undefined>) {
    return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)));
}

async function syncLessonCompletion(
    ids: string[],
    payload: Omit<Parameters<typeof updateLessonProgress>[0], 'lesson_id'>,
) {
    let lastError: string | undefined;

    for (const id of ids) {
        const result = await updateLessonProgress({
            lesson_id: id,
            ...payload,
        });

        if (!result?.error) {
            return result;
        }

        lastError = result.error;
    }

    return { error: lastError || 'Failed to save lesson completion.' };
}

export function LessonCompletionRoute({ lessonId, showNextLesson }: LessonCompletionRouteProps) {
    useApiTokenExpiryRedirect('student');
    const { data, loading, error } = useLessonPlayer(lessonId);
    const completionSavedRef = useRef(false);
    const [isSavingCompletion, setIsSavingCompletion] = useState(true);
    const [completionSaveError, setCompletionSaveError] = useState<string | null>(null);

    useEffect(() => {
        if (!data) return;
        if (completionSavedRef.current) {
            return;
        }

        completionSavedRef.current = true;

        const progressIdCandidates = getLessonProgressIdCandidates(
            lessonId,
            data.id,
            data.originalLessonId,
            data.adaptedLessonId,
        );

        syncLessonCompletion(progressIdCandidates, {
            blocks_completed: Math.max(1, data.stageOrder.length),
            time_spent_seconds: 1,
            is_completed: true,
        })
            .then((result) => {
                if (result?.error) {
                    completionSavedRef.current = false;
                    setCompletionSaveError(result.error);
                    setIsSavingCompletion(false);
                    return;
                }

                void completeLessonSession(lessonId, {
                    time_spent_seconds: Math.max(1, data.stageOrder.length * 60),
                    sections_completed: Math.max(1, data.stageOrder.length),
                    concepts_covered: Math.max(
                        1,
                        data.completion.conceptResults.length || data.stageOrder.length,
                    ),
                    moments_of_clarity: data.completion.conceptResults.filter(
                        (concept) => concept.status === 'understood',
                    ).length,
                    tools_used: {
                        completed_from: 'lesson_completion_route',
                    },
                });
                setIsSavingCompletion(false);
            })
            .catch(() => {
                completionSavedRef.current = false;
                setCompletionSaveError('Failed to save lesson completion.');
                setIsSavingCompletion(false);
            });
    }, [data, lessonId]);

    if (loading || isSavingCompletion) {
        return (
            <LessonPlayerSkeleton
                pillWidthClassName="w-24"
                statusLabel={isSavingCompletion ? 'Saving lesson progress...' : undefined}
            />
        );
    }

    if (error || completionSaveError || !data) {
        return (
            <LessonPlayerSkeleton
                pillWidthClassName="w-24"
                statusLabel={completionSaveError || error ? 'Retrying lesson sync...' : 'Preparing completion...'}
            />
        );
    }

    return <LessonCompletionScreen lessonId={lessonId} completion={data.completion} showNextLesson={showNextLesson} />;
}
