import { LessonAssessmentRoute } from '@/features/LessonPlayer';

type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function LessonAssessmentPage({ params }: PageProps) {
    const { id } = await params;

    return <LessonAssessmentRoute lessonId={id} />;
}
