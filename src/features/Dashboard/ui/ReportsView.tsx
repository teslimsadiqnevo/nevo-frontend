'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useAuthGuard } from '@/shared/lib';
import {
    getSchoolBoardSharePreview,
    getSchoolDashboardOverview,
    getSchoolTermReportExport,
    getSchoolTermSummary,
    getSchoolTeachersPage,
} from '../api/school';
import { DashboardViewSkeleton } from './DashboardSkeletons';

type ReportState = {
    loading: boolean;
    exporting: boolean;
    error: string | null;
    warning: string | null;
    termSummary: SchoolTermSummary | null;
    boardPreview: SchoolBoardPreview | null;
    overview: SchoolOverview | null;
    teachersPage: SchoolTeachersPage | null;
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

type SchoolOverview = Record<string, any>;

type SchoolTeachersPage = {
    teachers?: Array<Record<string, any>>;
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
        overview: null,
        teachersPage: null,
    });

    useEffect(() => {
        let mounted = true;

        void (async () => {
            setState((current) => ({ ...current, loading: true, error: null, warning: null }));

            const [termRes, previewRes, overviewRes, teachersRes] = await Promise.all([
                getSchoolTermSummary(),
                getSchoolBoardSharePreview(),
                getSchoolDashboardOverview(),
                getSchoolTeachersPage(),
            ]);

            if (!mounted) return;
            if (guardAuth([termRes, previewRes, overviewRes, teachersRes])) return;

            const termSummary = ('data' in termRes ? termRes.data : null) as SchoolTermSummary | null;
            const boardPreview = ('data' in previewRes ? previewRes.data : null) as SchoolBoardPreview | null;
            const overview = ('data' in overviewRes ? overviewRes.data : null) as SchoolOverview | null;
            const teachersPage = ('data' in teachersRes ? teachersRes.data : null) as SchoolTeachersPage | null;
            const termError = 'error' in termRes ? termRes.error : null;
            const previewError = 'error' in previewRes ? previewRes.error : null;
            const overviewError = 'error' in overviewRes ? overviewRes.error : null;
            const teachersError = 'error' in teachersRes ? teachersRes.error : null;
            const termMissing = isMissingEndpointError(termError);
            const previewMissing = isMissingEndpointError(previewError);
            const error =
                (termError && !termMissing && !termSummary ? termError : null) ||
                (previewError && !previewMissing && !termSummary ? previewError : null) ||
                null;
            const warning =
                !error && (termError || previewError || overviewError || teachersError)
                    ? 'Some report sections are unavailable from the backend right now. Showing the data we could fetch.'
                    : null;

            setState({
                loading: false,
                exporting: false,
                error,
                warning,
                termSummary,
                boardPreview,
                overview,
                teachersPage,
            });
        })();

        return () => {
            mounted = false;
        };
    }, [guardAuth]);

    const termSummary = state.termSummary;
    const boardPreview = state.boardPreview;
    const overview = state.overview;
    const teachers = Array.isArray(state.teachersPage?.teachers) ? state.teachersPage.teachers : [];
    const subjectRows = useMemo(
        () => normalizeSubjectRows(termSummary?.subject_breakdown, overview),
        [termSummary?.subject_breakdown, overview],
    );
    const termRange = formatDateRange(termSummary?.term_start_date, termSummary?.term_end_date);
    const conceptsCovered = getConceptsCovered(termSummary, overview, subjectRows);
    const teachersUploaded = getTeachersUploaded(termSummary, overview, teachers);
    const teacherActivityRows = getTeacherActivityRows(termSummary, teachers);
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
        downloadReportPdf(exportPayload, {
            termSummary,
            boardPreview,
            subjectRows,
            conceptsCovered,
            teachersUploaded,
        });
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
                    value={formatNumber(conceptsCovered)}
                    helper="This term"
                />
                <MetricCard
                    label="Teachers uploaded"
                    value={formatNumber(teachersUploaded)}
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
                                {formatNumber(teachersUploaded)}
                            </p>
                            <p className="text-[13px] leading-5 text-[#2B2B2F]/55">
                                teachers uploaded lessons this term
                            </p>
                        </div>
                        <TeacherAvatarStack
                            teachers={teacherActivityRows}
                            additionalCount={Math.max(0, teachersUploaded - teacherActivityRows.length)}
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

