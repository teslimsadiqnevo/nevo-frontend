'use client';

import { useLessonPlayer } from '../api/useLessonPlayer';
import { useApiTokenExpiryRedirect } from '@/shared/lib';
import { LessonAssessmentScreen } from './LessonAssessmentScreen';
import { LessonPlayerSkeleton } from './LessonPlayerSkeleton';

type LessonAssessmentRouteProps = {
    lessonId: string;
};

export function LessonAssessmentRoute({ lessonId }: LessonAssessmentRouteProps) {
    useApiTokenExpiryRedirect('student');
    const { data, loading, error } = useLessonPlayer(lessonId);

    if (loading) {
        return <LessonPlayerSkeleton pillWidthClassName="w-28" />;
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-parchment">
                <span className="text-[14px] text-graphite-60">{error ?? 'Assessment not found'}</span>
            </div>
        );
    }

    return <LessonAssessmentScreen lessonId={lessonId} data={data} />;
}
