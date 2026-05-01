'use client';

import { useLessonPlayer } from '../api/useLessonPlayer';
import { LessonCompletionScreen } from './LessonCompletionScreen';

type LessonCompletionRouteProps = {
    lessonId: string;
    showNextLesson: boolean;
};

export function LessonCompletionRoute({ lessonId, showNextLesson }: LessonCompletionRouteProps) {
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

    return <LessonCompletionScreen lessonId={lessonId} completion={data.completion} showNextLesson={showNextLesson} />;
}
