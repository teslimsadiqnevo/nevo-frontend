import { LessonPlayerPreloader } from '@/features/LessonPlayer';

type LessonLayoutProps = {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
};

export default async function LessonLayout({ children, params }: LessonLayoutProps) {
    const { id } = await params;

    return (
        <>
            <LessonPlayerPreloader lessonId={id} />
            {children}
        </>
    );
}
