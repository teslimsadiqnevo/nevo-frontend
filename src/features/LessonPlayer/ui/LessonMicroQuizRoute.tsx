'use client';

import { useLessonPlayer } from '../api/useLessonPlayer';
import { useApiTokenExpiryRedirect } from '@/shared/lib';
import { LessonMicroQuizScreen } from './LessonMicroQuizScreen';
import { LessonPlayerSkeleton } from './LessonPlayerSkeleton';

type LessonMicroQuizRouteProps = {
    lessonId: string;
    index: number;
};

export function LessonMicroQuizRoute({ lessonId, index }: LessonMicroQuizRouteProps) {
    useApiTokenExpiryRedirect('student');
    const { data, loading, error } = useLessonPlayer(lessonId);

    if (loading) {
        return <LessonPlayerSkeleton pillWidthClassName="w-20" />;
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-parchment">
                <span className="text-[14px] text-graphite-60">{error ?? 'Quiz not found'}</span>
            </div>
        );
    }

    return <LessonMicroQuizScreen lessonId={lessonId} data={data} index={index} />;
}
