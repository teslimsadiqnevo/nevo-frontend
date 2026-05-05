'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useApiTokenExpiryRedirect, useAuthGuard } from '@/shared/lib';
import { SchoolAdminSidebar } from "@/widgets";
import { getSchoolDashboardOverview, getSchoolDashboardSummary, getSchoolSettings } from '../api/school';

const DashboardViewLoader = () => (
    <div className="flex min-h-[40vh] items-center justify-center text-[14px] text-[#2B2B2F]/60">
        Loading...
    </div>
);

const ClassesView = dynamic(() => import('./ClassesView').then((mod) => mod.ClassesView), {
    loading: DashboardViewLoader,
});
const TeachersView = dynamic(() => import('./TeachersView').then((mod) => mod.TeachersView), {
    loading: DashboardViewLoader,
});
const StudentsView = dynamic(() => import('./StudentsView').then((mod) => mod.StudentsView), {
    loading: DashboardViewLoader,
});
const ReportsView = dynamic(() => import('./ReportsView').then((mod) => mod.ReportsView), {
    loading: DashboardViewLoader,
});
const SettingsView = dynamic(() => import('./SettingsView').then((mod) => mod.SettingsView), {
    loading: DashboardViewLoader,
});

type OverviewData = {
    summary: Record<string, unknown> | null;
    overview: Record<string, unknown> | null;
    settings: Record<string, unknown> | null;
};

type DashboardUser = {
    schoolName?: string;
    name?: string;
    full_name?: string;
    email?: string;
} & Record<string, unknown>;

type SubjectCoverageRow = {
    subject_name?: string;
    total_units?: number | string;
    units_active?: number | string;
};

type EngagementPoint = {
    active_students?: number | string;
    date?: string;
    day?: string;
};

type InsightItem = {
    topic?: string;
    topic_id?: string | number;
    topic_name?: string;
    subject?: string;
    name?: string;
    label?: string;
    student_count?: number | string;
    count?: number | string;
    supporting_metric?: string;
};

export function SchoolAdminDashboard({ user }: { user?: DashboardUser }) {
    useApiTokenExpiryRedirect('school');
    const searchParams = useSearchParams();
    const currentView = searchParams?.get('view') || null;

    const renderView = () => {
        switch (currentView) {
            case 'classes':
                return <ClassesView />;
            case 'teachers':
                return <TeachersView />;
            case 'students':
                return <StudentsView />;
            case 'reports':
                return <ReportsView />;
            case 'settings':
                return <SettingsView />;
            default:
                return <AdminDashboardOverview user={user} />;
        }
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#F7F1E6] font-sans">
            <SchoolAdminSidebar user={user} />
            <main className="relative flex-1 overflow-y-auto bg-[#F7F1E6] px-8 py-8">
                {renderView()}
            </main>
        </div>
    );
}

