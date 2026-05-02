'use client';

import { useLessonPlayer } from '../api/useLessonPlayer';
import { LessonAssessmentScreen } from './LessonAssessmentScreen';

type LessonAssessmentRouteProps = {
    lessonId: string;
};

export function LessonAssessmentRoute({ lessonId }: LessonAssessmentRouteProps) {
    const { data, loading, error } = useLessonPlayer(lessonId);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-parchment">
                <span className="text-[14px] text-graphite-60">Loading assessment...</span>
            </div>
        );
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
