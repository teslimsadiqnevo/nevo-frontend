'use client';

import { useRouter } from 'next/navigation';
import { getDashboardPath } from '@/shared/lib';
import type {
    LessonCompletionData,
    LessonCompletionMetric,
    LessonConceptResult,
    LessonConceptResultStatus,
} from '../api/types';

type LessonCompletionScreenProps = {
    lessonId: string;
    completion: LessonCompletionData;
    showNextLesson: boolean;
};

const STATUS_COPY: Record<LessonConceptResultStatus, string> = {
    understood: 'understood',
    needed_more_time: 'Needed more time',
    simplified: 'Simplified',
};

const STATUS_STYLE: Record<LessonConceptResultStatus, { dot: string; text: string }> = {
    understood: {
        dot: 'bg-[#7AB87A]',
        text: 'text-[#7AB87A]',
    },
    needed_more_time: {
        dot: 'bg-[#E8A84A]',
        text: 'text-[#E8A84A]',
    },
    simplified: {
        dot: 'bg-[#9A9CCB]',
        text: 'text-[#9A9CCB]',
    },
};

function SummaryMetricCard({ metric }: { metric: LessonCompletionMetric }) {
    const valueClass = metric.accent === 'indigo' ? 'text-lavender' : 'text-indigo';

    return (
        <div className="flex h-[98px] flex-1 flex-col items-center justify-center rounded-xl border border-[#E0D9CE] bg-white px-3">
            <div className={`text-[32px] font-bold leading-[48px] ${valueClass}`}>{metric.value}</div>
            <div className="mt-2 text-[12px] leading-4 text-indigo/55">{metric.label}</div>
        </div>
    );
}

function ConceptResultRow({ result }: { result: LessonConceptResult }) {
    const style = STATUS_STYLE[result.status];

    return (
        <div className="flex min-h-12 items-center justify-between gap-6 py-[14px]">
            <span className="text-[14px] leading-5 text-graphite">{result.label}</span>
            <div className="flex shrink-0 items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                <span className={`text-[12px] leading-4 opacity-80 ${style.text}`}>
                    {STATUS_COPY[result.status]}
                </span>
            </div>
        </div>
    );
}

export function LessonCompletionScreen({
    completion,
    showNextLesson,
}: LessonCompletionScreenProps) {
    const router = useRouter();
    const nextLesson = showNextLesson ? completion.nextLesson : undefined;

    return (
        <div className="min-h-screen bg-parchment">
            <div className="mx-auto flex min-h-screen w-full max-w-[1024px] flex-col bg-parchment">
                <div className="flex h-14 items-center px-4">
                    <button
                        type="button"
                        onClick={() => router.push(getDashboardPath('student', 'lessons'))}
                        className="flex h-5 w-5 items-center justify-center border-none bg-transparent cursor-pointer"
                        aria-label="Back to lessons"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path
                                d="M12.5 4L6.5 10L12.5 16"
                                stroke="#3B3F6E"
                                strokeWidth="1.875"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>

                <div className="mx-auto flex w-full max-w-[640px] flex-col gap-8 px-0 pb-12 pt-14">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-[20px] font-bold leading-[30px] text-indigo">{completion.heading}</h1>
                        <div className="inline-flex w-fit rounded-2xl bg-lavender-20 px-3 py-2 text-[11px] font-medium leading-4 text-indigo">
                            {completion.badgeLabel}
                        </div>
                        <div className="text-[12px] leading-4 text-indigo/50">{completion.completedAtLabel}</div>
                    </div>

                    <div className="grid grid-cols-3 gap-[14px]">
                        {completion.metrics.map((metric) => (
                            <SummaryMetricCard key={`${metric.label}:${metric.value}`} metric={metric} />
                        ))}
                    </div>

                    <div className="flex flex-col gap-4 pt-2">
                        <h2 className="text-[14px] font-semibold uppercase tracking-[0.5px] text-indigo/70">
                            How each concept went
                        </h2>
                        <div className="flex flex-col">
                            {completion.conceptResults.map((result) => (
                                <ConceptResultRow key={result.label} result={result} />
                            ))}
                        </div>
                    </div>

                    <div className="px-4 py-4">
                        <p className="text-[14px] leading-5 text-indigo">{completion.modeSummary.title}</p>
                        <p className="mt-[7px] text-[13px] leading-5 text-indigo/65">{completion.modeSummary.description}</p>
                    </div>

                    {nextLesson ? (
                        <div className="flex flex-col gap-4 pt-2">
                            <h2 className="text-[14px] font-semibold text-indigo/70">Continue learning</h2>
                            <div className="rounded-xl border border-[#E0D9CE] bg-white px-4 py-4">
                                <p className="text-[11px] uppercase tracking-[0.275px] text-indigo/50">Up next</p>
                                <h3 className="mt-3 text-[14px] font-semibold leading-5 text-indigo">{nextLesson.title}</h3>
                                <div className="mt-4 flex items-center gap-3">
                                    {nextLesson.subjectLabel ? (
                                        <span className="rounded-2xl bg-lavender-20 px-3 py-2 text-[11px] font-medium leading-4 text-indigo">
                                            {nextLesson.subjectLabel}
                                        </span>
                                    ) : null}
                                    <span className="text-[12px] leading-4 text-graphite/60">{nextLesson.durationLabel}</span>
                                </div>
                                <div className="mt-5 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => router.push(`/lesson/${nextLesson.id}`)}
                                        className="border-none bg-transparent p-0 text-[13px] leading-5 text-lavender cursor-pointer"
                                    >
                                        {nextLesson.ctaLabel}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <button
                        type="button"
                        onClick={() => router.push(getDashboardPath('student', 'lessons'))}
                        className="mt-2 flex h-12 w-full items-center justify-center rounded-xl border-2 border-indigo bg-white text-[14px] font-semibold leading-5 text-indigo cursor-pointer"
                    >
                        {completion.browseCtaLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