function AdminDashboardOverview({ user }: { user?: DashboardUser }) {
    const guardAuth = useAuthGuard('school');
    const [state, setState] = useState<{
        loading: boolean;
        error: string | null;
        data: OverviewData;
    }>({
        loading: true,
        error: null,
        data: { summary: null, overview: null, settings: null },
    });

    useEffect(() => {
        let mounted = true;

        void (async () => {
            const [summaryRes, overviewRes, settingsRes] = await Promise.all([
                getSchoolDashboardSummary(),
                getSchoolDashboardOverview(),
                getSchoolSettings(),
            ]);

            if (!mounted) return;
            if (guardAuth([summaryRes, overviewRes, settingsRes])) return;

            const summary = 'data' in summaryRes ? summaryRes.data : null;
            const overview = 'data' in overviewRes ? overviewRes.data : null;
            const settings = 'data' in settingsRes ? settingsRes.data : null;
            const summaryError = 'error' in summaryRes ? summaryRes.error : null;
            const overviewError = 'error' in overviewRes ? overviewRes.error : null;
            const settingsError = 'error' in settingsRes ? settingsRes.error : null;
            const error =
                summaryError ||
                (overviewError && !isMissingEndpointError(overviewError) ? overviewError : null) ||
                (!summary && settingsError ? settingsError : null) ||
                null;

            setState({
                loading: false,
                error,
                data: { summary, overview, settings },
            });
        })();

        return () => {
            mounted = false;
        };
    }, [guardAuth]);

    if (state.loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center text-[14px] text-[#2B2B2F]/60">
                Loading school overview...
            </div>
        );
    }

    if (state.error) {
        return (
            <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 text-center">
                <h1 className="text-[22px] font-bold text-[#3B3F6E]">Overview</h1>
                <p className="max-w-[420px] text-[14px] text-[#2B2B2F]/60">{state.error}</p>
            </div>
        );
    }

    const summary = state.data.summary;
    const overview = state.data.overview;
    const settings = state.data.settings;
    const curriculumCoverage = overview?.curriculum_coverage as
        | { subjects?: SubjectCoverageRow[] }
        | undefined;
    const conceptsBuildingWell = overview?.concepts_building_well as
        | { topics?: InsightItem[] }
        | undefined;
    const areasNeedingSupport = overview?.areas_needing_support as
        | { topics?: InsightItem[] }
        | undefined;
    const engagementOverTime = overview?.engagement_over_time as
        | { data_points?: EngagementPoint[] }
        | undefined;

    const schoolName = String(
        settings?.school_name || summary?.school_name || user?.schoolName || 'Your school',
    );
    const dateFilterLabel = String(overview?.date_range_label || 'This week');
    const subjectRows: SubjectCoverageRow[] = Array.isArray(curriculumCoverage?.subjects)
        ? curriculumCoverage.subjects
        : [];
    const strengths: InsightItem[] = Array.isArray(conceptsBuildingWell?.topics)
        ? conceptsBuildingWell.topics
        : [];
    const support: InsightItem[] = Array.isArray(areasNeedingSupport?.topics)
        ? areasNeedingSupport.topics
        : [];
    const engagementPoints: EngagementPoint[] = Array.isArray(engagementOverTime?.data_points)
        ? engagementOverTime.data_points
        : [];

    const statCards = [
        {
            label: 'Active students today',
            value: overview?.active_students_today ?? summary?.active_students_today ?? 0,
            accent: '#7AB87A',
        },
        {
            label: 'Lessons completed this week',
            value: overview?.lessons_completed_this_week ?? 0,
            accent: '#9A9CCB',
        },
        {
            label: 'Teachers active this week',
            value: overview?.active_teachers_this_week ?? summary?.total_teachers ?? 0,
            accent: '#3B3F6E',
        },
        {
            label: 'Topics where understanding is growing',
            value: overview?.topics_unlabeled_and_growing ?? 0,
            accent: '#7AB87A',
        },
    ];

    const showEmptyState =
        overview?.show_empty_state ||
        summary?.show_empty_state ||
        (
            statCards.every((card) => Number(card.value || 0) === 0) &&
            subjectRows.length === 0 &&
            strengths.length === 0 &&
            support.length === 0 &&
            engagementPoints.length === 0
        );

    return (
        <div className="mx-auto flex w-full max-w-[1136px] flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[22px] font-bold leading-[33px] text-[#3B3F6E]">Overview</h1>
                    <p className="mt-1 text-[14px] text-[#2B2B2F]/55">{schoolName}</p>
                </div>
                <button className="flex h-[44px] items-center gap-2 rounded-full border border-[#3B3F6E] px-5 text-[14px] font-medium text-[#3B3F6E]">
                    <span>{dateFilterLabel}</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 6L8 10L12 6" stroke="#3B3F6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            {showEmptyState ? (
                <SchoolOverviewEmptyState />
            ) : (
                <>
                    <div className="grid grid-cols-4 gap-4">
                        {statCards.map((card) => (
                            <StatCard
                                key={card.label}
                                number={String(card.value ?? 0)}
                                label={card.label}
                                accent={card.accent}
                            />
                        ))}
                    </div>

                    <div className="grid grid-cols-5 gap-4">
                        <div className="col-span-3 rounded-[12px] border border-[#E0D9CE] bg-white p-6">
                            <h2 className="text-[15px] font-semibold leading-[22px] text-[#3B3F6E]">
                                Engagement over time
                            </h2>
                            <div className="mt-4">
                                {engagementPoints.length > 0 ? (
                                    <EngagementChart points={engagementPoints} />
                                ) : (
                                    <EmptyPanelText text="No engagement data yet." />
                                )}
                            </div>
                            <p className="mt-3 text-[12px] leading-[18px] text-[#2B2B2F]/55">
                                Daily active learners this week.
                            </p>
                        </div>

                        <div className="col-span-2 rounded-[12px] border border-[#E0D9CE] bg-white p-6">
                            <h2 className="text-[15px] font-semibold leading-[22px] text-[#3B3F6E]">
                                Curriculum coverage
                            </h2>
                            <div className="mt-5 flex flex-col gap-4">
                                {subjectRows.length > 0 ? (
                                    subjectRows.map((subject) => (
                                        <ProgressBar
                                            key={String(subject.subject_name || 'subject')}
                                            label={String(subject.subject_name || 'Subject')}
                                            total={Number(subject.total_units || 0)}
                                            current={Number(subject.units_active || 0)}
                                        />
                                    ))
                                ) : (
                                    <EmptyPanelText text="No curriculum coverage data yet." />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InsightCard
                            title="Concepts building well"
                            items={strengths}
                            accent="#7AB87A"
                            type="success"
                            emptyText="No strong-signal topics yet."
                        />
                        <InsightCard
                            title="Where support may be needed"
                            items={support}
                            accent="#E8A84A"
                            type="warning"
                            emptyText="No risk areas reported yet."
                        />
                    </div>
                </>
            )}
        </div>
    );
}

