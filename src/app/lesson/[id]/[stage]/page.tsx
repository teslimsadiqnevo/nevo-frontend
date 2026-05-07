import { LessonPlayer, type StageKey } from '@/features/LessonPlayer';

type PageProps = {
    params: Promise<{ id: string; stage: string }>;
};

export default async function LessonStagePage({ params }: PageProps) {
    const { id, stage } = await params;

    return <LessonPlayer lessonId={id} stage={stage as StageKey} />;
}
