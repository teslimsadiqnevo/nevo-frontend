'use client';

import { useLessonPlayer } from '../api/useLessonPlayer';
import { useApiTokenExpiryRedirect } from '@/shared/lib';
import type { LessonBreakVariant, StageKey } from '../api/types';
import { LessonBreakScreen } from './LessonBreakScreen';
import { LessonPlayerSkeleton } from './LessonPlayerSkeleton';

type LessonBreakRouteProps = {
    lessonId: string;
    variant: LessonBreakVariant;
    returnStage: StageKey;
};

export function LessonBreakRoute({ lessonId, variant, returnStage }: LessonBreakRouteProps) {
    useApiTokenExpiryRedirect('student');
    const { data, loading, error } = useLessonPlayer(lessonId);

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

    return <LessonBreakScreen lessonId={lessonId} data={data} variant={variant} returnStage={returnStage} />;
}
