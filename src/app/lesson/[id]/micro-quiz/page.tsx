import { LessonMicroQuizRoute } from '@/features/LessonPlayer';

type PageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ index?: string }>;
};

export default async function LessonMicroQuizPage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const resolvedSearchParams = await searchParams;
    const parsedIndex = Number.parseInt(resolvedSearchParams.index ?? '0', 10);
    const index = Number.isNaN(parsedIndex) ? 0 : parsedIndex;

    return <LessonMicroQuizRoute lessonId={id} index={index} />;
}