function normalizeSubjectRows(rows: SubjectBreakdown[] | undefined, overview: SchoolOverview | null) {
    const overviewRows = overview?.curriculum_coverage?.subjects;
    const source = Array.isArray(rows) && rows.length > 0
        ? rows
        : Array.isArray(overviewRows)
            ? overviewRows
            : [];

    return source
        .map((row) => ({
            subject_name: String(row.subject_name || row.name || 'Subject'),
            concept_count: readNumber(row, ['concept_count', 'concepts_covered', 'units_active', 'active_lessons']),
            progress_percentage: clampPercentage(readNumber(row, ['progress_percentage', 'coverage_percentage', 'overall_coverage'])),
        }))
        .filter((row) => row.concept_count > 0 || row.progress_percentage > 0)
        .slice(0, 8);
}

function getConceptsCovered(
    termSummary: SchoolTermSummary | null,
    overview: SchoolOverview | null,
    subjectRows: ReturnType<typeof normalizeSubjectRows>,
) {
    const direct = readNumber(termSummary, [
        'concepts_covered_this_term',
        'concepts_covered',
        'total_concepts_covered',
        'concept_count',
    ]);
    if (direct > 0) return direct;

    const overviewDirect = readNumber(overview, [
        'concepts_covered_this_term',
        'concepts_covered',
        'topics_unlabeled_and_growing',
    ]);
    if (overviewDirect > 0) return overviewDirect;

    return subjectRows.reduce((total, row) => total + row.concept_count, 0);
}

function getTeachersUploaded(
    termSummary: SchoolTermSummary | null,
    overview: SchoolOverview | null,
    teachers: Array<Record<string, any>>,
) {
    const direct = readNumber(termSummary, [
        'teachers_uploaded_this_term',
        'teachers_uploaded',
        'teachers_with_uploads',
        'active_teachers_uploaded',
    ]);
    if (direct > 0) return direct;

    const uploadedFromTeachers = teachers.filter((teacher) =>
        readNumber(teacher, ['lessons_uploaded', 'uploaded_lessons', 'lesson_count']) > 0,
    ).length;
    if (uploadedFromTeachers > 0) return uploadedFromTeachers;

    const avatarsCount =
        (Array.isArray(termSummary?.teacher_avatars) ? termSummary?.teacher_avatars?.length || 0 : 0) +
        readNumber(termSummary, ['additional_teacher_count']);
    if (avatarsCount > 0) return avatarsCount;

    return readNumber(overview, ['active_teachers_this_week', 'teachers_uploaded_this_term']);
}

function getTeacherActivityRows(
    termSummary: SchoolTermSummary | null,
    teachers: Array<Record<string, any>>,
): TeacherAvatar[] {
    const uploadedTeachers = teachers
        .filter((teacher) => readNumber(teacher, ['lessons_uploaded', 'uploaded_lessons', 'lesson_count']) > 0)
        .slice(0, 5)
        .map((teacher) => ({
            teacher_id: String(teacher.teacher_id || teacher.id || teacher.user_id || teacher.full_name),
            teacher_name: String(teacher.full_name || teacher.teacher_name || teacher.name || 'Teacher'),
            avatar_url: teacher.avatar_url || null,
        }));

    if (uploadedTeachers.length > 0) return uploadedTeachers;
    return Array.isArray(termSummary?.teacher_avatars) ? termSummary.teacher_avatars.slice(0, 5) : [];
}

