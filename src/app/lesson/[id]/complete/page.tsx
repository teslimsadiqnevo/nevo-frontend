import { LessonCompletionRoute } from '@/features/LessonPlayer';

type PageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ next?: string }>;
};

export default async function LessonCompletePage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const resolvedSearchParams = await searchParams;
    const showNextLesson = resolvedSearchParams.next !== 'none';

    return <LessonCompletionRoute lessonId={id} showNextLesson={showNextLesson} />;
}
