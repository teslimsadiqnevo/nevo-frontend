'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { TeacherSidebar } from "@/widgets/TeacherSidebar";
import { StaleSessionBanner } from "@/widgets/StaleSessionBanner";
import { getTeacherDashboardHome, getTeacherProfile, getTeacherStudents } from "../api/teacher";
import { normalizeTeacherProfile } from "../lib/teacherProfile";
import { getDashboardPath, useApiTokenExpiryRedirect, useAuthGuard } from "@/shared/lib";
import { DashboardViewSkeleton, TeacherDashboardOverviewSkeleton } from './DashboardSkeletons';

const DashboardViewLoader = () => (
    <DashboardViewSkeleton titleWidth="w-40" cardCount={2} rowCount={5} />
);

const LessonsView = dynamic(() => import("./LessonsView").then((mod) => mod.LessonsView), {
    loading: DashboardViewLoader,
});
const InsightsView = dynamic(() => import("./InsightsView").then((mod) => mod.InsightsView), {
    loading: DashboardViewLoader,
});
const ConnectView = dynamic(() => import("./ConnectView").then((mod) => mod.ConnectView), {
    loading: DashboardViewLoader,
});
const ProfileView = dynamic(() => import("./ProfileView").then((mod) => mod.ProfileView), {
    loading: DashboardViewLoader,
});
const AddLessonWizard = dynamic(() => import("./AddLessonWizard").then((mod) => mod.AddLessonWizard), {
    loading: DashboardViewLoader,
});
const AssignLessonWizard = dynamic(() => import("./AssignLessonWizard").then((mod) => mod.AssignLessonWizard), {
    loading: DashboardViewLoader,
});
const TeacherStudentsView = dynamic(
    () => import("./TeacherStudentsView").then((mod) => mod.TeacherStudentsView),
    {
        loading: DashboardViewLoader,
    },
);

type TeacherRecentActivityItem = {
    id: string;
    text: string;
    time: string;
    kind: 'person' | 'lesson' | 'question';
    avatarUrl?: string;
    studentName?: string;
};

type TeacherClassCard = {
    id: string;
    title: string;
    studentCount: number;
    subjectLabel: string;
    levelLabel: string;
};

type TeacherRosterClass = {
    id: string;
    name: string;
    subject?: string;
    educationLevel?: string;
    studentCount?: number;
};

type UnknownRecord = Record<string, unknown>;
type GuardableResponse = { authExpired?: boolean; error?: string } | null | undefined;
type TeacherUserLike = UnknownRecord & {
    name?: string;
    full_name?: string;
    display_name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    avatarUrl?: string;
    avatar_url?: string;
    image?: string;
    schoolId?: string | number | null;
    school_id?: string | number | null;
};

