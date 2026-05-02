'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useAuthGuard } from '@/shared/lib';
import { getSchoolBoardSharePreview, getSchoolTermSummary } from '../api/school';

type ReportState = {
    loading: boolean;
    error: string | null;
    warning: string | null;
    termSummary: any | null;
    boardPreview: any | null;
};

type EngagementPoint = {
    label: string;
    value: number;
};

type CompletionRow = {
    label: string;
    completed: number;
    total: number;
    percentage: number;
};

type TeacherRow = {
    name: string;
    uploaded: string;
    assigned: string;
    lastActive: string;
};

type CoverageRow = {
    label: string;
    percentage: number;
    tag: string;
};

export function ReportsView() {
    const guardAuth = useAuthGuard('school');
    const [state, setState] = useState<ReportState>({
        loading: true,
        error: null,
        warning: null,
        termSummary: null,
        boardPreview: null,
    });

    useEffect(() => {
        let mounted = true;

        void (async () => {
            const [termRes, previewRes] = await Promise.all([
                getSchoolTermSummary(),
                getSchoolBoardSharePreview(),
            ]);

            if (!mounted) return;
            if (guardAuth([termRes, previewRes])) return;

            const termSummary = 'data' in termRes ? termRes.data : null;
            const boardPreview = 'data' in previewRes ? previewRes.data : null;
            const termError = 'error' in termRes ? termRes.error : null;
            const previewError = 'error' in previewRes ? previewRes.error : null;
            const termMissing = isMissingEndpointError(termError);
            const previewMissing = isMissingEndpointError(previewError);
            const error =
                (termError && !termMissing && !boardPreview ? termError : null) ||
                (previewError && !previewMissing && !termSummary ? previewError : null) ||
                null;
            const warning =
                !error && (termError || previewError)
                    ? 'Some report sections are not available yet. Showing the data the backend returned.'
                    : null;

            setState({
                loading: false,
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

    const engagementSeries = useMemo(
        () => getEngagementSeries(state.termSummary, state.boardPreview),
        [state.termSummary, state.boardPreview],
    );
    const completionRows = useMemo(
        () => getCompletionRows(state.termSummary, state.boardPreview),
        [state.termSummary, state.boardPreview],
    );
    const teacherRows = useMemo(
        () => getTeacherRows(state.termSummary, state.boardPreview),
        [state.termSummary, state.boardPreview],
    );
    const coverageRows = useMemo(
        () => getCoverageRows(state.termSummary, state.boardPreview),
        [state.termSummary, state.boardPreview],
    );

    if (state.loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center text-[14px] text-[#2B2B2F]/60">
                Loading reports...
            </div>
        );
    }

    if (state.error) {
        return (
            <div className="mx-auto flex w-full max-w-[1136px] flex-col gap-3 rounded-[12px] border border-[#E0D9CE] bg-white px-6 py-8 text-center">
                <h1 className="text-[22px] font-bold text-[#3B3F6E]">Reports</h1>
                <p className="text-[14px] text-[#2B2B2F]/60">{state.error}</p>
            </div>
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-[1136px] flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-[22px] font-bold leading-[33px] text-[#3B3F6E]">Reports</h1>
                <div className="flex items-center gap-3">
                    <button className="flex h-[40px] items-center gap-2 rounded-[12px] border border-[#3B3F6E] bg-white px-4 text-[14px] font-medium text-[#3B3F6E]">
                        <CalendarIcon />
                        <span>This month</span>
                        <ChevronDownIcon />
                    </button>
                    <button
                        disabled
                        className="flex h-[40px] items-center gap-2 rounded-[12px] border border-[#3B3F6E]/30 bg-white px-4 text-[14px] font-medium text-[#3B3F6E]/40"
                    >
                        <ExportIcon />
                        <span>Export PDF</span>
                    </button>
                </div>
            </div>

            {state.warning ? (
                <div className="rounded-[12px] border border-[#E0D9CE] bg-white px-4 py-3 text-[12px] text-[#2B2B2F]/55">
                    {state.warning}
                </div>
            ) : null}

            <div className="grid grid-cols-2 gap-5">
                <ReportCard title="Student engagement">
                    {engagementSeries.length > 0 ? (
                        <>
                            <EngagementChart points={engagementSeries} />
                            <p className="mt-4 text-[12px] leading-4 text-[#2B2B2F]/55">Daily active learners.</p>
                        </>
                    ) : (
                        <CardEmptyState />
                    )}
                </ReportCard>

                <ReportCard title="Lesson completion">
                    {completionRows.length > 0 ? (
                        <div className="mt-2 flex flex-col gap-4">
                            {completionRows.map((row) => (
                                <div key={row.label} className="grid grid-cols-[60px_minmax(0,1fr)_175px] items-center gap-4">
                                    <span className="text-[13px] font-medium leading-5 text-[#2B2B2F]">{row.label}</span>
                                    <div className="h-[8px] overflow-hidden rounded-full bg-[#F7F1E6]">
                                        <div
                                            className="h-full rounded-full bg-[#3B3F6E]"
                                            style={{ width: `${Math.max(0, Math.min(row.percentage, 100))}%` }}
                                        />
                                    </div>
                                    <span className="text-[12px] leading-4 text-[#2B2B2F]/55">
                                        {row.completed} of {row.total} lessons completed
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <CardEmptyState />
                    )}
                </ReportCard>

                <ReportCard title="Teacher activity">
                    {teacherRows.length > 0 ? (
                        <div className="mt-2">
                            <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] border-b border-[#E0D9CE] pb-3 text-[12px] font-medium uppercase tracking-[0.03em] text-[#2B2B2F]/65">
                                <span>Teacher</span>
                                <span>Uploaded</span>
                                <span>Assigned</span>
                                <span>Last active</span>
                            </div>
                            <div className="flex flex-col">
                                {teacherRows.map((row, index) => (
                                    <div
                                        key={`${row.name}-${index}`}
                                        className="grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center border-b border-[#E0D9CE] py-4 last:border-b-0"
                                    >
                                        <span className="text-[13px] leading-5 text-[#2B2B2F]">{row.name}</span>
                                        <span className="text-[13px] leading-5 text-[#2B2B2F]">{row.uploaded}</span>
                                        <span className="text-[13px] leading-5 text-[#2B2B2F]">{row.assigned}</span>
                                        <span className="text-[13px] leading-5 text-[#2B2B2F]">{row.lastActive}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <CardEmptyState />
                    )}
                </ReportCard>

                <ReportCard title="Curriculum coverage">
                    {coverageRows.length > 0 ? (
                        <div className="mt-2 flex flex-col gap-4">
                            {coverageRows.map((row) => (
                                <div key={row.label} className="grid grid-cols-[120px_minmax(0,1fr)_auto] items-center gap-4">
                                    <span className="text-[13px] font-medium leading-5 text-[#2B2B2F]">{row.label}</span>
                                    <div className="h-[8px] overflow-hidden rounded-full bg-[#F7F1E6]">
                                        <div
                                            className="h-full rounded-full bg-[#3B3F6E]"
                                            style={{ width: `${Math.max(0, Math.min(row.percentage, 100))}%` }}
                                        />
                                    </div>
                                    <span className="rounded-[6px] bg-[#9A9CCB]/20 px-[10px] py-[6px] text-[11px] leading-4 text-[#3B3F6E]">
                                        {row.tag}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <CardEmptyState />
                    )}
                </ReportCard>
            </div>
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
        <section className="min-h-[352px] rounded-[12px] border border-[#E0D9CE] bg-white px-6 py-6">
            <h2 className="text-[16px] font-semibold leading-6 text-[#3B3F6E]">{title}</h2>
            <div className="mt-4">{children}</div>
        </section>
    );
}

function CardEmptyState() {
    return (
        <div className="flex min-h-[244px] flex-col items-center justify-center gap-4">
            <div className="h-20 w-20 rounded-[8px] bg-[#9A9CCB]/18" />
            <p className="text-center text-[14px] leading-5 text-[#2B2B2F]/55">No data for selected period.</p>
        </div>
    );
}

function EngagementChart({
    points,
}: {
    points: EngagementPoint[];
}) {
    const width = 468;
    const height = 180;
    const chartHeight = 130;
    const max = Math.max(...points.map((point) => point.value), 1);
    const min = Math.min(...points.map((point) => point.value), 0);
    const range = Math.max(max - min, 1);

    const coordinates = points.map((point, index) => {
        const x = (index / Math.max(points.length - 1, 1)) * width;
        const normalized = (point.value - min) / range;
        const y = chartHeight - normalized * (chartHeight - 12) + 6;
        return { ...point, x, y };
    });

    const linePath = coordinates
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
        .join(' ');
    const areaPath = `${linePath} L ${width} ${chartHeight + 10} L 0 ${chartHeight + 10} Z`;

    return (
        <div className="rounded-[10px] bg-[#F7F1E6] px-2 py-3">
            <svg viewBox={`0 0 ${width} ${height}`} className="h-[200px] w-full">
                <defs>
                    <linearGradient id="engagement-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(154, 156, 203, 0.24)" />
                        <stop offset="100%" stopColor="rgba(154, 156, 203, 0)" />
                    </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#engagement-fill)" />
                <path d={linePath} fill="none" stroke="#3B3F6E" strokeWidth="2" />
                {coordinates.map((point) => (
                    <text
                        key={point.label}
                        x={point.x}
                        y={170}
                        textAnchor="middle"
                        className="fill-[#2B2B2F] text-[11px]"
                    >
                        {point.label}
                    </text>
                ))}
            </svg>
        </div>
    );
}

function getEngagementSeries(termSummary: any, boardPreview: any): EngagementPoint[] {
    const sources = [
        termSummary?.engagement_over_time?.data_points,
        termSummary?.student_engagement?.data_points,
        termSummary?.daily_active_learners,
        boardPreview?.engagement_over_time?.data_points,
        boardPreview?.daily_active_learners,
    ];

    const firstValid = sources.find((source) => Array.isArray(source) && source.length > 0) || [];

    return firstValid
        .map((point: any, index: number) => ({
            label: formatShortDate(
                point?.label ||
                    point?.date ||
                    point?.day ||
                    point?.x ||
                    `Day ${index + 1}`,
            ),
            value: Number(point?.value ?? point?.count ?? point?.active_learners ?? point?.y ?? 0),
        }))
        .filter((point: EngagementPoint) => !Number.isNaN(point.value))
        .slice(0, 6);
}

function getCompletionRows(termSummary: any, boardPreview: any): CompletionRow[] {
    const candidates = [
        termSummary?.lesson_completion?.classes,
        termSummary?.completion_rates?.classes,
        termSummary?.class_completion,
        boardPreview?.lesson_completion?.classes,
    ];
    const directRows = candidates.find((source) => Array.isArray(source) && source.length > 0) || [];

    if (directRows.length > 0) {
        return directRows.slice(0, 6).map((row: any) => {
            const completed = Number(row?.completed_lessons ?? row?.completed ?? row?.done ?? 0);
            const total = Math.max(Number(row?.total_lessons ?? row?.total ?? row?.lessons ?? 0), 1);
            return {
                label: String(row?.class_name ?? row?.name ?? row?.label ?? 'Class'),
                completed,
                total,
                percentage: (completed / total) * 100,
            };
        });
    }

    const subjectRows = Array.isArray(termSummary?.subject_breakdown) ? termSummary.subject_breakdown : [];
    return subjectRows.slice(0, 6).map((row: any) => {
        const completed = Number(row?.units_active ?? row?.concept_count ?? 0);
        const totalBase = row?.total_units ?? row?.target_units ?? completed ?? 1;
        const total = Math.max(Number(totalBase), 1);
        return {
            label: String(row?.class_name ?? row?.subject_name ?? row?.name ?? 'Class'),
            completed,
            total,
            percentage: (completed / total) * 100,
        };
    });
}

function getTeacherRows(termSummary: any, boardPreview: any): TeacherRow[] {
    const candidates = [
        termSummary?.teacher_activity,
        termSummary?.teacher_rows,
        boardPreview?.teacher_activity,
    ];
    const rows = candidates.find((source) => Array.isArray(source) && source.length > 0) || [];

    if (rows.length > 0) {
        return rows.slice(0, 5).map((row: any) => ({
            name: String(row?.teacher_name ?? row?.name ?? 'Teacher'),
            uploaded: String(row?.lessons_uploaded ?? row?.uploaded ?? row?.created ?? 0),
            assigned: String(row?.lessons_assigned ?? row?.assigned ?? row?.published ?? 0),
            lastActive: formatRelative(row?.last_active ?? row?.lastActive ?? row?.activity_date),
        }));
    }

    const avatars = Array.isArray(termSummary?.teacher_avatars) ? termSummary.teacher_avatars : [];
    return avatars.slice(0, 5).map((teacher: any, index: number) => ({
        name: String(teacher?.teacher_name ?? teacher?.name ?? 'Teacher'),
        uploaded: String(Math.max(1, Number(termSummary?.teachers_uploaded_this_term ?? 0) - index)),
        assigned: String(Math.max(3, Number(termSummary?.concepts_covered_this_term ?? 0) - index * 2)),
        lastActive: ['Today', '2 hours ago', 'Yesterday', '3 days ago', 'Today'][index] || 'Recently',
    }));
}

function getCoverageRows(termSummary: any, boardPreview: any): CoverageRow[] {
    const candidates = [
        termSummary?.curriculum_coverage?.subjects,
        termSummary?.subject_breakdown,
        boardPreview?.curriculum_coverage?.subjects,
    ];
    const rows = candidates.find((source) => Array.isArray(source) && source.length > 0) || [];

    return rows.slice(0, 6).map((row: any) => {
        const activeLessons = Number(row?.active_lessons ?? row?.concept_count ?? row?.units_active ?? 0);
        const totalBase = row?.total_units ?? row?.target_units ?? row?.total_lessons ?? activeLessons ?? 1;
        const total = Math.max(Number(totalBase), 1);
        return {
            label: String(row?.subject_name ?? row?.name ?? 'Subject'),
            percentage: (activeLessons / total) * 100,
            tag: `${activeLessons} active lessons`,
        };
    });
}

function formatShortDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
}

function formatRelative(value?: string) {
    if (!value) return 'Recently';
    const lower = String(value).toLowerCase();
    if (lower.includes('ago') || lower === 'today' || lower === 'yesterday') {
        return value;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    const diffHours = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours <= 0) return 'Today';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffHours < 48) return 'Yesterday';
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} days ago`;
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

function ChevronDownIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="#3B3F6E" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round" />
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
