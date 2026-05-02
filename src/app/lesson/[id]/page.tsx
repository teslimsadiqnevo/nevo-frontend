import { LessonStartRoute } from '@/features/LessonPlayer';

type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function LessonStartPage({ params }: PageProps) {
    const { id } = await params;

    return <LessonStartRoute lessonId={id} />;
}
