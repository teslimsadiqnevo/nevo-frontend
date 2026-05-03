'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { TeacherSidebar } from "@/widgets/TeacherSidebar";
import { StaleSessionBanner } from "@/widgets/StaleSessionBanner";
import { LessonsView } from "./LessonsView";
import { InsightsView } from "./InsightsView";
import { ConnectView } from "./ConnectView";
import { ProfileView } from "./ProfileView";
import { AddLessonWizard } from "./AddLessonWizard";
import { AssignLessonWizard } from "./AssignLessonWizard";
import { TeacherStudentsBackendView } from "./TeacherBackendViews";
import { getTeacherDashboardHome, getTeacherProfile } from "../api/teacher";
import { normalizeTeacherProfile } from "../lib/teacherProfile";
import { useAuthGuard } from "@/shared/lib";

function getUserDisplayName(user?: any) {
    return (
        user?.name ||
        user?.full_name ||
        user?.display_name ||
        `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
        'Teacher'
    );
}

export function TeacherDashboard({ view = 'home', user }: { view?: string; user?: any }) {
    const router = useRouter();
    const [actionModal, setActionModal] = useState<'upload' | 'assign' | null>(null);
    const [profileIdentity, setProfileIdentity] = useState<{ name?: string; email?: string; avatarUrl?: string } | null>(null);
    const [profileSchoolId, setProfileSchoolId] = useState<string | null>(null);
    const [staleSessionDismissed, setStaleSessionDismissed] = useState(false);
    const guardAuth = useAuthGuard('teacher');

    const handleExpiredTeacherSession = (res?: any) => guardAuth(res);

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
    }, []);

    const sessionSchoolId = useMemo(() => {
        const raw = (user as any)?.schoolId ?? (user as any)?.school_id ?? null;
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

    const content = useMemo(() => {
        if (view === 'lessons') return <LessonsView />;
        if (view === 'students') return <TeacherStudentsBackendView />;
        if (view === 'insights') return <InsightsView />;
        if (view === 'connect') return <ConnectView />;
        if (view === 'profile') {
            return (
                <ProfileView
                    onBack={() => router.push('/dashboard')}
                    onProfileSaved={(updated: { fullName: string; email: string; avatarUrl?: string }) =>
                        setProfileIdentity({
                            name: updated.fullName,
                            email: updated.email,
                            avatarUrl: updated.avatarUrl || '',
                        })
                    }
                />
            );
        }
        return <TeacherHomeView user={effectiveUser} onAction={setActionModal} />;
    }, [view, router, effectiveUser]);

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
                    <AddLessonWizard onClose={() => setActionModal(null)} onAssign={() => setActionModal('assign')} />
                ) : actionModal === 'assign' ? (
                    <AssignLessonWizard onClose={() => setActionModal(null)} />
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
    user?: any;
    onAction: (action: 'upload' | 'assign') => void;
}) {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
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
    const studentsNeedSupport = Number(data?.students_need_support ?? 0);
    const lessonsWithConfusion = Number(data?.lessons_with_confusion ?? 0);
    const topicsBuildingWell = Number(data?.topics_building_well ?? 0);
    const isAllCaughtUp = !loading && studentsNeedSupport === 0 && lessonsWithConfusion === 0;
    const activity = Array.isArray(data?.recent_activity) ? data.recent_activity : [];

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
                <div className="bg-[#F1F1F1] rounded-2xl border border-[#D9D6CE] overflow-hidden">
                    {!loading && activity.length === 0 && (
                        <p className="px-6 py-5 text-sm text-graphite-40">No recent activity yet.</p>
                    )}
                    {activity.map((item: any, idx: number) => (
                        <div key={item.id || idx} className={`px-6 py-4 flex items-center justify-between ${idx < activity.length - 1 ? 'border-b border-[#DDDAD3]' : ''}`}>
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-[#C9CCD8] shrink-0" />
                                <p className="text-sm text-[#2B2B2F] truncate">
                                    {item.text || item.message || item.title || 'Recent activity'}
                                </p>
                            </div>
                            <span className="text-[20px] text-graphite-40 shrink-0 ml-4">
                                {item.time_ago || item.time || item.when || ''}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
