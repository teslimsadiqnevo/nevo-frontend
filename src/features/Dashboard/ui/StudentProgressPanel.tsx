'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStudentSubjectDetail } from '../api/student';
import { normalizeStudentProgress, type StudentProgressSubject } from '../api/studentProgress';

type StudentProgressPanelProps = {
    progressData?: unknown;
};

type SubjectDetail = StudentProgressSubject;

export function StudentProgressPanel({ progressData }: StudentProgressPanelProps) {
    const router = useRouter();
    const [selectedSubject, setSelectedSubject] = useState<SubjectDetail | null>(null);
    const progress = useMemo(() => normalizeStudentProgress(progressData), [progressData]);

    if (!progress.hasProgress) {
        return (
            <div className="flex h-[calc(100vh-96px)] flex-col items-center justify-center">
                <div className="mb-8 flex h-[200px] w-[240px] items-center justify-center">
                    <svg width="240" height="200" viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_progress_empty)">
                            <g opacity="0.9">
                                <path opacity="0.3" d="M60 60V160L120 150V50L60 60Z" fill="#9A9CCB" />
                                <path opacity="0.4" d="M70 75H110" stroke="#9A9CCB" strokeWidth="2" strokeLinecap="round" />
                                <path opacity="0.4" d="M70 90H110" stroke="#9A9CCB" strokeWidth="2" strokeLinecap="round" />
                                <path opacity="0.4" d="M70 105H110" stroke="#9A9CCB" strokeWidth="2" strokeLinecap="round" />
                                <path opacity="0.15" d="M120 50V150L180 160V60L120 50Z" fill="#3B3F6E" />
                                <path opacity="0.3" d="M130 75H170" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round" />
                                <path opacity="0.3" d="M130 90H170" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round" />
                                <path opacity="0.3" d="M130 105H170" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round" />
                                <path opacity="0.4" d="M120 50V150" stroke="#3B3F6E" strokeWidth="3" />
                            </g>
                            <g opacity="0.7">
                                <path opacity="0.6" d="M70 48C74.4183 48 78 44.4183 78 40C78 35.5817 74.4183 32 70 32C65.5817 32 62 35.5817 62 40C62 44.4183 65.5817 48 70 48Z" fill="#F7C948" />
                                <path opacity="0.4" d="M170 41C173.314 41 176 38.3137 176 35C176 31.6863 173.314 29 170 29C166.686 29 164 31.6863 164 35C164 38.3137 166.686 41 170 41Z" fill="#F7C948" />
                                <path opacity="0.3" d="M85 140L95 130L105 135L115 125" stroke="#3B3F6E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </g>
                            <g opacity="0.5">
                                <path d="M195 80L197 88L205 90L197 92L195 100L193 92L185 90L193 88L195 80Z" fill="#9A9CCB" />
                                <path d="M45 130L46 135L51 136L46 137L45 142L44 137L39 136L44 135L45 130Z" fill="#9A9CCB" />
                                <path d="M200 130L201 133L204 134L201 135L200 138L199 135L196 134L199 133L200 130Z" fill="#F7C948" />
                            </g>
                        </g>
                        <defs>
                            <clipPath id="clip0_progress_empty">
                                <rect width="240" height="200" fill="white" />
                            </clipPath>
                        </defs>
                    </svg>
                </div>

                <h2 className="text-center text-[20px] font-semibold leading-7 text-indigo">
                    Start Your Learning Journey
                </h2>
                <p className="mt-3 max-w-[400px] text-center text-[14px] leading-[22px] text-graphite/65">
                    Your progress will show here as you learn. Complete lessons to track your achievements and see how far you&apos;ve come.
                </p>
                <button
                    type="button"
                    onClick={() => router.push('/student/dashboard/lessons')}
                    className="mt-8 flex h-14 items-center justify-center rounded-xl border border-indigo px-10 text-[16px] font-semibold text-indigo cursor-pointer bg-transparent"
                >
                    Start a lesson
                </button>
            </div>
        );
    }

    if (selectedSubject) {
        return <SubjectDetailPanel subject={selectedSubject} onBack={() => setSelectedSubject(null)} />;
    }

    return (
        <div className="max-w-[820px]">
            <div className="mb-10 grid grid-cols-3 gap-4">
                {progress.metrics.map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-[#E0D9CE] bg-transparent px-6 py-5">
                        <div className="mb-1 text-[32px] font-bold leading-8 text-indigo">{stat.value}</div>
                        <div className="text-[12px] leading-4 text-graphite/60">{stat.label}</div>
                    </div>
                ))}
            </div>

            <section className="mb-10">
                <h3 className="mb-5 text-[15px] font-semibold uppercase tracking-[0.02em] text-indigo">
                    Your Subjects
                </h3>
                <div className="flex flex-col gap-4">
                    {progress.subjects.map((subject) => {
                        const pct = Math.max(0, Math.min(100, subject.progressPercentage));
                        return (
                            <button
                                key={subject.name}
                                type="button"
                                onClick={() => setSelectedSubject(subject)}
                                className="flex items-center gap-4 rounded-xl border border-[#E0D9CE] bg-transparent px-5 py-4 text-left cursor-pointer hover:bg-white/35"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-[15px] font-medium leading-[22px] text-black">
                                            {subject.name}
                                        </span>
                                        <span className="shrink-0 text-[12px] leading-4 text-black/55">
                                            {subject.conceptsUnderstood}/{subject.maxConcepts} concepts
                                        </span>
                                    </div>
                                    <div className="mt-3 h-[6px] w-full rounded-full bg-[#E8E2D4]">
                                        <div
                                            className="h-full rounded-full"
                                            style={{ width: `${pct}%`, backgroundColor: subject.color }}
                                        />
                                    </div>
                                </div>
                                <span className="shrink-0 text-[13px] font-medium leading-5 text-indigo/65">
                                    {Math.round(pct)}%
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>

            <section>
                <h3 className="mb-5 text-[15px] font-semibold uppercase tracking-[0.02em] text-indigo">
                    Recent
                </h3>
                {progress.recentActivity.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#E0D9CE] px-5 py-6 text-[14px] leading-5 text-graphite/60">
                        No recent progress yet. Once lessons are started or completed, activity will appear here.
                    </div>
                ) : (
                    <div className="flex flex-col gap-5">
                        {progress.recentActivity.map((item, index) => (
                            <div key={`${item.text}:${index}`} className="flex items-start gap-4">
                                <div className="flex w-2 flex-col items-center self-stretch">
                                    <div className="h-2 w-2 rounded-full bg-indigo" />
                                    {index < progress.recentActivity.length - 1 ? (
                                        <div className="mt-1 flex-1 w-px bg-indigo/30" />
                                    ) : null}
                                </div>
                                <div className="flex min-w-0 flex-1 items-start justify-between gap-6">
                                    <div className="min-w-0">
                                        <span className="block text-[14px] leading-5 text-black">{item.text}</span>
                                        {item.activityType ? (
                                            <span className="mt-1 block text-[11px] uppercase tracking-[0.04em] text-indigo/45">
                                                {item.activityType}
                                            </span>
                                        ) : null}
                                    </div>
                                    <span className="shrink-0 text-[12px] leading-4 text-black/50">{item.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function SubjectDetailPanel({ subject, onBack }: { subject: SubjectDetail; onBack: () => void }) {
    const [detail, setDetail] = useState<SubjectDetail>(subject);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadDetail() {
            setLoading(true);
            setError(null);
            try {
                const res = await getStudentSubjectDetail(subject.name);
                if (cancelled) return;
                if (res?.error) {
                    throw new Error(res.error);
                }

                const data = (res as any)?.data || {};
                const mappedConcepts = Array.isArray(data.concepts)
                    ? data.concepts.map((concept: Record<string, unknown>) => ({
                          name:
                              (typeof concept.name === 'string' && concept.name) ||
                              (typeof concept.title === 'string' && concept.title) ||
                              'Concept',
                          understood: ['completed', 'reinforced', 'mastered'].includes(
                              String(concept.status ?? concept.state ?? '').toLowerCase()
                          ) || Boolean(concept.understood ?? concept.complete ?? concept.completed),
                          status: typeof concept.status === 'string' ? concept.status : undefined,
                      }))
                    : [];

                setDetail({
                    ...subject,
                    conceptsAttempted: mappedConcepts.length || Number(data.concepts_learned ?? subject.conceptsAttempted ?? 0),
                    conceptsUnderstood: Number(data.concepts_reinforced ?? subject.conceptsUnderstood ?? 0),
                    progressPercentage: subject.progressPercentage,
                    conceptList: mappedConcepts,
                    lessons: Array.isArray(data.lessons)
                        ? data.lessons.map((lesson: Record<string, unknown>) => ({
                              lessonId:
                                  (typeof lesson.lesson_id === 'string' && lesson.lesson_id) ||
                                  undefined,
                              name:
                                  (typeof lesson.name === 'string' && lesson.name) ||
                                  (typeof lesson.title === 'string' && lesson.title) ||
                                  'Lesson',
                              progress: Number(lesson.progress_percentage ?? lesson.progress ?? 0),
                              total: 100,
                              complete: String(lesson.status ?? '').toLowerCase() === 'completed' || Boolean(lesson.complete ?? lesson.completed),
                              status: typeof lesson.status === 'string' ? lesson.status : undefined,
                              timeSpentMinutes: Number(lesson.time_spent_minutes ?? 0),
                          }))
                        : [],
                });
            } catch (err) {
                if (cancelled) return;
                setError(err instanceof Error ? err.message : 'Failed to load subject detail');
                setDetail(subject);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadDetail();

        return () => {
            cancelled = true;
        };
    }, [subject]);

    const hasActivity = detail.conceptList.length > 0 || detail.lessons.length > 0;

    return (
        <div className="max-w-[820px]">
            <button onClick={onBack} className="group mb-8 flex items-center gap-2 cursor-pointer bg-transparent border-none p-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18L9 12L15 6" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[20px] font-bold text-indigo transition-colors group-hover:text-[#2C2F52]">{subject.name}</span>
            </button>

            {loading ? (
                <div className="flex h-[calc(100vh-240px)] items-center justify-center">
                    <p className="text-[14px] font-medium text-graphite/60">Loading subject detail...</p>
                </div>
            ) : error ? (
                <div className="flex h-[calc(100vh-240px)] flex-col items-center justify-center gap-3">
                    <p className="text-[14px] font-medium text-[#C0392B]">{error}</p>
                    <button
                        type="button"
                        onClick={onBack}
                        className="rounded-full border border-indigo px-5 py-2 text-[13px] font-semibold text-indigo"
                    >
                        Back
                    </button>
                </div>
            ) : !hasActivity ? (
                <div className="flex h-[calc(100vh-240px)] flex-col items-center justify-center">
                    <div className="mb-5 flex h-[110px] w-[140px] items-center justify-center rounded-2xl bg-[#EEECEA]">
                        <svg width="60" height="50" viewBox="0 0 60 50" fill="none">
                            <rect x="10" y="5" width="22" height="28" rx="3" stroke="#3B3F6E" strokeWidth="1.5" />
                            <rect x="15" y="2" width="12" height="6" rx="2" fill="#EEECEA" stroke="#3B3F6E" strokeWidth="1.2" />
                            <line x1="15" y1="15" x2="27" y2="15" stroke="#A9A5D1" strokeWidth="1.2" strokeLinecap="round" />
                            <line x1="15" y1="20" x2="24" y2="20" stroke="#A9A5D1" strokeWidth="1.2" strokeLinecap="round" />
                            <line x1="15" y1="25" x2="27" y2="25" stroke="#A9A5D1" strokeWidth="1.2" strokeLinecap="round" />
                            <circle cx="42" cy="22" r="10" stroke="#3B3F6E" strokeWidth="1.5" />
                            <circle cx="42" cy="22" r="3" stroke="#3B3F6E" strokeWidth="1.2" />
                        </svg>
                    </div>
                    <p className="text-[14px] font-medium text-graphite/60">No activity in this subject yet.</p>
                </div>
            ) : (
                <>
                    <div className="mb-10 grid grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-[#E9E7E2] bg-transparent px-6 py-5">
                            <div className="mb-1 text-[36px] font-bold leading-tight text-indigo">{detail.conceptsAttempted}</div>
                            <div className="text-[13px] font-medium text-graphite/60">Concepts attempted</div>
                        </div>
                        <div className="rounded-2xl border border-[#E9E7E2] bg-transparent px-6 py-5">
                            <div className="mb-1 text-[36px] font-bold leading-tight text-indigo">{detail.conceptsUnderstood}</div>
                            <div className="text-[13px] font-medium text-graphite/60">Concepts understood</div>
                        </div>
                    </div>

                    {detail.conceptList.length > 0 ? (
                        <section className="mb-10">
                            <h3 className="mb-5 text-[12px] font-bold uppercase tracking-[0.08em] text-indigo">Concepts</h3>
                            <div className="flex flex-col">
                                {detail.conceptList.map((concept) => (
                                    <div key={concept.name} className="flex items-center justify-between border-b border-[#F0EDE7] py-4 last:border-b-0">
                                        <span className="text-[14px] font-medium text-black">{concept.name}</span>
                                        <div className="flex items-center gap-3">
                                            {concept.status ? (
                                                <span className="text-[12px] leading-4 capitalize text-graphite/55">
                                                    {concept.status.replace(/_/g, ' ')}
                                                </span>
                                            ) : null}
                                            {concept.understood ? (
                                                <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#4CAF50]">
                                                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                                                        <path d="M3 7L6 10L11 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                            ) : (
                                                <div className="h-[22px] w-[22px] rounded-full border-2 border-[#D5D3CE]" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {detail.lessons.length > 0 ? (
                        <section>
                            <h3 className="mb-5 text-[12px] font-bold uppercase tracking-[0.08em] text-indigo">Lessons</h3>
                            <div className="flex flex-col gap-4">
                                {detail.lessons.map((lesson) => {
                                    const pct = Math.max(0, Math.min(100, lesson.progress));
                                    return (
                                        <div key={lesson.name} className="rounded-2xl border border-[#E9E7E2] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                                            <div className="mb-2 flex items-center gap-3">
                                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="shrink-0 opacity-50">
                                                    <rect x="3" y="2" width="14" height="16" rx="2" stroke="#3B3F6E" strokeWidth="1.5" />
                                                    <line x1="7" y1="6" x2="13" y2="6" stroke="#3B3F6E" strokeWidth="1" strokeLinecap="round" />
                                                    <line x1="7" y1="10" x2="13" y2="10" stroke="#3B3F6E" strokeWidth="1" strokeLinecap="round" />
                                                </svg>
                                                <span className="flex-1 text-[14px] font-semibold text-black">{lesson.name}</span>
                                                <div className="shrink-0 text-right">
                                                    <span className="block text-[12px] font-medium text-graphite/60">
                                                        {lesson.complete
                                                            ? 'Complete'
                                                            : lesson.status
                                                              ? lesson.status.replace(/_/g, ' ')
                                                              : `${Math.round(pct)}%`}
                                                    </span>
                                                    {lesson.timeSpentMinutes ? (
                                                        <span className="block text-[11px] leading-4 text-graphite/45">
                                                            {lesson.timeSpentMinutes} min
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <div className="h-[5px] w-full rounded-full bg-[#E9E7E2] overflow-hidden">
                                                <div className="h-full rounded-full bg-indigo" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ) : null}
                </>
            )}
        </div>
    );
}
