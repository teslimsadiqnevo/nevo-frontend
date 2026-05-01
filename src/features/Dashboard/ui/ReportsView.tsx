'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSchoolBoardSharePreview, getSchoolTermSummary } from '../api/school';

export function ReportsView() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [termSummary, setTermSummary] = useState<any | null>(null);
    const [boardPreview, setBoardPreview] = useState<any | null>(null);

    useEffect(() => {
        let mounted = true;

        void (async () => {
            const [termRes, previewRes] = await Promise.all([
                getSchoolTermSummary(),
                getSchoolBoardSharePreview(),
            ]);

            if (!mounted) return;

            const nextError =
                ('error' in termRes && termRes.error) ||
                ('error' in previewRes && previewRes.error) ||
                null;

            if (nextError) {
                setError(nextError);
                setLoading(false);
                return;
            }

            setTermSummary('data' in termRes ? termRes.data : null);
            setBoardPreview('data' in previewRes ? previewRes.data : null);
            setLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, []);

    const subjectBreakdown = useMemo(
        () => (Array.isArray(termSummary?.subject_breakdown) ? termSummary.subject_breakdown : []),
        [termSummary],
    );

    const teacherAvatars = useMemo(
        () => (Array.isArray(termSummary?.teacher_avatars) ? termSummary.teacher_avatars : []),
        [termSummary],
    );

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center text-[14px] text-graphite-60">
                Loading reports...
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-[#E0D9CE] bg-white px-6 py-8 text-center">
                <p className="text-[16px] font-semibold text-[#3B3F6E] mb-2">Couldn’t load reports.</p>
                <p className="text-[13px] text-graphite-60">{error}</p>
            </div>
        );
    }

    if (termSummary?.show_empty_state) {
        return (
            <div className="w-full flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
                <div className="w-[240px] h-[200px] rounded-[32px] bg-[#EAE8F2] flex items-center justify-center mb-8">
                    <div className="w-[90px] h-[90px] rounded-full bg-white/70 flex items-center justify-center">
                        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#3B3F6E" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20V10" />
                            <path d="M18 20V4" />
                            <path d="M6 20V14" />
                        </svg>
                    </div>
                </div>
                <h1 className="text-[28px] font-bold text-[#3B3F6E] tracking-tight mb-3">
                    {termSummary?.empty_state?.title || 'Reports will appear once activity begins.'}
                </h1>
                <p className="text-[15px] text-graphite-60 max-w-[480px] mb-8">
                    {termSummary?.empty_state?.description || 'Invite teachers and start classes to unlock reporting.'}
                </p>
                <div className="flex items-center gap-3">
                    <button className="px-5 py-3 bg-[#3B3F6E] text-white rounded-xl text-[14px] font-semibold cursor-default">
                        {termSummary?.empty_state?.primary_action_label || 'Invite teachers'}
                    </button>
                    <button className="px-5 py-3 border border-[#3B3F6E] text-[#3B3F6E] rounded-xl text-[14px] font-semibold cursor-default">
                        {termSummary?.empty_state?.secondary_action_label || 'Set up classes'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-[22px] font-bold text-[#3B3F6E] tracking-tight">Reports</h1>
                <p className="text-[13px] text-graphite-60">
                    Term window: {formatDate(termSummary?.term_start_date)} to {formatDate(termSummary?.term_end_date)}
                </p>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <StatCard number={String(termSummary?.students_used_nevo_this_term ?? 0)} label="Students used Nevo this term" />
                <StatCard number={String(termSummary?.concepts_covered_this_term ?? 0)} label="Concepts covered this term" />
                <StatCard number={String(termSummary?.teachers_uploaded_this_term ?? 0)} label="Teachers uploaded this term" />
                <StatCard number={String(termSummary?.active_weeks ?? 0)} label="Active weeks in this term" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <h2 className="text-[14px] font-bold text-[#3B3F6E] mb-5 tracking-tight">Subject coverage</h2>
                    <div className="flex flex-col gap-4">
                        {subjectBreakdown.map((subject: any) => (
                            <div key={subject.subject_name} className="flex items-center gap-3">
                                <span className="text-[12px] font-medium text-[#3B3F6E] w-[140px] shrink-0">{subject.subject_name}</span>
                                <div className="flex-1 h-[8px] bg-[#EAE8F2] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#3B3F6E] rounded-full"
                                        style={{ width: `${Math.min(Number(subject.progress_percentage || 0), 100)}%` }}
                                    />
                                </div>
                                <span className="text-[11px] text-graphite-40 shrink-0 w-[95px] text-right">
                                    {subject.concept_count} concepts
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <h2 className="text-[14px] font-bold text-[#3B3F6E] mb-5 tracking-tight">Teacher upload momentum</h2>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex -space-x-2">
                            {teacherAvatars.slice(0, 4).map((teacher: any) => (
                                <div
                                    key={teacher.teacher_id}
                                    className="w-10 h-10 rounded-full bg-[#EAE8F2] border-2 border-white flex items-center justify-center text-[12px] font-semibold text-[#3B3F6E]"
                                >
                                    {getAvatarText(teacher.teacher_name)}
                                </div>
                            ))}
                        </div>
                        <div className="text-[13px] text-graphite-60">
                            {termSummary?.teachers_uploaded_this_term ?? 0} teachers uploaded this term
                            {Number(termSummary?.additional_teacher_count || 0) > 0
                                ? ` • +${termSummary.additional_teacher_count} more`
                                : ''}
                        </div>
                    </div>
                    <div className="rounded-xl bg-[#F7F1E6] px-4 py-4">
                        <p className="text-[13px] text-[#3B3F6E] font-medium">
                            {termSummary?.enrolled_students ?? 0} enrolled students across {termSummary?.total_classes ?? 0} classes.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <InsightPanel
                    title="What’s working well"
                    items={Array.isArray(termSummary?.whats_working_well) ? termSummary.whats_working_well : []}
                    tone="success"
                />
                <InsightPanel
                    title="Where support is needed"
                    items={Array.isArray(termSummary?.where_support_is_needed) ? termSummary.where_support_is_needed : []}
                    tone="warning"
                />
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex items-start justify-between gap-6 mb-4">
                    <div>
                        <h2 className="text-[14px] font-bold text-[#3B3F6E] tracking-tight">
                            {boardPreview?.title || 'Board share preview'}
                        </h2>
                        <p className="text-[12px] text-graphite-40 mt-1">
                            Generated {formatDateTime(boardPreview?.generated_at)}
                        </p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-[#EAE8F2] text-[11px] font-semibold text-[#3B3F6E]">
                        Preview
                    </div>
                </div>
                <p className="text-[14px] text-[#2B2B2F] leading-6 mb-5">
                    {boardPreview?.summary || 'No board summary available yet.'}
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-[12px] font-semibold text-[#3B3F6E] mb-3">Highlights</h3>
                        <div className="flex flex-col gap-2">
                            {(Array.isArray(boardPreview?.highlights) ? boardPreview.highlights : []).map((item: string) => (
                                <div key={item} className="flex items-start gap-2 text-[13px] text-graphite-60">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#3B3F6E] mt-2 shrink-0" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-xl bg-[#F7F1E6] px-4 py-4">
                        <h3 className="text-[12px] font-semibold text-[#3B3F6E] mb-2">Suggested call to action</h3>
                        <p className="text-[13px] text-graphite-60">{boardPreview?.call_to_action || 'No call to action yet.'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ number, label }: { number: string; label: string }) {
    return (
        <div className="bg-white rounded-2xl px-6 py-6 border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col gap-1">
            <span className="text-[32px] font-bold text-[#3B3F6E] tracking-tight">{number}</span>
            <span className="text-[13px] text-graphite-60 font-medium leading-snug">{label}</span>
        </div>
    );
}

function InsightPanel({
    title,
    items,
    tone,
}: {
    title: string;
    items: string[];
    tone: 'success' | 'warning';
}) {
    return (
        <div className="bg-white rounded-2xl p-6 border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <h2 className="text-[14px] font-bold text-[#3B3F6E] mb-5 tracking-tight">{title}</h2>
            <div className="flex flex-col gap-3">
                {items.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${tone === 'success' ? 'bg-[#7AB87A]' : 'bg-[#E8A84A]'}`} />
                        <span className="text-[13px] text-graphite-60">{item}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function getAvatarText(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('') || 'T';
}

function formatDate(value?: string) {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(value?: string) {
    if (!value) return 'recently';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('en-NG', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}