function SchoolOverviewEmptyState() {
    return (
        <div className="flex min-h-[640px] w-full flex-col items-center justify-center rounded-[12px]">
            <svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 120C0 53.7258 53.7258 0 120 0C186.274 0 240 53.7258 240 120C240 186.274 186.274 240 120 240C53.7258 240 0 186.274 0 120Z" fill="#9A9CCB" fillOpacity="0.2" />
                <g clipPath="url(#clip0_767_22096)">
                    <path opacity="0.3" d="M119.999 162.667C143.563 162.667 162.665 143.565 162.665 120.001C162.665 96.4365 143.563 77.334 119.999 77.334C96.4345 77.334 77.332 96.4365 77.332 120.001C77.332 143.565 96.4345 162.667 119.999 162.667Z" fill="#9A9CCB" />
                    <path d="M104 114.667L114.667 125.333L136 104" stroke="#9A9CCB" strokeWidth="4.26667" strokeLinecap="round" strokeLinejoin="round" />
                    <path opacity="0.4" d="M142.399 130.666H97.5987C95.2423 130.666 93.332 132.576 93.332 134.933V158.399C93.332 160.756 95.2423 162.666 97.5987 162.666H142.399C144.755 162.666 146.665 160.756 146.665 158.399V134.933C146.665 132.576 144.755 130.666 142.399 130.666Z" fill="#9A9CCB" />
                </g>
                <defs>
                    <clipPath id="clip0_767_22096">
                        <rect width="128" height="128" fill="white" transform="translate(56 56)" />
                    </clipPath>
                </defs>
            </svg>
            <p className="mt-8 max-w-[420px] text-center text-[15px] leading-[22px] text-[#2B2B2F]/60">
                Invite teachers and enroll students to see your school&apos;s activity.
            </p>
            <div className="mt-6 flex items-center gap-3">
                <button className="h-12 rounded-[8px] bg-[#3B3F6E] px-6 text-[14px] font-medium text-[#F7F1E6]">
                    Add teachers
                </button>
                <button className="h-12 rounded-[8px] border border-[#3B3F6E] px-6 text-[14px] font-medium text-[#3B3F6E]">
                    Enroll students
                </button>
            </div>
        </div>
    );
}

function StatCard({ number, label, accent }: { number: string; label: string; accent: string }) {
    return (
        <div
            className="rounded-[12px] border border-[#E0D9CE] bg-white px-5 py-5"
            style={{ borderLeftWidth: 4, borderLeftColor: accent }}
        >
            <p className="text-[36px] font-bold leading-[54px] tracking-[-0.04em] text-[#3B3F6E]">
                {number}
            </p>
            <p className="text-[13px] leading-[20px] text-[#2B2B2F]/55">{label}</p>
        </div>
    );
}