function readNumber(source: any, keys: string[]) {
    if (!source) return 0;
    for (const key of keys) {
        const value = Number(source?.[key]);
        if (!Number.isNaN(value) && value > 0) return value;
    }
    return 0;
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

function downloadReportPdf(
    payload: any,
    fallback: {
        termSummary: SchoolTermSummary | null;
        boardPreview: SchoolBoardPreview | null;
        subjectRows: ReturnType<typeof normalizeSubjectRows>;
        conceptsCovered: number;
        teachersUploaded: number;
    },
) {
    if (typeof window === 'undefined' || !payload) return;

    const pdf = buildBrandedReportPdf(payload, fallback);
    const filename = String(payload.filename || 'school-term-report.pdf').replace(/\.json$/i, '.pdf');
    const blob = new Blob([pdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function buildBrandedReportPdf(
    payload: any,
    fallback: {
        termSummary: SchoolTermSummary | null;
        boardPreview: SchoolBoardPreview | null;
        subjectRows: ReturnType<typeof normalizeSubjectRows>;
        conceptsCovered: number;
        teachersUploaded: number;
    },
) {
    const lines = [
        payload?.headline || `${fallback.termSummary?.school_name || 'School'} term report`,
        `Reporting window: ${formatDateRange(payload?.term_start_date || fallback.termSummary?.term_start_date, payload?.term_end_date || fallback.termSummary?.term_end_date)}`,
        `Students used Nevo: ${formatNumber(fallback.termSummary?.students_used_nevo_this_term)} of ${formatNumber(fallback.termSummary?.enrolled_students)}`,
        `Concepts covered: ${formatNumber(fallback.conceptsCovered)}`,
        `Teachers uploaded lessons: ${formatNumber(fallback.teachersUploaded)}`,
        '',
        ...(Array.isArray(payload?.sections)
            ? payload.sections.flatMap((section: any) => [
                String(section.title || 'Report section'),
                ...(Array.isArray(section.bullets) ? section.bullets.map((bullet: string) => `- ${bullet}`) : []),
                '',
            ])
            : []),
        ...(fallback.subjectRows.length > 0
            ? [
                'Subject coverage',
                ...fallback.subjectRows.map((row) => `- ${row.subject_name}: ${row.concept_count} concepts`),
                '',
            ]
            : []),
        ...(fallback.boardPreview?.summary
            ? ['Board summary', fallback.boardPreview.summary, ...(fallback.boardPreview.highlights || []).map((item) => `- ${item}`)]
            : []),
    ];

    return createSimplePdf({
        title: payload?.school_name || fallback.termSummary?.school_name || 'Nevo school report',
        generatedAt: payload?.generated_at || new Date().toISOString(),
        lines,
    });
}

function createSimplePdf({
    title,
    generatedAt,
    lines,
}: {
    title: string;
    generatedAt: string;
    lines: string[];
}) {
    const objects: string[] = [];
    const addObject = (body: string) => {
        objects.push(body);
        return objects.length;
    };
    const pages: number[] = [];
    const maxLinesPerPage = 34;
    const chunks = chunkLines(lines, maxLinesPerPage);
    const fontRegular = 3;
    const fontBold = 4;
    const contentIds: number[] = [];
    const catalogId = addObject('');
    const pagesId = addObject('');
    addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

    chunks.forEach((chunk, pageIndex) => {
        const content = [
            'q 0.95 0.94 0.90 rg 0 0 595 842 re f Q',
            'q 0.23 0.25 0.43 rg 0 792 595 50 re f Q',
            'BT /F2 20 Tf 48 812 Td 1 1 1 rg (Nevo) Tj ET',
            `BT /F2 16 Tf 48 748 Td 0.23 0.25 0.43 rg (${escapePdfText(title)}) Tj ET`,
            `BT /F1 9 Tf 48 730 Td 0.23 0.25 0.43 rg (${escapePdfText(`Generated ${formatDate(generatedAt)}`)}) Tj ET`,
            'q 0.23 0.25 0.43 RG 48 708 m 547 708 l S Q',
        ];
        let y = 680;
        chunk.forEach((line) => {
            const isHeading = line && !line.startsWith('-') && line.length < 70;
            const font = isHeading ? 'F2' : 'F1';
            const size = isHeading ? 12 : 10;
            const color = isHeading ? '0.23 0.25 0.43' : '0.17 0.17 0.18';
            wrapPdfLine(line || ' ', isHeading ? 72 : 88).forEach((segment) => {
                content.push(`BT /${font} ${size} Tf 48 ${y} Td ${color} rg (${escapePdfText(segment)}) Tj ET`);
                y -= isHeading ? 18 : 14;
            });
            y -= line ? 4 : 8;
        });
        content.push(`BT /F1 9 Tf 500 36 Td 0.23 0.25 0.43 rg (${pageIndex + 1}) Tj ET`);
        const stream = content.join('\n');
        const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
        contentIds.push(contentId);
    });

    contentIds.forEach((contentId) => {
        const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${contentId} 0 R >>`);
        pages.push(pageId);
    });

    objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
    objects[pagesId - 1] = `<< /Type /Pages /Kids [${pages.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((body, index) => {
        offsets.push(pdf.length);
        pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    });
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
        pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return pdf;
}

function chunkLines(lines: string[], size: number) {
    const chunks: string[][] = [];
    for (let index = 0; index < lines.length; index += size) {
        chunks.push(lines.slice(index, index + size));
    }
    return chunks.length ? chunks : [[]];
}

function wrapPdfLine(line: string, width: number) {
    const words = String(line).split(/\s+/);
    const segments: string[] = [];
    let current = '';
    words.forEach((word) => {
        const next = current ? `${current} ${word}` : word;
        if (next.length > width && current) {
            segments.push(current);
            current = word;
        } else {
            current = next;
        }
    });
    if (current) segments.push(current);
    return segments;
}

function escapePdfText(value: string) {
    return String(value)
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');
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