function getUserDisplayName(user?: TeacherUserLike) {
    return (
        user?.name ||
        user?.full_name ||
        user?.display_name ||
        `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
        'Teacher'
    );
}

function formatActivityTime(value: unknown) {
    const formatRelative = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();

        if (Number.isNaN(diffMs)) return '';

        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;

        if (diffMs < hour) {
            const minutes = Math.max(1, Math.round(diffMs / minute));
            return `${minutes}m ago`;
        }

        if (diffMs < day) {
            const hours = Math.max(1, Math.round(diffMs / hour));
            return `${hours}h ago`;
        }

        if (diffMs < day * 2) {
            return 'Yesterday';
        }

        return date.toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
        });
    };

    if (typeof value === 'number' && Number.isFinite(value)) {
        return formatRelative(new Date(value));
    }

    if (typeof value === 'string' && value.trim()) {
        const trimmed = value.trim();
        const parsed = new Date(trimmed);
        if (!Number.isNaN(parsed.getTime())) {
            return formatRelative(parsed);
        }
        return trimmed;
    }

    return '';
}

function getActivityKind(item: Record<string, unknown>): TeacherRecentActivityItem['kind'] {
    const actionSource = [
        item.action,
        item.event,
        item.activity_type,
        item.type,
        item.status,
        item.text,
        item.message,
        item.title,
        item.description,
        item.summary,
    ]
        .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
        .join(' ')
        .toLowerCase();

    if (actionSource.includes('question') || actionSource.includes('asked')) {
        return 'question';
    }

    if (actionSource.includes('lesson') || actionSource.includes('assigned') || actionSource.includes('topic')) {
        return 'lesson';
    }

    return 'person';
}

function ActivityIcon({ kind }: { kind: TeacherRecentActivityItem['kind'] }) {
    if (kind === 'lesson') {
        return (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F2EEE7]">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="3.5" y="4.5" width="13" height="11" rx="2" fill="#DDE8FF" stroke="#C7D6F4" />
                    <path d="M6.5 8H13.5" stroke="#6D84B8" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M6.5 10.5H11.5" stroke="#6D84B8" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M5.2 6.3L9.2 3.8L13.3 6.3L9.2 8.7L5.2 6.3Z" fill="#8BC4F7" stroke="#6D84B8" strokeWidth="0.8" />
                </svg>
            </div>
        );
    }

    if (kind === 'question') {
        return (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8F0F6]">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="8" fill="#D8E9F7" />
                    <path d="M7.1 7.1C7.1 6.05 7.93 5.25 9.1 5.25C10.15 5.25 10.95 5.91 10.95 6.92C10.95 8.31 9.35 8.53 9.35 9.7" stroke="#3B3F6E" strokeWidth="1.3" strokeLinecap="round" />
                    <circle cx="9.35" cy="12.5" r="0.75" fill="#3B3F6E" />
                </svg>
            </div>
        );
    }

    return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F4D7DC]">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="6.4" r="2.5" fill="#B86573" />
                <path d="M4.5 13.8C5.2 11.7 6.84 10.6 9 10.6C11.16 10.6 12.8 11.7 13.5 13.8" stroke="#B86573" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
        </div>
    );
}

function toCount(value: unknown) {
    const count = Number(value);
    return Number.isFinite(count) ? count : 0;
}

function normalizeClassLevel(className: string) {
    const trimmed = className.trim();
    const match = trimmed.match(/\b(grade\s*\d+|jss\s*\d+|sss\s*\d+|year\s*\d+|primary\s*\d+|secondary\s*\d+)\b/i);
    return match ? match[1].toUpperCase().replace(/\s+/g, ' ') : 'No level';
}

function normalizeClassSubject(subject: unknown) {
    if (typeof subject !== 'string' || !subject.trim()) return 'No subject';
    const trimmed = subject.trim();
    return trimmed.length > 18 ? `${trimmed.slice(0, 17)}…` : trimmed;
}

function normalizeEducationLevel(level: unknown, fallbackClassName: string) {
    if (typeof level === 'string' && level.trim()) {
        const trimmed = level.trim();
        return trimmed.length > 18 ? `${trimmed.slice(0, 17)}…` : trimmed;
    }

    return normalizeClassLevel(fallbackClassName);
}

function buildTeacherClassCards(classes: TeacherRosterClass[], students: unknown[]): TeacherClassCard[] {
    if (classes.length > 0) {
        const studentCountsByClassId = new Map<string, number>();
        const studentCountsByClassName = new Map<string, number>();

        students.forEach((entry) => {
            const student = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : null;
            if (!student) return;

            const classId =
                student.class_id != null && String(student.class_id).trim()
                    ? String(student.class_id).trim()
                    : null;
            const className =
                typeof student.class_name === 'string' && student.class_name.trim()
                    ? student.class_name.trim().toLowerCase()
                    : typeof student.class === 'string' && student.class.trim()
                      ? student.class.trim().toLowerCase()
                      : typeof student.group_name === 'string' && student.group_name.trim()
                        ? student.group_name.trim().toLowerCase()
                        : null;

            if (classId) {
                studentCountsByClassId.set(classId, (studentCountsByClassId.get(classId) ?? 0) + 1);
            }

            if (className) {
                studentCountsByClassName.set(className, (studentCountsByClassName.get(className) ?? 0) + 1);
            }
        });

        return [...classes]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((classItem) => {
                const normalizedName = classItem.name.trim().toLowerCase();
                const liveCount =
                    studentCountsByClassId.get(classItem.id) ??
                    studentCountsByClassName.get(normalizedName) ??
                    classItem.studentCount ??
                    0;

                return {
                    id: classItem.id,
                    title: classItem.name,
                    studentCount: liveCount,
                    subjectLabel: normalizeClassSubject(classItem.subject),
                    levelLabel: normalizeEducationLevel(classItem.educationLevel, classItem.name),
                };
            });
    }

    const grouped = new Map<
        string,
        { id: string; title: string; studentCount: number; subjects: Map<string, number> }
    >();

    students.forEach((entry, index) => {
        const student = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : null;
        if (!student) return;

        const rawClassName = student.class_name ?? student.class ?? student.group_name ?? 'Unassigned class';
        const title =
            typeof rawClassName === 'string' && rawClassName.trim() ? rawClassName.trim() : 'Unassigned class';
        const key = title.toLowerCase();
        const subject = normalizeClassSubject(student.subject);
        const existing = grouped.get(key);

        if (existing) {
            existing.studentCount += 1;
            existing.subjects.set(subject, (existing.subjects.get(subject) ?? 0) + 1);
            return;
        }

        grouped.set(key, {
            id: String(student.class_id ?? student.id ?? `class-${index}`),
            title,
            studentCount: 1,
            subjects: new Map([[subject, 1]]),
        });
    });

    return Array.from(grouped.values())
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((group) => {
            const topSubject =
                Array.from(group.subjects.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'No subject';

            return {
                id: group.id,
                title: group.title,
                studentCount: group.studentCount,
                subjectLabel: topSubject,
                levelLabel: normalizeClassLevel(group.title),
            };
        });
}

function buildActivityText(item: Record<string, unknown>) {
    const directText =
        item.text ||
        item.message ||
        item.title ||
        item.description ||
        item.summary;

    if (typeof directText === 'string' && directText.trim()) {
        return directText.trim();
    }

    const actor =
        item.student_name ||
        item.studentName ||
        item.teacher_name ||
        item.teacherName ||
        item.user_name ||
        item.userName ||
        item.name;
    const action = item.action || item.event || item.activity_type || item.type || item.status;
    const target = item.lesson_title || item.lessonTitle || item.topic || item.subject || item.target;

    const parts = [actor, action, target]
        .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
        .map((part) => part.trim());

    return parts.length > 0 ? parts.join(' • ') : 'Recent activity';
}

function normalizeRecentActivity(data: UnknownRecord | null | undefined): TeacherRecentActivityItem[] {
    const weekStatsSource = data?.week_stats ?? data?.weekStats ?? null;
    const weekStats =
        weekStatsSource && typeof weekStatsSource === 'object'
            ? (weekStatsSource as UnknownRecord)
            : null;
    const rawActivity = [
        data?.recent_activity,
        data?.recentActivity,
        data?.activity,
        data?.activities,
        weekStats?.recent_activity,
        weekStats?.recentActivity,
    ].find((value) => Array.isArray(value));

    if (!Array.isArray(rawActivity)) return [];

    return rawActivity.map((entry: unknown, index: number) => {
        const item =
            entry && typeof entry === 'object'
                ? (entry as Record<string, unknown>)
                : { text: String(entry ?? 'Recent activity') };

        return {
            id:
                typeof item.id === 'string' || typeof item.id === 'number'
                    ? String(item.id)
                    : `activity-${index}`,
            text: buildActivityText(item),
            time: formatActivityTime(
                item.time_ago ||
                    item.timeAgo ||
                    item.time ||
                    item.when ||
                    item.created_at ||
                    item.createdAt ||
                    item.timestamp ||
                    item.date,
            ),
            kind: getActivityKind(item),
            avatarUrl:
                typeof item.student_avatar_url === 'string' && item.student_avatar_url.trim()
                    ? item.student_avatar_url
                    : undefined,
            studentName:
                typeof item.student_name === 'string' && item.student_name.trim()
                    ? item.student_name
                    : undefined,
        };
    });
}

export function TeacherDashboard({ view = 'home', user }: { view?: string; user?: TeacherUserLike }) {
    useApiTokenExpiryRedirect('teacher');
    const router = useRouter();
    const [actionModal, setActionModal] = useState<'upload' | 'assign' | null>(null);
    const [assignLessonId, setAssignLessonId] = useState<string | null>(null);
    const [profileIdentity, setProfileIdentity] = useState<{ name?: string; email?: string; avatarUrl?: string } | null>(null);
    const [profileSchoolId, setProfileSchoolId] = useState<string | null>(null);
    const [staleSessionDismissed, setStaleSessionDismissed] = useState(false);
    const guardAuth = useAuthGuard('teacher');
    const handleExpiredTeacherSession = useCallback(
        (res?: GuardableResponse) => guardAuth(res),
        [guardAuth],
    );

    useEffect(() => {
        let mounted = true;
        (async () => {
            const res = await getTeacherProfile();
            if (await handleExpiredTeacherSession(res)) return;
            if (!mounted || !('data' in res)) return;
            const normalized = normalizeTeacherProfile(res.data);
            setProfileIdentity({
                name: normalized.fullName,
                email: normalized.email,
                avatarUrl: normalized.avatarUrl,
            });
            setProfileSchoolId(normalized.schoolId);
        })();
        return () => {
            mounted = false;
        };
    }, [handleExpiredTeacherSession]);

    const sessionSchoolId = useMemo(() => {
        const raw = user?.schoolId ?? user?.school_id ?? null;
        return raw ? String(raw) : null;
    }, [user]);

    const sessionIsStale =
        !staleSessionDismissed &&
        Boolean(profileSchoolId) &&
        profileSchoolId !== sessionSchoolId;

    const effectiveUser = useMemo(
        () => ({
            ...(user || {}),
            ...(profileIdentity || {}),
            name: profileIdentity?.name || getUserDisplayName(user),
            email: profileIdentity?.email || user?.email || '',
            avatarUrl: profileIdentity?.avatarUrl || user?.avatarUrl || user?.avatar_url || user?.image || '',
        }),
        [user, profileIdentity],
    );

    const handleProfileSaved = useCallback(
        (updated: { fullName: string; email: string; avatarUrl?: string }) => {
            setProfileIdentity({
                name: updated.fullName,
                email: updated.email,
                avatarUrl: updated.avatarUrl || '',
            });
        },
        [],
    );

    const content = useMemo(() => {
        if (view === 'lessons') return <LessonsView />;
        if (view === 'students') return <TeacherStudentsView />;
        if (view === 'insights') return <InsightsView />;
        if (view === 'connect') return <ConnectView />;
        if (view === 'profile') {
            return (
                <ProfileView
                    onBack={() => router.push(getDashboardPath('teacher', 'home'))}
                    onProfileSaved={handleProfileSaved}
                />
            );
        }
        return <TeacherHomeView user={effectiveUser} onAction={setActionModal} />;
    }, [view, router, effectiveUser, handleProfileSaved]);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#F7F1E6] font-sans">
            <TeacherSidebar user={effectiveUser} currentView={view} />
            <main className="ml-[200px] flex-1 overflow-y-auto px-[48px] py-[48px]">
                {sessionIsStale ? (
                    <StaleSessionBanner
                        callbackUrl="/login/teacher"
                        onDismiss={() => setStaleSessionDismissed(true)}
                    />
                ) : null}
                {actionModal === 'upload' ? (
                    <AddLessonWizard
                        onClose={() => setActionModal(null)}
                        onAssign={(lessonId) => {
                            setAssignLessonId(lessonId);
                            setActionModal('assign');
                        }}
                    />
                ) : actionModal === 'assign' ? (
                    <AssignLessonWizard
                        initialLessonId={assignLessonId || undefined}
                        onClose={() => {
                            setAssignLessonId(null);
                            setActionModal(null);
                        }}
                    />
                ) : (
                    content
                )}
            </main>
        </div>
    );
}

function TeacherHomeView({
    user,
    onAction,
}: {
    user?: TeacherUserLike;
    onAction: (action: 'upload' | 'assign') => void;
}) {
    useApiTokenExpiryRedirect('teacher');
    const router = useRouter();
    const [data, setData] = useState<UnknownRecord | null>(null);
    const [students, setStudents] = useState<unknown[]>([]);
    const [classes, setClasses] = useState<TeacherRosterClass[]>([]);
    const [loading, setLoading] = useState(true);
    const guardAuth = useAuthGuard('teacher');

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!mounted) return;

            const [homeRes, studentsRes, classesRes] = await Promise.all([
                getTeacherDashboardHome(),
                getTeacherStudents(),
                fetch('/api/teacher/classes').then(async (res) => {
                    const payload = await res.json().catch(() => ({}));
                    if (!res.ok) {
                        return {
                            error:
                                typeof payload?.detail === 'string'
                                    ? payload.detail
                                    : 'Could not load teacher classes.',
                        };
                    }
                    return { data: payload };
                }),
            ]);

            if (guardAuth(homeRes) || guardAuth(studentsRes) || !mounted) return;

            setData('data' in homeRes ? (homeRes.data as UnknownRecord | null) : null);

            const studentPayload = 'data' in studentsRes ? studentsRes.data : null;
            setStudents(
                Array.isArray(studentPayload)
                    ? studentPayload
                    : Array.isArray((studentPayload as { students?: unknown[] } | null | undefined)?.students)
                      ? ((studentPayload as { students?: unknown[] }).students ?? [])
                      : [],
            );
            const rawClasses =
                Array.isArray((classesRes as { data?: { classes?: unknown[] } }).data?.classes)
                    ? ((classesRes as { data: { classes: unknown[] } }).data.classes ?? [])
                    : [];
            setClasses(
                rawClasses.reduce<TeacherRosterClass[]>((acc, entry) => {
                    const item = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : null;
                    if (!item) return acc;

                    const id = item.id ?? item.class_id;
                    const name = item.name ?? item.class_name;
                    if (id == null || typeof name !== 'string' || !name.trim()) return acc;

                    acc.push({
                        id: String(id),
                        name: name.trim(),
                        subject:
                            typeof item.subject === 'string'
                                ? item.subject
                                : Array.isArray(item.subjects)
                                  ? item.subjects.filter((value): value is string => typeof value === 'string').join(', ')
                                  : undefined,
                        educationLevel:
                            typeof item.education_level === 'string'
                                ? item.education_level
                                : typeof item.level === 'string'
                                  ? item.level
                                  : undefined,
                        studentCount: toCount(item.student_count ?? item.students_count ?? 0),
                    });

                    return acc;
                }, []),
            );
            setLoading(false);
        })();
        return () => {
            mounted = false;
        };
    }, [guardAuth]);

    const firstName = user?.name || 'Teacher';
    const weekStatsSource = data?.week_stats ?? data?.weekStats ?? data ?? null;
    const weekStats =
        weekStatsSource && typeof weekStatsSource === 'object'
            ? (weekStatsSource as UnknownRecord)
            : null;
    const studentsNeedSupport = toCount(
        weekStats?.students_needing_support ?? weekStats?.students_need_support ?? 0,
    );
    const lessonsWithConfusion = toCount(
        weekStats?.lessons_with_confusion_signals ?? weekStats?.lessons_with_confusion ?? 0,
    );
    const topicsBuildingWell = toCount(weekStats?.topics_building_well ?? 0);
    const activity = normalizeRecentActivity(data);
    const classCards = useMemo(() => buildTeacherClassCards(classes, students), [classes, students]);

    if (loading) return <TeacherDashboardOverviewSkeleton />;

    return (
        <div className="w-full max-w-[740px]">
            <section className="mb-8 flex flex-col gap-2">
                <h1 className="text-[24px] font-semibold leading-8 text-[#3B3F6E]">
                    Good afternoon, {firstName}
                </h1>
                <p className="text-[14px] leading-[21px] text-black/60">
                    Here&apos;s what&apos;s happening with your students today
                </p>
            </section>

            <section className="mb-8 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-[14px] font-semibold uppercase tracking-[0.04em] text-[#3B3F6E]/70">
                        My classes
                    </h2>
                    <button
                                        onClick={() => router.push(getDashboardPath('teacher', 'students'))}
                        className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#3B3F6E]/50 cursor-pointer"
                    >
                        Manage
                    </button>
                </div>
                {classCards.length > 0 ? (
                    <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2 xl:grid-cols-3">
                        {classCards.map((classItem) => (
                            <div
                                key={classItem.id}
                                className="flex min-h-[150px] flex-col justify-between rounded-[10px] border border-[#E0D9CE] bg-[#F7F1E6] p-[10px]"
                            >
                                <div className="flex flex-col gap-5">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex flex-col gap-3">
                                            <h3 className="text-[15px] font-bold leading-4 text-[#3B3F6E]/80">
                                                {classItem.title}
                                            </h3>
                                            <p className="text-[12px] font-medium leading-4 text-[#3B3F6E]/70">
                                                {classItem.studentCount} {classItem.studentCount === 1 ? 'student' : 'students'}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="rounded-[5px] bg-[#9A9CCB]/20 px-2 py-1 text-[12px] font-medium leading-4 text-[#3B3F6E]">
                                                {classItem.subjectLabel}
                                            </span>
                                            <span className="rounded-[5px] bg-[#9A9CCB]/20 px-2 py-1 text-[12px] font-medium leading-4 text-[#3B3F6E]">
                                                {classItem.levelLabel}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[12px] font-medium leading-4 text-[#3B3F6E]/70">
                                        Class overview
                                    </p>
                                </div>
                                <button
                                        onClick={() => router.push(getDashboardPath('teacher', 'students'))}
                                    className="mt-4 text-left text-[12px] font-medium leading-4 text-[#3B3F6E]/55 cursor-pointer"
                                >
                                    View class
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-[10px] border border-[#E0D9CE] bg-[#F7F1E6] px-4 py-5 text-[13px] text-[#3B3F6E]/65">
                        No classes assigned yet.
                    </div>
                )}
            </section>

            <section className="mb-8 flex flex-col gap-4">
                <h2 className="text-[15px] font-semibold leading-[22px] text-[#3B3F6E]">This week</h2>
                <div className="grid grid-cols-3 gap-[22px]">
                    <div className="rounded-[12px] border border-[#E0D9CE] border-l-4 bg-[#F7F1E6] px-5 py-[17px]">
                        <div className="text-[28px] font-bold leading-[42px] text-[#3B3F6E]">{studentsNeedSupport}</div>
                        <div className="text-[12px] leading-4 text-black/70">Students who may need support</div>
                    </div>
                    <div className="rounded-[12px] border border-[#E0D9CE] border-l-4 bg-[#F7F1E6] px-5 py-[17px]">
                        <div className="text-[28px] font-bold leading-[42px] text-[#3B3F6E]">{lessonsWithConfusion}</div>
                        <div className="text-[12px] leading-4 text-black/70">Lessons with confusion signals</div>
                    </div>
                    <div className="rounded-[12px] border border-[#E0D9CE] border-l-4 bg-[#F7F1E6] px-5 py-[17px]">
                        <div className="text-[28px] font-bold leading-[42px] text-[#3B3F6E]">{topicsBuildingWell}</div>
                        <div className="text-[12px] leading-4 text-black/70">Topics building well</div>
                    </div>
                </div>
            </section>

            <section className="mb-8 flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                    <h2 className="text-[15px] font-semibold leading-[22px] text-[#3B3F6E]">Quick actions</h2>
                </div>
                <div className="grid grid-cols-3 gap-[22px]">
                    <button
                        onClick={() => onAction('upload')}
                        className="h-10 rounded-full border border-[#3B3F6E] text-center text-[14px] font-medium text-[#3B3F6E] transition-colors hover:bg-[#3B3F6E] hover:text-[#F7F1E6] cursor-pointer"
                    >
                        Upload lesson
                    </button>
                    <button
                        onClick={() => onAction('assign')}
                        className="h-10 rounded-full border border-[#3B3F6E] text-center text-[14px] font-medium text-[#3B3F6E] transition-colors hover:bg-[#3B3F6E] hover:text-[#F7F1E6] cursor-pointer"
                    >
                        Assign lesson
                    </button>
                    <button
                                        onClick={() => router.push(getDashboardPath('teacher', 'students'))}
                        className="h-10 rounded-full border border-[#3B3F6E] text-center text-[14px] font-medium text-[#3B3F6E] transition-colors hover:bg-[#3B3F6E] hover:text-[#F7F1E6] cursor-pointer"
                    >
                        View students
                    </button>
                </div>
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="text-[15px] font-semibold leading-[22px] text-[#3B3F6E]">Recent activity</h2>
                <div className="overflow-hidden rounded-[12px] border border-[#E0D9CE] bg-[#FAF9F6] p-[1px]">
                    {activity.length === 0 && (
                        <div className="bg-[#FAF9F6] px-4 py-6">
                            <p className="text-[14px] leading-5 text-black">No recent activity yet</p>
                            <p className="mt-1 text-[12px] leading-4 text-black/50">
                                Student and lesson activity will appear here once the backend records it.
                            </p>
                        </div>
                    )}
                    {activity.map((item, idx: number) => (
                        <div
                            key={item.id}
                            className={`flex items-center gap-4 bg-[#FAF9F6] px-4 py-5 ${
                                idx < activity.length - 1 ? 'border-b border-[#E0D9CE]' : ''
                            }`}
                        >
                            {item.avatarUrl ? (
                                <img
                                    src={item.avatarUrl}
                                    alt={item.studentName || 'Student avatar'}
                                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                                />
                            ) : (
                                <ActivityIcon kind={item.kind} />
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[14px] leading-5 text-black">
                                    {item.text}
                                </p>
                            </div>
                            <span className="ml-4 shrink-0 text-[12px] leading-4 text-black/50">
                                {item.time}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
