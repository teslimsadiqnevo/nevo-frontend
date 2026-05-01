import { notFound } from 'next/navigation';
import { LessonPlayer, STAGE_ORDER, type StageKey } from '@/features/LessonPlayer';

type PageProps = {
    params: Promise<{ id: string; stage: string }>;
};

export default async function LessonStagePage({ params }: PageProps) {
    const { id, stage } = await params;

    if (!STAGE_ORDER.includes(stage as StageKey)) {
        notFound();
    }

    return <LessonPlayer lessonId={id} stage={stage as StageKey} />;
}
