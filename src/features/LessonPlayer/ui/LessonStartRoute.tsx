'use client';

import { useLessonPlayer } from '../api/useLessonPlayer';
import { LessonStartScreen } from './LessonStartScreen';

type LessonStartRouteProps = {
    lessonId: string;
};

export function LessonStartRoute({ lessonId }: LessonStartRouteProps) {
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

    return <LessonStartScreen lessonId={lessonId} data={data} />;
}