function EngagementChart({ points }: { points: EngagementPoint[] }) {
    const values = points.map((point) => Number(point.active_students || 0));
    const max = Math.max(...values, 1);
    const coords = points.map((point, index) => {
        const x = 16 + (index / Math.max(points.length - 1, 1)) * 568;
        const y = 22 + (1 - Number(point.active_students || 0) / max) * 88;
        return [x, y] as const;
    });
    const linePath = coords.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
    const areaPath = `${linePath} L ${coords[coords.length - 1]?.[0] ?? 584} 126 L ${coords[0]?.[0] ?? 16} 126 Z`;

    return (
        <div className="rounded-[8px] bg-[#F7F1E6] p-4">
            <svg viewBox="0 0 600 148" className="h-[148px] w-full" preserveAspectRatio="none">
                <path d={areaPath} fill="url(#engagementFill)" />
                <path d={linePath} fill="none" stroke="#3B3F6E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" x2="588" y1="126" y2="126" stroke="rgba(43,43,47,0.1)" strokeWidth="1" />
                <defs>
                    <linearGradient id="engagementFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(154,156,203,0.30)" />
                        <stop offset="100%" stopColor="rgba(154,156,203,0.05)" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="mt-2 flex justify-between px-[14px] text-[12px] leading-[18px] text-[#2B2B2F]/50">
                {points.map((point) => (
                    <span key={point.date || point.day}>{point.day}</span>
                ))}
            </div>
        </div>
    );
}

function ProgressBar({ label, total, current }: { label: string; total: number; current: number }) {
    const safeTotal = total > 0 ? total : Math.max(current, 1);
    const width = `${Math.min((current / safeTotal) * 100, 100)}%`;

    return (
        <div className="flex flex-col gap-1">
            <p className="text-[14px] leading-[21px] text-[#2B2B2F]">{label}</p>
            <div className="flex items-center gap-3">
                <div className="h-[6px] w-[120px] rounded-full bg-[#E8E2D4]">
                    <div className="h-[6px] rounded-full bg-[#3B3F6E]" style={{ width }} />
                </div>
                <span className="text-[12px] leading-[18px] text-[#2B2B2F]/50">
                    {current} of {safeTotal} units active
                </span>
            </div>
        </div>
    );
}

function InsightCard({
    title,
    items,
    accent,
    type,
    emptyText,
}: {
    title: string;
    items: InsightItem[];
    accent: string;
    type: 'success' | 'warning';
    emptyText: string;
}) {
    return (
        <div className="rounded-[12px] border border-[#E0D9CE] bg-white p-6">
            <h2 className="text-[15px] font-semibold leading-[22px] text-[#3B3F6E]">{title}</h2>
            <div className="mt-4 flex flex-col gap-3">
                {items.length > 0 ? (
                    items.map((item) => (
                        <InsightRow
                            key={item.topic_id || item.topic_name}
                            accent={accent}
                            type={type}
                            text={`${item.topic_name}${item.subject ? ` in ${item.subject}` : ''}`}
                        />
                    ))
                ) : (
                    <EmptyPanelText text={emptyText} />
                )}
            </div>
        </div>
    );
}

function InsightRow({
    accent,
    type,
    text,
}: {
    accent: string;
    type: 'success' | 'warning';
    text: string;
}) {
    return (
        <div className="flex min-h-[37px] items-center gap-3 pl-4">
            <div className="h-[33px] w-[3px] shrink-0 rounded-full" style={{ backgroundColor: accent }} />
            <p className="flex-1 text-[14px] leading-[21px] text-[#2B2B2F]">{text}</p>
            {type === 'success' ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 11.5L6.2 8.3L8.3 10.4L13 5.7" stroke="#7AB87A" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ) : (
                <span className="text-[16px] font-medium leading-none text-[#E8A84A]">!</span>
            )}
        </div>
    );
}

function EmptyPanelText({ text }: { text: string }) {
    return <p className="text-[13px] leading-[20px] text-[#2B2B2F]/55">{text}</p>;
}

function isMissingEndpointError(error: string | null | undefined) {
    return Boolean(error && /not found/i.test(error));
}
