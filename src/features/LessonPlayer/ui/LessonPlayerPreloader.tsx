'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLessonPlayer } from '../api/useLessonPlayer';

type LessonPlayerPreloaderProps = {
    lessonId: string;
};

export function LessonPlayerPreloader({ lessonId }: LessonPlayerPreloaderProps) {
    const router = useRouter();
    const { data } = useLessonPlayer(lessonId);

    useEffect(() => {
        if (!data) return;

        data.stageOrder.forEach((stageKey) => {
            router.prefetch(`/lesson/${lessonId}/${stageKey}`);
        });

        router.prefetch(`/lesson/${lessonId}/assessment`);
        router.prefetch(`/lesson/${lessonId}/complete`);

        data.microQuiz.forEach((question, index) => {
            const returnStage = question.continueToStageKey ? `&stage=${question.continueToStageKey}` : '';
            router.prefetch(`/lesson/${lessonId}/micro-quiz?index=${index}${returnStage}`);
        });
    }, [data, lessonId, router]);

    return null;
}
