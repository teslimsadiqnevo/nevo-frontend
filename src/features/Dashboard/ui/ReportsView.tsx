'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useAuthGuard } from '@/shared/lib';
import {
    getSchoolBoardSharePreview,
    getSchoolTermReportExport,
    getSchoolTermSummary,
} from '../api/school';
import { DashboardViewSkeleton } from './DashboardSkeletons';

type ReportState = {
    loading: boolean;
    exporting: boolean;
    error: string | null;
    warning: string | null;
    termSummary: SchoolTermSummary | null;
    boardPreview: SchoolBoardPreview | null;
};

type SchoolTermSummary = {
    school_id?: string;
    school_name?: string;
    term_start_date?: string;
    term_end_date?: string;
    active_weeks?: number;
    students_used_nevo_this_term?: number;
    enrolled_students?: number;
    concepts_covered_this_term?: number;
    subject_breakdown?: SubjectBreakdown[];
    teachers_uploaded_this_term?: number;
    total_classes?: number;
    teacher_avatars?: TeacherAvatar[];
    additional_teacher_count?: number;
    whats_working_well?: string[];
    where_support_is_needed?: string[];
    show_empty_state?: boolean;
    empty_state?: {
        title?: string;
        description?: string;
        primary_action_label?: string;
        secondary_action_label?: string;
    } | null;
};

type SchoolBoardPreview = {
    title?: string;
    summary?: string;
    highlights?: string[];
    call_to_action?: string;
    generated_at?: string;
};

type SubjectBreakdown = {
    subject_name?: string;
    concept_count?: number;
    progress_percentage?: number;
};

type TeacherAvatar = {
    teacher_id?: string;
    teacher_name?: string;
    avatar_url?: string | null;
};

