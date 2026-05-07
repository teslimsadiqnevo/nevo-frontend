'use client';

import { useLessonPlayer } from '../api/useLessonPlayer';
import { useApiTokenExpiryRedirect } from '@/shared/lib';
import { LessonMicroQuizScreen } from './LessonMicroQuizScreen';
import { LessonPlayerSkeleton } from './LessonPlayerSkeleton';

type LessonMicroQuizRouteProps = {
    lessonId: string;
    index: number;
    stageKey?: string;
};

export function LessonMicroQuizRoute({ lessonId, index, stageKey }: LessonMicroQuizRouteProps) {
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

    const stageIndex =
        stageKey && data.stageOrder.includes(stageKey)
            ? data.stageOrder.indexOf(stageKey)
            : -1;
    const moduleNumberFromStage =
        stageIndex >= 0
            ? data.stages[stageIndex]?.moduleNumber
            : undefined;
    const contextualIndex =
        moduleNumberFromStage != null
            ? data.microQuiz.findIndex((question) => question.moduleNumber === moduleNumberFromStage)
            : -1;
    const resolvedIndex = contextualIndex >= 0 ? contextualIndex : index;

    return <LessonMicroQuizScreen lessonId={lessonId} data={data} index={resolvedIndex} returnStageKey={stageKey} />;
}
