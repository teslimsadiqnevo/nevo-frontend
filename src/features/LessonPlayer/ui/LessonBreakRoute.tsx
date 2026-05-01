'use client';

import { useLessonPlayer } from '../api/useLessonPlayer';
import type { LessonBreakVariant, StageKey } from '../api/types';
import { LessonBreakScreen } from './LessonBreakScreen';

type LessonBreakRouteProps = {
    lessonId: string;
    variant: LessonBreakVariant;
    returnStage: StageKey;
};

export function LessonBreakRoute({ lessonId, variant, returnStage }: LessonBreakRouteProps) {
    const { data, loading, error } = useLessonPlayer(lessonId);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-parchment">
                <span className="text-[14px] text-graphite-60">Loading lesson...</span>
            </div>
        );
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