export function ReportsView() {
    const guardAuth = useAuthGuard('school');
    const [state, setState] = useState<ReportState>({
        loading: true,
        exporting: false,
        error: null,
        warning: null,
        termSummary: null,
        boardPreview: null,
    });

    useEffect(() => {
        let mounted = true;

        void (async () => {
            setState((current) => ({ ...current, loading: true, error: null, warning: null }));

            const [termRes, previewRes] = await Promise.all([
                getSchoolTermSummary(),
                getSchoolBoardSharePreview(),
            ]);

            if (!mounted) return;
            if (guardAuth([termRes, previewRes])) return;

            const termSummary = ('data' in termRes ? termRes.data : null) as SchoolTermSummary | null;
            const boardPreview = ('data' in previewRes ? previewRes.data : null) as SchoolBoardPreview | null;
            const termError = 'error' in termRes ? termRes.error : null;
            const previewError = 'error' in previewRes ? previewRes.error : null;
            const termMissing = isMissingEndpointError(termError);
            const previewMissing = isMissingEndpointError(previewError);
            const error =
                (termError && !termMissing && !termSummary ? termError : null) ||
                (previewError && !previewMissing && !termSummary ? previewError : null) ||
                null;
            const warning =
                !error && (termError || previewError)
                    ? 'Some report sections are unavailable from the backend right now. Showing the data we could fetch.'
                    : null;

            setState({
                loading: false,
                exporting: false,
                error,
                warning,
                termSummary,
                boardPreview,
            });
        })();

        return () => {
            mounted = false;
        };
    }, [guardAuth]);

    const termSummary = state.termSummary;
    const boardPreview = state.boardPreview;
    const subjectRows = useMemo(
        () => normalizeSubjectRows(termSummary?.subject_breakdown),
        [termSummary?.subject_breakdown],
    );
    const termRange = formatDateRange(termSummary?.term_start_date, termSummary?.term_end_date);
    const activeLearnerPercentage = getPercentage(
        termSummary?.students_used_nevo_this_term,
        termSummary?.enrolled_students,
    );

    const handleExport = async () => {
        setState((current) => ({ ...current, exporting: true, warning: null }));

        const res = await getSchoolTermReportExport({
            startDate: termSummary?.term_start_date,
            endDate: termSummary?.term_end_date,
        });

        if (guardAuth(res)) return;

        if ('error' in res && res.error) {
            setState((current) => ({
                ...current,
                exporting: false,
                warning: res.error,
            }));
            return;
        }

        const exportPayload = 'data' in res ? res.data : null;
        downloadReportPayload(exportPayload);
        setState((current) => ({ ...current, exporting: false }));
    };

    if (state.loading) return <DashboardViewSkeleton titleWidth="w-36" cardCount={4} rowCount={4} />;

    if (state.error) {
        return (
            <div className="mx-auto flex w-full max-w-[1136px] flex-col gap-3 rounded-[12px] border border-[#E0D9CE] bg-white px-6 py-8 text-center">
                <h1 className="text-[22px] font-bold text-[#3B3F6E]">Reports</h1>
                <p className="text-[14px] text-[#2B2B2F]/60">{state.error}</p>
            </div>
        );
    }

    if (termSummary?.show_empty_state) {
        return (
            <div className="mx-auto flex w-full max-w-[760px] flex-col items-center justify-center rounded-[16px] border border-[#E0D9CE] bg-white px-8 py-16 text-center">
                <div className="h-16 w-16 rounded-[18px] bg-[#9A9CCB]/20" />
                <h1 className="mt-6 text-[22px] font-bold text-[#3B3F6E]">
                    {termSummary.empty_state?.title || 'No report data yet'}
                </h1>
                <p className="mt-3 max-w-[460px] text-[15px] leading-6 text-[#2B2B2F]/60">
                    {termSummary.empty_state?.description ||
                        'Reports will appear once students and teachers start using Nevo this term.'}
                </p>
            </div>
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-[1136px] flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-[22px] font-bold leading-[33px] text-[#3B3F6E]">Reports</h1>
                    <p className="mt-1 text-[14px] text-[#2B2B2F]/55">
                        {termSummary?.school_name ? `${termSummary.school_name} - ` : ''}
                        {termRange}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex h-[40px] items-center gap-2 rounded-[12px] border border-[#3B3F6E] bg-white px-4 text-[14px] font-medium text-[#3B3F6E]">
                        <CalendarIcon />
                        <span>{termSummary?.active_weeks || 0} active weeks</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => void handleExport()}
                        disabled={state.exporting || !termSummary}
                        className="flex h-[40px] items-center gap-2 rounded-[12px] border border-[#3B3F6E] bg-white px-4 text-[14px] font-medium text-[#3B3F6E] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                        <ExportIcon />
                        <span>{state.exporting ? 'Exporting...' : 'Export report'}</span>
                    </button>
                </div>
            </div>

            {state.warning ? (
                <div className="rounded-[12px] border border-[#E0D9CE] bg-white px-4 py-3 text-[12px] text-[#2B2B2F]/55">
                    {state.warning}
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    label="Students used Nevo"
                    value={`${formatNumber(termSummary?.students_used_nevo_this_term)} / ${formatNumber(termSummary?.enrolled_students)}`}
                    helper={`${Math.round(activeLearnerPercentage)}% of enrolled students`}
                />
                <MetricCard
                    label="Concepts covered"
                    value={formatNumber(termSummary?.concepts_covered_this_term)}
                    helper="This term"
                />
                <MetricCard
                    label="Teachers uploaded"
                    value={formatNumber(termSummary?.teachers_uploaded_this_term)}
                    helper="Uploaded at least one lesson"
                />
                <MetricCard
                    label="Classes tracked"
                    value={formatNumber(termSummary?.total_classes)}
                    helper="Active school classes"
                />
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                <ReportCard title="Subject coverage">
                    {subjectRows.length > 0 ? (
                        <div className="flex flex-col gap-4">
                            {subjectRows.map((row) => (
                                <div
                                    key={row.subject_name}
                                    className="grid grid-cols-1 gap-2 md:grid-cols-[150px_minmax(0,1fr)_90px] md:items-center md:gap-4"
                                >
                                    <span className="text-[13px] font-medium leading-5 text-[#2B2B2F]">
                                        {row.subject_name}
                                    </span>
                                    <div className="h-[8px] overflow-hidden rounded-full bg-[#F7F1E6]">
                                        <div
                                            className="h-full rounded-full bg-[#3B3F6E]"
                                            style={{ width: `${row.progress_percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-[12px] leading-4 text-[#2B2B2F]/55">
                                        {row.concept_count} concepts
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <CardEmptyState label="No subject coverage has been recorded for this term." />
                    )}
                </ReportCard>

                <ReportCard title="Teacher activity">
                    <div className="flex flex-col gap-5">
                        <div>
                            <p className="text-[34px] font-bold leading-[44px] text-[#3B3F6E]">
                                {formatNumber(termSummary?.teachers_uploaded_this_term)}
                            </p>
                            <p className="text-[13px] leading-5 text-[#2B2B2F]/55">
                                teachers uploaded lessons this term
                            </p>
                        </div>
                        <TeacherAvatarStack
                            teachers={termSummary?.teacher_avatars || []}
                            additionalCount={termSummary?.additional_teacher_count || 0}
                        />
                    </div>
                </ReportCard>

                <ReportCard title="What's working well">
                    <BulletList
                        items={termSummary?.whats_working_well || []}
                        emptyLabel="The backend has not reported strengths for this term yet."
                    />
                </ReportCard>

                <ReportCard title="Where support is needed">
                    <BulletList
                        items={termSummary?.where_support_is_needed || []}
                        emptyLabel="The backend has not reported support needs for this term yet."
                    />
                </ReportCard>
            </div>

            <ReportCard title={boardPreview?.title || 'Board share preview'}>
                {boardPreview ? (
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
                        <div>
                            <p className="text-[15px] leading-6 text-[#2B2B2F]/70">{boardPreview.summary}</p>
                            {boardPreview.call_to_action ? (
                                <p className="mt-4 rounded-[12px] bg-[#F7F1E6] px-4 py-3 text-[13px] font-medium leading-5 text-[#3B3F6E]">
                                    {boardPreview.call_to_action}
                                </p>
                            ) : null}
                        </div>
                        <BulletList
                            items={boardPreview.highlights || []}
                            emptyLabel="No share highlights are available yet."
                        />
                    </div>
                ) : (
                    <CardEmptyState label="Board share preview is not available yet." />
                )}
            </ReportCard>
        </div>
    );
}

function ReportCard({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-[12px] border border-[#E0D9CE] bg-white px-6 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <h2 className="text-[16px] font-semibold leading-6 text-[#3B3F6E]">{title}</h2>
            <div className="mt-4">{children}</div>
        </section>
    );
}

function MetricCard({
    label,
    value,
    helper,
}: {
    label: string;
    value: string;
    helper: string;
}) {
    return (
        <div className="rounded-[12px] border border-[#E0D9CE] bg-white px-5 py-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#3B3F6E]/55">{label}</p>
            <p className="mt-3 text-[28px] font-bold leading-[36px] text-[#3B3F6E]">{value}</p>
            <p className="mt-1 text-[12px] leading-4 text-[#2B2B2F]/50">{helper}</p>
        </div>
    );
}

function CardEmptyState({ label }: { label: string }) {
    return (
        <div className="flex min-h-[120px] flex-col items-center justify-center gap-4 rounded-[12px] bg-[#F7F1E6] px-4 py-6">
            <div className="h-12 w-12 rounded-[12px] bg-[#9A9CCB]/18" />
            <p className="text-center text-[14px] leading-5 text-[#2B2B2F]/55">{label}</p>
        </div>
    );
}

function BulletList({
    items,
    emptyLabel,
}: {
    items: string[];
    emptyLabel: string;
}) {
    if (items.length === 0) {
        return <CardEmptyState label={emptyLabel} />;
    }

    return (
        <ul className="flex flex-col gap-3">
            {items.map((item, index) => (
                <li key={`${item}-${index}`} className="flex gap-3 text-[14px] leading-6 text-[#2B2B2F]/70">
                    <span className="mt-[9px] h-2 w-2 shrink-0 rounded-full bg-[#3B3F6E]" />
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

function TeacherAvatarStack({
    teachers,
    additionalCount,
}: {
    teachers: TeacherAvatar[];
    additionalCount: number;
}) {
    if (teachers.length === 0 && additionalCount === 0) {
        return <p className="text-[13px] leading-5 text-[#2B2B2F]/55">No teacher upload activity recorded yet.</p>;
    }

    return (
        <div className="flex items-center">
            {teachers.slice(0, 5).map((teacher, index) => (
                <div
                    key={teacher.teacher_id || `${teacher.teacher_name}-${index}`}
                    className="-ml-2 flex h-10 w-10 first:ml-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#9A9CCB]/25 text-[12px] font-bold text-[#3B3F6E]"
                    title={teacher.teacher_name}
                >
                    {teacher.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={teacher.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                        getInitials(teacher.teacher_name || 'Teacher')
                    )}
                </div>
            ))}
            {additionalCount > 0 ? (
                <div className="-ml-2 flex h-10 min-w-10 items-center justify-center rounded-full border-2 border-white bg-[#3B3F6E] px-3 text-[12px] font-bold text-white">
                    +{additionalCount}
                </div>
            ) : null}
        </div>
    );
}

function normalizeSubjectRows(rows?: SubjectBreakdown[]) {
    if (!Array.isArray(rows)) return [];

    return rows
        .map((row) => ({
            subject_name: row.subject_name || 'Subject',
            concept_count: Number(row.concept_count || 0),
            progress_percentage: clampPercentage(Number(row.progress_percentage || 0)),
        }))
        .filter((row) => row.concept_count > 0 || row.progress_percentage > 0)
        .slice(0, 8);
}

function getPercentage(value?: number, total?: number) {
    const numerator = Number(value || 0);
    const denominator = Number(total || 0);
    if (denominator <= 0) return 0;
    return clampPercentage((numerator / denominator) * 100);
}

function clampPercentage(value: number) {
    if (Number.isNaN(value)) return 0;
    return Math.max(0, Math.min(value, 100));
}

function formatNumber(value?: number) {
    return Number(value || 0).toLocaleString('en-NG');
}

function formatDateRange(start?: string, end?: string) {
    if (!start && !end) return 'Most recent reporting window';
    if (!start) return `Until ${formatDate(end)}`;
    if (!end) return `From ${formatDate(start)}`;
    return `${formatDate(start)} - ${formatDate(end)}`;
}

function formatDate(value?: string) {
    if (!value) return 'now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-NG', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function getInitials(name: string) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'T';
}

function downloadReportPayload(payload: any) {
    if (typeof window === 'undefined' || !payload) return;

    const filename = String(payload.filename || 'school-term-report.json').replace(/\.pdf$/i, '.json');
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function CalendarIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2.667 4.667H13.333V12.667H2.667V4.667Z" stroke="#3B3F6E" strokeWidth="1.2" />
            <path d="M5 2.667V5" stroke="#3B3F6E" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M11 2.667V5" stroke="#3B3F6E" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M2.667 7.333H13.333" stroke="#3B3F6E" strokeWidth="1.2" />
        </svg>
    );
}

function ExportIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M5.333 6.667V12.667H10.667V6.667" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 3.333V9.333" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M5.667 6L8 3.667L10.333 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function isMissingEndpointError(error: string | null | undefined) {
    return Boolean(error && /not found/i.test(error));
}
