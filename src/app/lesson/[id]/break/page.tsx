import { LessonBreakRoute, type StageKey } from '@/features/LessonPlayer';
import type { LessonBreakVariant } from '@/features/LessonPlayer/api/types';

type PageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ variant?: string; returnStage?: string }>;
};

export default async function LessonBreakPage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const resolvedSearchParams = await searchParams;
    const variant = resolvedSearchParams.variant === 'long' ? 'long' : 'quick';
    const returnStage = (resolvedSearchParams.returnStage ?? 'step-2') as StageKey;

    return <LessonBreakRoute lessonId={id} variant={variant as LessonBreakVariant} returnStage={returnStage} />;
}
