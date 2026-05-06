'use client';

import { useEffect, useRef } from 'react';
import { updateLessonProgress } from '@/features/Dashboard/api/student';
import { useLessonPlayer } from '../api/useLessonPlayer';
import { useApiTokenExpiryRedirect } from '@/shared/lib';
import { LessonCompletionScreen } from './LessonCompletionScreen';
import { LessonPlayerSkeleton } from './LessonPlayerSkeleton';
import { STAGE_ORDER } from '../api/types';

type LessonCompletionRouteProps = {
    lessonId: string;
    showNextLesson: boolean;
};

export function LessonCompletionRoute({ lessonId, showNextLesson }: LessonCompletionRouteProps) {
    useApiTokenExpiryRedirect('student');
    const { data, loading, error } = useLessonPlayer(lessonId);
    const completionSavedRef = useRef(false);

    useEffect(() => {
        if (!data || completionSavedRef.current) return;
        completionSavedRef.current = true;

        updateLessonProgress({
            lesson_id: data.originalLessonId || lessonId,
            blocks_completed: STAGE_ORDER.length,
            time_spent_seconds: 1,
            is_completed: true,
        }).catch(() => {
            completionSavedRef.current = false;
        });
    }, [data, lessonId]);

    if (loading) {
        return <LessonPlayerSkeleton pillWidthClassName="w-24" />;
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-parchment">
                <span className="text-[14px] text-graphite-60">{error ?? 'Lesson not found'}</span>
            </div>
        );
    }

    return <LessonCompletionScreen lessonId={lessonId} completion={data.completion} showNextLesson={showNextLesson} />;
}
