'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TeacherSidebar } from "@/widgets/TeacherSidebar";
import { StaleSessionBanner } from "@/widgets/StaleSessionBanner";
import { LessonsView } from "./LessonsView";
import { InsightsView } from "./InsightsView";
import { ConnectView } from "./ConnectView";
import { ProfileView } from "./ProfileView";
import { AddLessonWizard } from "./AddLessonWizard";
import { AssignLessonWizard } from "./AssignLessonWizard";
import { TeacherStudentsView } from "./TeacherStudentsView";
import { getTeacherDashboardHome, getTeacherProfile } from "../api/teacher";
import { normalizeTeacherProfile } from "../lib/teacherProfile";
import { useAuthGuard } from "@/shared/lib";

type TeacherRecentActivityItem = {
    id: string;
    text: string;
    time: string;
    kind: 'person' | 'lesson' | 'question';
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
        };
    });
}

export function TeacherDashboard({ view = 'home', user }: { view?: string; user?: TeacherUserLike }) {
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
                    onBack={() => router.push('/dashboard')}
                    onProfileSaved={handleProfileSaved}
                />
            );
        }
        return <TeacherHomeView user={effectiveUser} onAction={setActionModal} />;
    }, [view, router, effectiveUser, handleProfileSaved]);

    return (
        <div className="flex bg-[#F7F1E6] font-sans h-screen w-full overflow-hidden">
            <TeacherSidebar user={effectiveUser} />
            <main className="flex-1 px-[48px] py-[48px] overflow-y-auto">
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
    const router = useRouter();
    const [data, setData] = useState<UnknownRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const guardAuth = useAuthGuard('teacher');

    useEffect(() => {
        let mounted = true;
        (async () => {
            const res = await getTeacherDashboardHome();
            if (guardAuth(res)) return;
            if (!mounted) return;
            if ('data' in res) {
                setData(res.data || null);
            } else {
                setData(null);
            }
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
    const studentsNeedSupport = Number(
        weekStats?.students_needing_support ?? weekStats?.students_need_support ?? 0,
    );
    const lessonsWithConfusion = Number(
        weekStats?.lessons_with_confusion_signals ?? weekStats?.lessons_with_confusion ?? 0,
    );
    const topicsBuildingWell = Number(weekStats?.topics_building_well ?? 0);
    const isAllCaughtUp = !loading && studentsNeedSupport === 0 && lessonsWithConfusion === 0;
    const activity = normalizeRecentActivity(data);

    return (
        <div className="max-w-[900px]">
            <h1 className="text-2xl font-semibold text-indigo leading-tight">Good afternoon, {firstName}</h1>
            <p className="text-graphite-60 text-sm mt-2 mb-8">Here&apos;s what&apos;s happening with your students today</p>

            <section className="mb-8">
                <h2 className="text-[15px] font-semibold text-indigo mb-4">This week</h2>

                {isAllCaughtUp ? (
                    <div className="py-12 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full border-2 border-[#C7C7C7] flex items-center justify-center mb-4">
                            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#C7C7C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 11L9 15L17 7" />
                            </svg>
                        </div>
                        <p className="text-sm text-graphite-40 text-center max-w-[430px]">You&apos;re all caught up. No signals to review right now.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-2xl px-6 py-5 border border-[#D9D6CE] bg-transparent">
                            <div className="text-28px font-bold text-[#3B3F6E]">{loading ? '...' : studentsNeedSupport}</div>
                            <div className="text-xs text-black">Students who may need support</div>
                        </div>
                        <div className="rounded-2xl px-6 py-5 border border-[#D9D6CE] bg-transparent">
                            <div className="text-28px font-bold text-[#3B3F6E]">{loading ? '...' : lessonsWithConfusion}</div>
                            <div className="text-xs text-black">Lessons with confusion signals</div>
                        </div>
                        <div className="rounded-2xl px-6 py-5 border border-[#D9D6CE] bg-transparent">
                            <div className="text-28px font-bold text-[#3B3F6E]">{loading ? '...' : topicsBuildingWell}</div>
                            <div className="text-xs text-black">Topics building well</div>
                        </div>
                    </div>
                )}
            </section>

            <section className="mb-8">
                <h2 className="text-[15px] font-semibold text-indigo mb-4">Quick actions</h2>
                <div className="flex gap-4">
                    <button
                        onClick={() => onAction('upload')}
                        className="flex-1 py-3 px-5 text-center border-2 border-[#3B3F6E] text-[#3B3F6E] rounded-full text-sm font-semibold hover:bg-[#3B3F6E] hover:text-white transition-all duration-200 cursor-pointer"
                    >
                        Upload lesson
                    </button>
                    <button
                        onClick={() => onAction('assign')}
                        className="flex-1 py-3 px-5 text-center border-2 border-[#3B3F6E] text-[#3B3F6E] rounded-full text-sm font-semibold hover:bg-[#3B3F6E] hover:text-white transition-all duration-200 cursor-pointer"
                    >
                        Assign lesson
                    </button>
                    <button
                        onClick={() => router.push('/dashboard?view=students')}
                        className="flex-1 py-3 px-5 text-center border-2 border-[#3B3F6E] text-[#3B3F6E] rounded-full text-sm font-semibold hover:bg-[#3B3F6E] hover:text-white transition-all duration-200 cursor-pointer"
                    >
                        View students
                    </button>
                </div>
            </section>

            <section>
                <h2 className="text-[15px] font-semibold text-indigo mb-4">Recent activity</h2>
                <div className="rounded-xl border border-[#E0D9CE] bg-[#FAF9F6] p-[1px] overflow-hidden">
                    {!loading && activity.length === 0 && (
                        <p className="px-6 py-5 text-sm text-graphite-40">No recent activity yet.</p>
                    )}
                    {activity.map((item, idx: number) => (
                        <div
                            key={item.id}
                            className={`flex items-center gap-4 bg-[#FAF9F6] px-4 py-5 ${
                                idx < activity.length - 1 ? 'border-b border-[#E0D9CE]' : ''
                            }`}
                        >
                            <ActivityIcon kind={item.kind} />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[14px] font-normal leading-5 text-black">
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
