'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SchoolAdminSidebar } from "@/widgets";
import { ClassesView } from './ClassesView';
import { TeachersView } from './TeachersView';
import { StudentsView } from './StudentsView';
import { ReportsView } from './ReportsView';
import { SettingsView } from './SettingsView';
import { getSchoolDashboardOverview, getSchoolDashboardSummary, getSchoolSettings } from '../api/school';

type OverviewData = {
    summary: any | null;
    overview: any | null;
    settings: any | null;
};

export function SchoolAdminDashboard({ user }: { user?: any }) {
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
        <div className="flex bg-[#F7F1E6] font-sans h-screen w-full overflow-hidden">
            <SchoolAdminSidebar user={user} />
            <main className="flex-1 px-[40px] py-[40px] overflow-y-auto relative">
                {renderView()}
            </main>
        </div>
    );
}

function AdminDashboardOverview({ user }: { user?: any }) {
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

            const summary = 'data' in summaryRes ? summaryRes.data : null;
            const overview = 'data' in overviewRes ? overviewRes.data : null;
            const settings = 'data' in settingsRes ? settingsRes.data : null;
            const error =
                ('error' in summaryRes && summaryRes.error) ||
                ('error' in overviewRes && overviewRes.error) ||
                ('error' in settingsRes && settingsRes.error) ||
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
    }, []);

    if (state.loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center text-[14px] text-graphite-60">
                Loading school overview...
            </div>
        );
    }

    if (state.error) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-center">
                <h1 className="text-[22px] font-bold text-[#3B3F6E] tracking-tight">Overview</h1>
                <p className="text-[13px] text-graphite-60 max-w-[420px]">{state.error}</p>
            </div>
        );
    }

    const summary = state.data.summary;
    const overview = state.data.overview;
    const settings = state.data.settings;
    const schoolName = settings?.school_name || summary?.school_name || user?.schoolName || 'Your school';

    const subjectRows = Array.isArray(overview?.curriculum_coverage?.subjects)
        ? overview.curriculum_coverage.subjects
        : [];
    const strengths = Array.isArray(overview?.concepts_building_well?.topics)
        ? overview.concepts_building_well.topics
        : [];
    const support = Array.isArray(overview?.areas_needing_support?.topics)
        ? overview.areas_needing_support.topics
        : [];
    const engagementPoints = Array.isArray(overview?.engagement_over_time?.data_points)
        ? overview.engagement_over_time.data_points
        : [];

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                    <h1 className="text-[22px] font-bold text-[#3B3F6E] tracking-tight">Overview</h1>
                    <p className="text-[14px] text-graphite-60">Welcome back to {schoolName}</p>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <StatCard number={String(overview?.active_students_today ?? summary?.active_students_today ?? 0)} label="Active students today" />
                <StatCard number={String(overview?.lessons_completed_this_week ?? 0)} label="Lessons completed this week" />
                <StatCard number={String(overview?.active_teachers_this_week ?? summary?.total_teachers ?? 0)} label="Teachers active this week" />
                <StatCard number={String(overview?.topics_unlabeled_and_growing ?? 0)} label="Topics where understanding is growing" />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-white rounded-2xl p-6 border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <h2 className="text-[14px] font-bold text-[#3B3F6E] mb-6 tracking-tight">Engagement over time</h2>
                    {engagementPoints.length > 0 ? (
                        <div className="w-full h-[220px] bg-[#FDFBF9] rounded-xl flex flex-col justify-between overflow-hidden pt-4 pb-2 relative">
                            <div className="absolute inset-0 top-8 z-0 px-4">
                                <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="w-full h-full">
                                    <polyline
                                        points={engagementPoints
                                            .map((point: any, index: number) => {
                                                const x = (index / Math.max(engagementPoints.length - 1, 1)) * 1000;
                                                const max = Math.max(...engagementPoints.map((p: any) => Number(p.active_students || 0)), 1);
                                                const y = 180 - (Number(point.active_students || 0) / max) * 120;
                                                return `${x},${y}`;
                                            })
                                            .join(' ')}
                                        fill="none"
                                        stroke="#3B3F6E"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            <div className="flex-1" />
                            <div className="flex justify-between px-6 text-[11px] text-[#A29ECA] font-medium z-10">
                                {engagementPoints.map((point: any) => (
                                    <span key={point.date}>{point.day}</span>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <EmptyPanelText text="No engagement data yet." />
                    )}
                </div>

                <div className="col-span-1 bg-white rounded-2xl p-6 border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <h2 className="text-[14px] font-bold text-[#3B3F6E] mb-6 tracking-tight">Curriculum coverage</h2>
                    <div className="flex flex-col gap-5">
                        {subjectRows.length > 0 ? (
                            subjectRows.map((subject: any) => (
                                <ProgressBar
                                    key={subject.subject_name}
                                    label={subject.subject_name}
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
                <div className="bg-white rounded-2xl p-6 border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <h2 className="text-[14px] font-bold text-[#3B3F6E] mb-6 tracking-tight">Concepts building well</h2>
                    <div className="flex flex-col gap-4">
                        {strengths.length > 0 ? (
                            strengths.map((item: any) => (
                                <InsightRow
                                    key={item.topic_id || item.topic_name}
                                    type="success"
                                    text={`${item.topic_name}${item.subject ? ` in ${item.subject}` : ''}`}
                                />
                            ))
                        ) : (
                            <EmptyPanelText text="No strong-signal topics yet." />
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <h2 className="text-[14px] font-bold text-[#3B3F6E] mb-6 tracking-tight">Where support may be needed</h2>
                    <div className="flex flex-col gap-4">
                        {support.length > 0 ? (
                            support.map((item: any) => (
                                <InsightRow
                                    key={item.topic_id || item.topic_name}
                                    type="warning"
                                    text={`${item.topic_name}${item.subject ? ` in ${item.subject}` : ''}`}
                                />
                            ))
                        ) : (
                            <EmptyPanelText text="No risk areas reported yet." />
                        )}
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

function ProgressBar({ label, total, current }: { label: string; total: number; current: number }) {
    const safeTotal = total > 0 ? total : Math.max(current, 1);
    const percentage = (current / safeTotal) * 100;

    return (
        <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-[#3B3F6E]">{label}</span>
            <div className="flex items-center gap-3">
                <div className="flex-1 h-[6px] bg-[#EAE8F2] rounded-full overflow-hidden">
                    <div className="h-full bg-[#3B3F6E] rounded-full" style={{ width: `${Math.min(percentage, 100)}%` }} />
                </div>
                <span className="text-[11px] font-medium text-[#A29ECA] shrink-0 w-[90px]">{current} of {safeTotal} units</span>
            </div>
        </div>
    );
}

function InsightRow({ type, text }: { type: 'success' | 'warning'; text: string }) {
    const isSuccess = type === 'success';
    const barColor = isSuccess ? 'bg-[#5A9B6A]' : 'bg-[#E59842]';

    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
                <div className={`w-1 h-5 rounded-full ${barColor}`} />
                <span className="text-[13px] font-medium text-[#3B3F6E] truncate">{text}</span>
            </div>
            {isSuccess ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A9B6A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7" />
                    <path d="M7 7H17V17" />
                </svg>
            ) : (
                <span className="text-[#E59842] font-bold text-[16px] leading-none">!</span>
            )}
        </div>
    );
}

function EmptyPanelText({ text }: { text: string }) {
    return <p className="text-[13px] text-graphite-60">{text}</p>;
}
