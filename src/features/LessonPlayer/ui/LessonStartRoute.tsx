'use client';

import { useLessonPlayer } from '../api/useLessonPlayer';
import { useApiTokenExpiryRedirect } from '@/shared/lib';
import { LessonStartScreen } from './LessonStartScreen';
import { LessonPlayerSkeleton } from './LessonPlayerSkeleton';

type LessonStartRouteProps = {
    lessonId: string;
};

export function LessonStartRoute({ lessonId }: LessonStartRouteProps) {
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

    return <LessonStartScreen lessonId={lessonId} data={data} />;
}
