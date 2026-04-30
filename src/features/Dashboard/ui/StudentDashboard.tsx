'use client';

import React, { useState, useEffect } from 'react';
import { StudentSidebar } from "@/widgets/StudentSidebar";
import { getStudentDashboard, getStudentLessons, getStudentProfile, getStudentProgress, getStudentConnections, updateStudentSettings } from '../api/student';
import { useRegistrationStore } from '@/shared/store/useRegistrationStore';
import { signOut } from 'next-auth/react';

// ─── Types ─────────────────────────────────────────────────────────────────────
export type Lesson = {
    id: number | string;
    title: string;
    subject: string;
    topic: string;
    grade: string;
    duration: string;
    status: 'completed' | 'in_progress' | 'not_started';
    objectives?: string[];
    bannerColor?: string;
}

// ─── Subject pill color map ────────────────────────────────────────────────────
const subjectColors: Record<string, { bg: string; text: string; banner: string }> = {
    History:     { bg: '#F0DCC0', text: '#8B6914', banner: '#C8B896' },
    Science:     { bg: '#D4EDDA', text: '#2D6A4F', banner: '#8BC4A0' },
    Mathematics: { bg: '#DDD8F0', text: '#3B3F6E', banner: '#A9A5D1' },
    Literature:  { bg: '#F5E0E9', text: '#8B3A62', banner: '#D4A0B8' },
    Geography:   { bg: '#D6EAF3', text: '#1B6B8A', banner: '#8BBEDB' },
};


// ─── Main Component ────────────────────────────────────────────────────────────
export function StudentDashboard({ view = 'home', user }: { view?: string; user?: any }) {
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    
    // States for real data mapped to local format
    const [assignedLessons, setAssignedLessons] = useState<Lesson[]>([]);
    const [recommendedLessons, setRecommendedLessons] = useState<Lesson[]>([]);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [teacherLessons, setTeacherLessons] = useState<Lesson[]>([]);
    const [completedLessons, setCompletedLessons] = useState<Lesson[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [progressData, setProgressData] = useState<any>(null);
    const clearRegistration = useRegistrationStore((state) => state.clearRegistration);
    const userIdentity = user?.id || user?.nevoId || user?.email || user?.name || null;

    const resetStudentState = () => {
        setSelectedLesson(null);
        setAssignedLessons([]);
        setRecommendedLessons([]);
        setCurrentLesson(null);
        setTeacherLessons([]);
        setCompletedLessons([]);
        setProfile(null);
        setProgressData(null);
    };

    useEffect(() => {
        if (!userIdentity) {
            resetStudentState();
            setLoading(false);
            return;
        }

        // Clear any previous registration flow leftovers once a student session is active.
        clearRegistration();
        
        async function loadData() {
            setLoading(true);
            resetStudentState();
            try {
                // Fetch from real backend
                const [dashRes, lessRes, profRes, progRes, connRes] = await Promise.all([
                    getStudentDashboard(),
                    getStudentLessons(),
                    getStudentProfile(),
                    getStudentProgress(),
                    getStudentConnections()
                ]);
                
                if (profRes.data) setProfile(profRes.data);
                console.log("profile", profile)
                if (progRes.data) setProgressData(progRes.data);
                if (connRes.data) {
                    setProfile((prev: any) => ({ ...(prev || {}), connections: connRes.data }));
                    console.log("profile", profRes.data )
                }

                console.log("dashRes", dashRes);
                
                // Map dashboard / lessons data robustly
                const rawDashboard = dashRes.data || {};
                const rawLessons = lessRes.data || [];
                const rawProgress = progRes.data || {};
                
                // Extract assignments and sessions robustly
                const extractedAssignments = Array.isArray(rawLessons) ? rawLessons.filter((l: any) => l.status === 'not_started' || !l.status) : (rawLessons.assigned || rawLessons.assignments || rawDashboard.assigned || rawDashboard.assignments || []);
                const extractedSessions = Array.isArray(rawLessons) ? rawLessons.filter((l: any) => l.status === 'completed' || l.completed_at) : (rawLessons.sessions || rawDashboard.sessions || rawProgress.sessions || []);
                const extractedRecommended = Array.isArray(rawDashboard.recommended) ? rawDashboard.recommended : (Array.isArray(rawLessons.recommended) ? rawLessons.recommended : []);
                
                const assignments = Array.isArray(extractedAssignments) ? extractedAssignments : [];
                const sessions = Array.isArray(extractedSessions) ? extractedSessions : [];
                const recommended = Array.isArray(extractedRecommended) ? extractedRecommended : [];
                
                const mapLesson = (a: any, status: any) => ({
                    id: a.lesson_id || a.id || Math.random(),
                    title: a.title || 'Lesson',
                    subject: a.subject || 'Subject',
                    topic: a.topic || 'Topic',
                    grade: 'Grade ' + (a.target_grade_level || 3),
                    duration: `~${a.estimated_duration_minutes || 20} min`,
                    status: a.status || status,
                    objectives: a.objectives || []
                });

                if (assignments.length > 0 || sessions.length > 0 || recommended.length > 0) {
                    const mappedAssignments = assignments.map((a: any) => mapLesson(a, 'not_started'));
                    setAssignedLessons(mappedAssignments);
                    setTeacherLessons(mappedAssignments); // using assignments as teacher lessons for now
                    setCurrentLesson(mappedAssignments[0] || null);

                    const completed = sessions
                        .filter((s: any) => s.completed_at || s.status === 'completed')
                        .map((s: any) => mapLesson(s, 'completed'));
                    setCompletedLessons(completed);

                    const mappedRecommended = recommended.map((a: any) => mapLesson(a, 'not_started'));
                    setRecommendedLessons(mappedRecommended);
                } else {
                    setAssignedLessons([]);
                    setRecommendedLessons([]);
                    setCurrentLesson(null);
                    setTeacherLessons([]);
                    setCompletedLessons([]);
                }
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setLoading(false);
            }
        }
        
        loadData();
    }, [userIdentity, clearRegistration]);

    const handleStudentLogout = async () => {
        clearRegistration();
        await signOut({ callbackUrl: '/login/student' });
    };

    return (
        <div className="flex bg-[#F7F1E6] font-sans h-screen w-full overflow-hidden">
            <StudentSidebar />
            <main className="flex-1 overflow-y-auto relative">
                {selectedLesson ? (
                    <LessonDetailView
                        lesson={selectedLesson}
                        onBack={() => setSelectedLesson(null)}
                    />
                ) : view === 'lessons' ? (
                    <div className="px-[48px] py-[48px]">
                        <StudentLessonsView onSelectLesson={setSelectedLesson} currentLesson={currentLesson} teacherLessons={teacherLessons} completedLessons={completedLessons} />
                    </div>
                ) : view === 'downloads' ? (
                    <div className="px-[48px] py-[48px]">
                        <StudentDownloadsView />
                    </div>
                ) : view === 'progress' ? (
                    <div className="px-[48px] py-[48px]">
                        <StudentProgressView progressData={progressData} />
                    </div>
                ) : view === 'connect' ? (
                    <div className="px-[48px] py-[48px]">
                        <StudentConnectView profile={profile} />
                    </div>
                ) : view === 'profile' ? (
                    <div className="px-[48px] py-[48px]">
                        <StudentProfileView user={user} profile={profile} onLogout={handleStudentLogout} />
                    </div>
                ) : (
                    <div className="px-[48px] py-[48px]">
                        <StudentHomeView onSelectLesson={setSelectedLesson} user={user} assignedLessons={assignedLessons} recommendedLessons={recommendedLessons} currentLesson={currentLesson} />
                    </div>
                )}
            </main>
        </div>
    );
}

// ─── Home View ─────────────────────────────────────────────────────────────────
function StudentHomeView({ onSelectLesson, user, assignedLessons, recommendedLessons, currentLesson }: { onSelectLesson: (lesson: Lesson) => void; user?: any; assignedLessons: Lesson[]; recommendedLessons: Lesson[]; currentLesson: Lesson | null }) {
    const firstName = user?.name?.split(' ')[0] || 'Student';

    return (
        <div className="max-w-[820px]">
            {/* Greeting */}
            <h1 className="text-[32px] font-bold text-[#3B3F6E] leading-tight tracking-[-0.02em]">
                Hi, {firstName}.
            </h1>
            <p className="text-graphite-60 text-[15px] mt-2 mb-8">
                Ready to continue where you left off?
            </p>

            {/* Continue Lesson Hero */}
            {currentLesson && (
                <div
                    className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6 mb-10 cursor-pointer hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] transition-shadow"
                    onClick={() => onSelectLesson(currentLesson)}
                >
                    {/* Subject breadcrumb */}
                    <span className="text-[12px] font-bold text-[#3B3F6E] tracking-[0.06em] uppercase">
                        {currentLesson.subject} · {currentLesson.topic}
                    </span>

                    {/* Title */}
                    <h2 className="text-[22px] font-bold text-[#2B2B2F] mt-2 mb-4 tracking-[-0.01em]">
                        {currentLesson.title}
                    </h2>

                    {/* Progress thumbnail bar */}
                    <div className="bg-[#F3F0EA] rounded-xl px-5 py-4 flex items-center gap-4 mb-5">
                        {/* Play button */}
                        <div className="w-10 h-10 rounded-full bg-[#3B3F6E] flex items-center justify-center shrink-0">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M3 1.5L12 7L3 12.5V1.5Z" fill="white"/>
                            </svg>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[13px] font-semibold text-[#3B3F6E]">Step 2 of 5</span>
                            <div className="w-[120px] h-[4px] bg-[#E0DDD7] rounded-full overflow-hidden">
                                <div className="h-full bg-[#3B3F6E] rounded-full" style={{ width: '40%' }} />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                        <span className="text-[13px] text-graphite-60">Pick up from Step 2</span>
                        <button
                            className="px-6 py-[10px] bg-[#3B3F6E] hover:bg-[#2C2F52] text-white rounded-full text-[13.5px] font-semibold transition-colors cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); onSelectLesson(currentLesson); }}
                        >
                            Continue Lesson
                        </button>
                    </div>
                </div>
            )}

            {/* Assigned Section */}
            <section className="mb-10">
                <h3 className="text-[16px] font-bold text-[#3B3F6E] mb-5">Assigned</h3>
                <div className="grid grid-cols-3 gap-5">
                    {assignedLessons.map((lesson) => (
                        <LessonCard key={lesson.id} lesson={lesson} onClick={() => onSelectLesson(lesson)} />
                    ))}
                </div>
            </section>

            {/* Recommended Section */}
            <section className="mb-10">
                <h3 className="text-[16px] font-bold text-[#3B3F6E] mb-5">Recommended for you</h3>
                <div className="grid grid-cols-4 gap-5">
                    {recommendedLessons.map((lesson) => (
                        <LessonCard key={lesson.id} lesson={lesson} onClick={() => onSelectLesson(lesson)} />
                    ))}
                </div>
            </section>
        </div>
    );
}

// ─── Lesson Card ───────────────────────────────────────────────────────────────
function LessonCard({ lesson, onClick }: { lesson: Lesson; onClick: () => void }) {
    const pill = subjectColors[lesson.subject] || { bg: '#E9E7E2', text: '#3B3F6E', banner: '#C8C8C8' };

    return (
        <div
            className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] transition-shadow cursor-pointer group"
            onClick={onClick}
        >
            {/* Image placeholder */}
            <div className="w-full h-[100px] bg-[#E8E5DF] group-hover:bg-[#DDD9D2] transition-colors" />

            {/* Content */}
            <div className="p-4">
                <h4 className="text-[13.5px] font-semibold text-[#2B2B2F] leading-snug mb-2">
                    {lesson.title}
                </h4>
                <span
                    className="inline-block px-2.5 py-[3px] rounded-full text-[11px] font-semibold"
                    style={{ backgroundColor: pill.bg, color: pill.text }}
                >
                    {lesson.subject}
                </span>
                <p className="text-[12px] text-graphite-40 mt-2">{lesson.duration}</p>
            </div>
        </div>
    );
}

// ─── Lessons View ──────────────────────────────────────────────────────────────
function StudentLessonsView({ onSelectLesson, currentLesson, teacherLessons, completedLessons }: { onSelectLesson: (lesson: Lesson) => void; currentLesson: Lesson | null; teacherLessons: Lesson[]; completedLessons: Lesson[] }) {
    const [completedOpen, setCompletedOpen] = useState(false);

    return (
        <div className="max-w-[820px]">
            {/* Header */}
            <h1 className="text-[32px] font-bold text-[#3B3F6E] leading-tight tracking-[-0.02em]">
                Lessons
            </h1>
            <p className="text-graphite-60 text-[15px] mt-2 mb-8">
                Your current learning steps.
            </p>

            {/* Current Lesson Hero */}
            {currentLesson && (
                <div
                    className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden mb-10 cursor-pointer hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] transition-shadow"
                    onClick={() => onSelectLesson(currentLesson)}
                >
                    <div className="flex">
                        {/* Left content */}
                        <div className="flex-1 p-6">
                            <span className="text-[12px] font-bold text-[#3B3F6E] tracking-[0.06em] uppercase">
                                {currentLesson.subject} · {currentLesson.topic}
                            </span>

                            <h2 className="text-[22px] font-bold text-[#2B2B2F] mt-2 mb-3 tracking-[-0.01em]">
                                {currentLesson.title}
                            </h2>

                            {/* Step pill */}
                            <span className="inline-block px-3 py-[4px] bg-[#E8F5E9] text-[#2D6A4F] rounded-full text-[12px] font-semibold mb-5">
                                Step 2 in progress
                            </span>

                            {/* Continue button */}
                            <div>
                                <button
                                    className="flex items-center gap-2 px-6 py-[10px] bg-[#3B3F6E] hover:bg-[#2C2F52] text-white rounded-full text-[13.5px] font-semibold transition-colors cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); onSelectLesson(currentLesson); }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                                        <path d="M3 1.5L12 7L3 12.5V1.5Z" fill="white"/>
                                    </svg>
                                    Continue
                                </button>
                            </div>
                        </div>

                        {/* Right image area */}
                        <div className="w-[220px] min-h-[200px] bg-[#2B2B2F] flex items-center justify-center relative overflow-hidden">
                            {/* Decorative math-themed overlay */}
                            <div className="absolute inset-0 opacity-20">
                                <svg viewBox="0 0 220 200" fill="none" className="w-full h-full">
                                    <text x="20" y="40" fill="white" fontSize="14" fontFamily="serif" opacity="0.5">x² + 2x = 0</text>
                                    <text x="80" y="80" fill="white" fontSize="12" fontFamily="serif" opacity="0.4">∫ f(x)dx</text>
                                    <text x="30" y="120" fill="white" fontSize="16" fontFamily="serif" opacity="0.3">Σ n=1</text>
                                    <text x="100" y="150" fill="white" fontSize="13" fontFamily="serif" opacity="0.45">π r²</text>
                                    <text x="50" y="180" fill="white" fontSize="11" fontFamily="serif" opacity="0.35">y = mx + b</text>
                                    <line x1="10" y1="90" x2="210" y2="90" stroke="white" strokeWidth="0.5" opacity="0.15"/>
                                    <line x1="110" y1="10" x2="110" y2="190" stroke="white" strokeWidth="0.5" opacity="0.15"/>
                                    <rect x="60" y="55" width="100" height="85" rx="4" stroke="white" strokeWidth="0.5" opacity="0.2"/>
                                </svg>
                            </div>
                            {/* Center icon */}
                            <svg width="40" height="40" viewBox="0 0 48 48" fill="none" className="relative z-10 opacity-40">
                                <path d="M8 8H40V40H8V8Z" stroke="white" strokeWidth="1.5" rx="4"/>
                                <line x1="14" y1="16" x2="34" y2="16" stroke="white" strokeWidth="1"/>
                                <line x1="14" y1="24" x2="34" y2="24" stroke="white" strokeWidth="1"/>
                                <line x1="14" y1="32" x2="26" y2="32" stroke="white" strokeWidth="1"/>
                            </svg>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="px-6 pb-5 pt-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[12px] text-graphite-60 font-medium">Progress</span>
                            <span className="text-[12px] text-graphite-60 font-medium">40%</span>
                        </div>
                        <div className="w-full h-[6px] bg-[#E9E7E2] rounded-full overflow-hidden">
                            <div className="h-full bg-[#3B3F6E] rounded-full transition-all duration-500" style={{ width: '40%' }} />
                        </div>
                    </div>
                </div>
            )}

            {/* From your teacher */}
            <section className="mb-10">
                <h3 className="text-[16px] font-bold text-[#3B3F6E] mb-5">From your teacher</h3>
                <div className="grid grid-cols-2 gap-5">
                    {teacherLessons.map((lesson) => (
                        <TeacherLessonCard key={lesson.id} lesson={lesson} onClick={() => onSelectLesson(lesson)} />
                    ))}
                </div>
            </section>

            {/* Completed (collapsible) */}
            <section className="border-t border-[#E9E7E2] pt-5">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setCompletedOpen(!completedOpen)}
                        className="flex items-center gap-2 cursor-pointer group"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            className={`transition-transform duration-200 ${completedOpen ? 'rotate-0' : '-rotate-90'}`}
                        >
                            <path d="M4 6L8 10L12 6" stroke="#3B3F6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-[15px] font-bold text-[#3B3F6E] group-hover:text-[#2C2F52]">Completed</span>
                    </button>
                    <a href="#" className="text-[13px] font-semibold text-[#3B3F6E] hover:text-[#2C2F52] flex items-center gap-1 transition-colors">
                        View past lessons
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </a>
                </div>

                {completedOpen && (
                    <div className="mt-4 flex flex-col gap-3 animate-fade-in">
                        {completedLessons.map((lesson) => (
                            <CompletedLessonRow
                                key={lesson.id}
                                lesson={lesson}
                                onClick={() => onSelectLesson(lesson)}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

// ─── Teacher Lesson Card ───────────────────────────────────────────────────────
function TeacherLessonCard({ lesson, onClick }: { lesson: Lesson; onClick: () => void }) {
    const colors = ['#E8D5C4', '#C9B896', '#D4CBBA', '#BFC8A0'];
    const idNum = typeof lesson.id === 'number' ? lesson.id : String(lesson.id).charCodeAt(0);
    const color = colors[idNum % colors.length];

    return (
        <div
            className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-5 flex items-center gap-4 cursor-pointer hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] transition-shadow"
            onClick={onClick}
        >
            {/* Circular icon */}
            <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: color }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect x="4" y="3" width="16" height="18" rx="2" stroke="#5C4A32" strokeWidth="1.5"/>
                    <line x1="8" y1="8" x2="16" y2="8" stroke="#5C4A32" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="8" y1="12" x2="16" y2="12" stroke="#5C4A32" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="8" y1="16" x2="13" y2="16" stroke="#5C4A32" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <h4 className="text-[14px] font-semibold text-[#2B2B2F] leading-snug">
                    {lesson.title}
                </h4>
                <p className="text-[12px] text-graphite-60 mt-0.5">{lesson.subject}</p>
            </div>

            {/* Start button */}
            <button
                className="px-5 py-[7px] border-2 border-[#3B3F6E] text-[#3B3F6E] rounded-full text-[13px] font-semibold hover:bg-[#3B3F6E] hover:text-white transition-all cursor-pointer shrink-0"
                onClick={(e) => { e.stopPropagation(); onClick(); }}
            >
                Start
            </button>
        </div>
    );
}

// ─── Completed Lesson Row ──────────────────────────────────────────────────────
function CompletedLessonRow({ lesson, onClick }: { lesson: Lesson; onClick: () => void }) {
    const dateMap: Record<number, string> = { 20: 'Apr 20', 21: 'Apr 18', 22: 'Apr 15' };

    return (
        <div
            className="flex items-center gap-4 bg-white rounded-xl border border-[#E9E7E2] px-5 py-4 cursor-pointer hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-shadow"
            onClick={onClick}
        >
            {/* Check icon */}
            <div className="w-8 h-8 rounded-full bg-[#E8F5E9] flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8.5L6.5 12L13 4" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold text-[#2B2B2F]">{lesson.title}</p>
                <p className="text-[11.5px] text-graphite-40">{lesson.subject}</p>
            </div>

            {/* Date */}
            <span className="text-[12px] text-graphite-40 shrink-0">{dateMap[lesson.id as number] || ''}</span>
        </div>
    );
}

// ─── Lesson Detail View ────────────────────────────────────────────────────────
function LessonDetailView({ lesson, onBack }: { lesson: Lesson; onBack: () => void }) {
    const [downloadOffline, setDownloadOffline] = useState(false);
    const colors = subjectColors[lesson.subject] || { bg: '#E9E7E2', text: '#3B3F6E', banner: '#C0BDD4' };

    return (
        <div className="flex flex-col h-full">
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
                {/* Banner */}
                <div className="relative w-full h-[260px]" style={{ backgroundColor: colors.banner }}>
                    {/* Back button */}
                    <button
                        onClick={onBack}
                        className="absolute top-6 left-6 z-10 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/35 transition-colors cursor-pointer"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>

                    {/* Decorative pattern */}
                    <div className="absolute inset-0 overflow-hidden opacity-15">
                        <svg viewBox="0 0 600 260" fill="none" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                            <circle cx="480" cy="60" r="120" stroke="white" strokeWidth="1"/>
                            <circle cx="480" cy="60" r="80" stroke="white" strokeWidth="0.5"/>
                            <circle cx="120" cy="200" r="100" stroke="white" strokeWidth="0.8"/>
                            <line x1="0" y1="130" x2="600" y2="130" stroke="white" strokeWidth="0.3"/>
                            <line x1="300" y1="0" x2="300" y2="260" stroke="white" strokeWidth="0.3"/>
                        </svg>
                    </div>

                    {/* Subject label centered */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-[22px] font-semibold tracking-wide">
                            {lesson.subject}
                        </span>
                    </div>
                </div>

                {/* Content area */}
                <div className="px-[48px] py-8">
                    {/* Title */}
                    <h1 className="text-[24px] font-bold text-[#2B2B2F] tracking-[-0.01em] mb-4">
                        {lesson.title}
                    </h1>

                    {/* Meta pills */}
                    <div className="flex items-center gap-3 mb-8">
                        <span
                            className="px-3 py-[5px] rounded-full text-[12px] font-semibold uppercase tracking-[0.04em]"
                            style={{ backgroundColor: colors.bg, color: colors.text }}
                        >
                            {lesson.subject}
                        </span>
                        {lesson.grade && (
                            <span className="px-3 py-[5px] rounded-full text-[12px] font-semibold uppercase tracking-[0.04em] bg-[#EEECEA] text-graphite-60">
                                {lesson.grade}
                            </span>
                        )}
                        <span className="text-[13px] text-graphite-60 font-medium">{lesson.duration}</span>
                    </div>

                    {/* What you'll learn */}
                    {lesson.objectives && lesson.objectives.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-[12px] font-bold text-[#3B3F6E] tracking-[0.08em] uppercase mb-4">
                                What you&apos;ll learn
                            </h3>
                            <ul className="flex flex-col gap-3">
                                {lesson.objectives.map((obj, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="w-[6px] h-[6px] rounded-full bg-[#3B3F6E] shrink-0 mt-[7px]" />
                                        <span className="text-[14px] text-[#2B2B2F] leading-relaxed">{obj}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Download for offline use */}
                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                            {/* Download icon */}
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-graphite-60">
                                <path d="M10 3V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                <path d="M6 10L10 14L14 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M3 15V16C3 16.5523 3.44772 17 4 17H16C16.5523 17 17 16.5523 17 16V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="text-[14px] text-[#2B2B2F] font-medium">Download for offline use</span>
                        </div>
                        {/* Toggle */}
                        <button
                            onClick={() => setDownloadOffline(!downloadOffline)}
                            className={`w-[44px] h-[24px] rounded-full transition-colors duration-200 cursor-pointer relative ${
                                downloadOffline ? 'bg-[#3B3F6E]' : 'bg-[#D5D3CE]'
                            }`}
                        >
                            <div
                                className={`absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                    downloadOffline ? 'translate-x-[22px]' : 'translate-x-[2px]'
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom action bar */}
            <div className="border-t border-[#E9E7E2] bg-[#F7F1E6] px-[48px] py-5 shrink-0">
                <LessonActionBar status={lesson.status} />
            </div>
        </div>
    );
}

// ─── Lesson Action Bar ─────────────────────────────────────────────────────────
function LessonActionBar({ status }: { status: Lesson['status'] }) {
    switch (status) {
        case 'not_started':
            return (
                <button className="w-full py-[14px] bg-[#3B3F6E] hover:bg-[#2C2F52] text-white rounded-xl text-[15px] font-semibold transition-colors cursor-pointer">
                    Start lesson
                </button>
            );
        case 'in_progress':
            return (
                <div className="flex gap-4">
                    <button className="flex-[2] py-[14px] bg-[#3B3F6E] hover:bg-[#2C2F52] text-white rounded-xl text-[15px] font-semibold transition-colors cursor-pointer">
                        Resume
                    </button>
                    <button className="flex-1 py-[14px] bg-transparent border-2 border-[#3B3F6E] text-[#3B3F6E] rounded-xl text-[15px] font-semibold hover:bg-[#3B3F6E] hover:text-white transition-all cursor-pointer">
                        Restart
                    </button>
                </div>
            );
        case 'completed':
            return (
                <button className="w-full py-[14px] bg-transparent border-2 border-[#3B3F6E] text-[#3B3F6E] rounded-xl text-[15px] font-semibold hover:bg-[#3B3F6E] hover:text-white transition-all cursor-pointer">
                    Review lesson
                </button>
            );
    }
}

// ─── Downloads Mock Data ───────────────────────────────────────────────────────
interface DownloadedLesson {
    id: number;
    title: string;
    subject: string;
    size: string;
}



// ─── Downloads View ────────────────────────────────────────────────────────────
function StudentDownloadsView() {
    const [hasDownloads, setHasDownloads] = useState(false);
    const [lessons, setLessons] = useState<DownloadedLesson[]>([]);
    const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
    const [removeTarget, setRemoveTarget] = useState<DownloadedLesson | null>(null);

    const totalSize = lessons.length * 12;

    const handleRemove = () => {
        if (removeTarget) {
            setLessons(prev => prev.filter(l => l.id !== removeTarget.id));
            setRemoveTarget(null);
            setMenuOpenId(null);
        }
    };

    if (!hasDownloads || lessons.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-96px)]">
                {/* Illustration */}
                <div className="w-[160px] h-[140px] bg-[#EEECEA] rounded-2xl flex items-center justify-center mb-6 relative">
                    <div className="w-[90px] h-[75px] bg-[#E0DDD7] rounded-xl flex items-center justify-center">
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                            <path d="M18 6V22" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M12 18L18 24L24 18" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <rect x="6" y="26" width="24" height="4" rx="1" stroke="#3B3F6E" strokeWidth="1.5"/>
                        </svg>
                    </div>
                    {/* Small dot accent */}
                    <div className="absolute bottom-6 left-1/2 translate-x-2 w-[5px] h-[5px] rounded-full bg-[#3B3F6E]" />
                </div>

                <p className="text-[14px] text-graphite-60 font-medium text-center mb-6">
                    Download lessons to access them offline.
                </p>

                <button className="px-7 py-[11px] bg-[#3B3F6E] hover:bg-[#2C2F52] text-white rounded-full text-[14px] font-semibold transition-colors cursor-pointer">
                    Browse lessons
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-[820px]">
            {/* Offline banner */}
            <div className="bg-[#FFF8E1] border border-[#F5E6A3] rounded-xl px-5 py-3 mb-6 flex items-center gap-3">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2L18 18H2L10 2Z" stroke="#B8860B" strokeWidth="1.5" strokeLinejoin="round" fill="#FFEAA7" fillOpacity="0.5"/>
                    <line x1="10" y1="8" x2="10" y2="12" stroke="#B8860B" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="10" cy="15" r="0.8" fill="#B8860B"/>
                </svg>
                <span className="text-[13px] text-[#8B6914] font-medium">
                    You&apos;re offline — downloaded lessons are available below.
                </span>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-[24px] font-bold text-[#3B3F6E] tracking-[-0.01em]">
                    Downloads
                </h1>
                <span className="text-[13px] text-graphite-60 font-medium">
                    {totalSize} MB used
                </span>
            </div>

            {/* Download list */}
            <div className="flex flex-col gap-4">
                {lessons.map((lesson) => (
                    <div
                        key={lesson.id}
                        className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] px-6 py-5 relative"
                    >
                        {/* Subject pill */}
                        <span
                            className="inline-block px-3 py-[4px] rounded-full text-[11px] font-bold uppercase tracking-[0.04em] mb-2"
                            style={{
                                backgroundColor: subjectColors[lesson.subject]?.bg || '#E9E7E2',
                                color: subjectColors[lesson.subject]?.text || '#3B3F6E',
                            }}
                        >
                            {lesson.subject}
                        </span>

                        <div className="flex items-center justify-between">
                            <h3 className="text-[15px] font-semibold text-[#2B2B2F]">
                                {lesson.title}
                            </h3>
                            <div className="flex items-center gap-3">
                                <span className="text-[12px] text-graphite-40 font-medium">{lesson.size}</span>
                                <span className="px-2.5 py-[3px] rounded-full text-[11px] font-semibold bg-[#D4EDDA] text-[#2D6A4F]">
                                    Downloaded
                                </span>
                                {/* 3-dot menu */}
                                <button
                                    onClick={() => setMenuOpenId(menuOpenId === lesson.id ? null : lesson.id)}
                                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F3F0EA] transition-colors cursor-pointer"
                                >
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <circle cx="8" cy="3" r="1.2" fill="#8A8D9F"/>
                                        <circle cx="8" cy="8" r="1.2" fill="#8A8D9F"/>
                                        <circle cx="8" cy="13" r="1.2" fill="#8A8D9F"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Dropdown menu */}
                        {menuOpenId === lesson.id && (
                            <div className="absolute right-6 top-16 bg-white rounded-xl border border-[#E9E7E2] shadow-[0_4px_16px_rgba(0,0,0,0.1)] py-2 z-20 animate-fade-in">
                                <button
                                    onClick={() => { setRemoveTarget(lesson); setMenuOpenId(null); }}
                                    className="w-full text-left px-5 py-2.5 text-[13px] text-[#C0392B] font-medium hover:bg-[#FEF5F5] transition-colors cursor-pointer"
                                >
                                    Remove download
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>



            {/* Remove confirmation modal */}
            {removeTarget && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/30 z-40"
                        onClick={() => setRemoveTarget(null)}
                    />
                    {/* Bottom sheet */}
                    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
                        <div className="bg-white rounded-t-3xl px-8 py-6 max-w-[600px] mx-auto shadow-[0_-8px_32px_rgba(0,0,0,0.12)]">
                            {/* Handle */}
                            <div className="flex justify-center mb-5">
                                <div className="w-10 h-1 rounded-full bg-[#D5D3CE]" />
                            </div>

                            <h3 className="text-[18px] font-bold text-[#2B2B2F] mb-1">
                                Remove from device?
                            </h3>
                            <p className="text-[14px] text-graphite-60 mb-6">
                                {removeTarget.title}
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleRemove}
                                    className="flex-1 py-[13px] bg-transparent border-2 border-[#E8B4B4] text-[#C0392B] rounded-full text-[14px] font-semibold hover:bg-[#FEF5F5] transition-colors cursor-pointer"
                                >
                                    Remove
                                </button>
                                <button
                                    onClick={() => setRemoveTarget(null)}
                                    className="flex-1 py-[13px] bg-transparent text-[#3B3F6E] text-[14px] font-semibold hover:bg-[#F3F0EA] rounded-full transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

interface SubjectDetail {
    name: string;
    concepts: number;
    maxConcepts: number;
    color: string;
    conceptsAttempted: number;
    conceptsUnderstood: number;
    conceptList: { name: string; understood: boolean }[];
    lessons: { name: string; progress: number; total: number; complete: boolean }[];
}

// ─── Progress View ─────────────────────────────────────────────────────────────
function StudentProgressView({ progressData }: { progressData?: any }) {
    const [hasProgress, setHasProgress] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState<SubjectDetail | null>(null);

    // Map real data if available
    const displayStats = progressData ? [
        { value: '7', label: 'days in a row' }, // Streak is currently not returned by backend
        { value: String(progressData.total_lessons_completed || progressData.total_lessons_started || 24), label: 'concepts' },
        { value: '12', label: 'breakthroughs' },
    ] : [];

    const rawSubjects = progressData?.subject_performance || progressData?.subjects || progressData;
    const displaySubjects = rawSubjects && !Array.isArray(rawSubjects) && Object.keys(rawSubjects).length > 0 ? 
        Object.entries(rawSubjects).map(([subj, perf]: [string, any]) => ({
            name: subj,
            concepts: Math.max(1, Math.round((perf.average_score || 0) / 10)),
            maxConcepts: 15,
            color: '#3B3F6E',
            conceptsAttempted: 5,
            conceptsUnderstood: Math.round(((perf.average_score || 0) / 100) * 5),
            conceptList: [
                { name: 'Basic concept', understood: (perf.average_score || 0) > 50 },
                { name: 'Advanced concept', understood: (perf.average_score || 0) > 80 },
            ],
            lessons: [
                { name: `Introduction to ${subj}`, progress: perf.lessons_completed || 1, total: 5, complete: (perf.lessons_completed || 0) >= 5 }
            ]
        })) : Array.isArray(rawSubjects) ? rawSubjects.map((perf: any) => ({
            name: perf.subject || perf.name || 'Subject',
            concepts: perf.concepts_understood || perf.concepts || 0,
            maxConcepts: perf.concepts_attempted || perf.maxConcepts || 15,
            color: perf.color || '#3B3F6E',
            conceptsAttempted: perf.concepts_attempted || perf.conceptsAttempted || 0,
            conceptsUnderstood: perf.concepts_understood || perf.conceptsUnderstood || 0,
            conceptList: perf.conceptList || [],
            lessons: perf.lessons || []
        })) : [];

    const recentActivity: any[] = Array.isArray(progressData?.recent_activity) ? progressData.recent_activity : [];

    if (!hasProgress) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-96px)]">
                <div className="relative mb-6">
                    <div className="absolute -top-3 left-8 w-[8px] h-[8px] rounded-full bg-[#E5C76B]" />
                    <div className="absolute -top-1 right-4 w-[8px] h-[8px] rounded-full bg-[#E5C76B] opacity-60" />
                    <div className="absolute bottom-4 -left-2 text-[#D5D3CE] text-[16px] font-light">+</div>
                    <div className="absolute top-6 -right-3 text-[#A9A5D1] text-[14px] font-light">✦</div>
                    <div className="absolute bottom-2 right-2 text-[#E5C76B] text-[10px]">•</div>
                    <div className="w-[140px] h-[110px] bg-[#EEECEA] rounded-xl flex items-center justify-center">
                        <svg width="80" height="70" viewBox="0 0 80 70" fill="none">
                            <rect x="15" y="8" width="50" height="54" rx="4" stroke="#C8C6C1" strokeWidth="1.5" fill="#FDFBF9"/>
                            <rect x="20" y="8" width="45" height="54" rx="3" stroke="#C8C6C1" strokeWidth="1.5" fill="white"/>
                            <line x1="28" y1="22" x2="55" y2="22" stroke="#DDD8F0" strokeWidth="1.5" strokeLinecap="round"/>
                            <line x1="28" y1="30" x2="55" y2="30" stroke="#DDD8F0" strokeWidth="1.5" strokeLinecap="round"/>
                            <line x1="28" y1="38" x2="48" y2="38" stroke="#DDD8F0" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M28 50L35 44L42 47L55 40" stroke="#A9A5D1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                </div>
                <h2 className="text-[20px] font-bold text-[#3B3F6E] mb-3 text-center">Start Your Learning Journey</h2>
                <p className="text-[14px] text-graphite-60 text-center max-w-[340px] leading-relaxed mb-6">
                    Your progress will show here as you learn. Complete lessons to track your achievements and see how far you&apos;ve come.
                </p>
                <button className="px-7 py-[11px] bg-transparent border-2 border-[#3B3F6E] text-[#3B3F6E] rounded-full text-[14px] font-semibold hover:bg-[#3B3F6E] hover:text-white transition-all cursor-pointer">
                    Start a lesson
                </button>
            </div>
        );
    }

    // Subject detail drill-down
    if (selectedSubject) {
        return <SubjectDetailView subject={selectedSubject} onBack={() => setSelectedSubject(null)} />;
    }

    return (
        <div className="max-w-[820px]">
            {/* Top stat cards */}
            <div className="grid grid-cols-3 gap-4 mb-10">
                {displayStats.map((stat) => (
                    <div key={stat.label} className="bg-transparent rounded-2xl px-6 py-5 border border-[#E9E7E2]">
                        <div className="text-[36px] font-bold text-[#3B3F6E] leading-tight mb-1">{stat.value}</div>
                        <div className="text-[13px] text-graphite-60 font-medium">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Your Subjects */}
            <section className="mb-10">
                <h3 className="text-[12px] font-bold text-[#3B3F6E] tracking-[0.08em] uppercase mb-5">Your Subjects</h3>
                <div className="flex flex-col gap-4">
                    {displaySubjects.map((subj) => {
                        const pct = (subj.concepts / subj.maxConcepts) * 100;
                        return (
                            <div
                                key={subj.name}
                                className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setSelectedSubject(subj)}
                            >
                                <span className="text-[14px] font-semibold text-[#2B2B2F] w-[120px] shrink-0">{subj.name}</span>
                                <div className="flex-1 h-[8px] bg-[#E9E7E2] rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: subj.color }} />
                                </div>
                                <span className="text-[12px] text-graphite-60 font-medium w-[80px] shrink-0 text-right">{subj.concepts} concepts</span>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Recent */}
            <section>
                <h3 className="text-[12px] font-bold text-[#3B3F6E] tracking-[0.08em] uppercase mb-5">Recent</h3>
                <div className="flex flex-col gap-0">
                    {recentActivity.map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-4 border-b border-[#F0EDE7] last:border-b-0">
                            <div className="flex items-center gap-3">
                                <div className="w-[7px] h-[7px] rounded-full bg-[#3B3F6E] shrink-0" />
                                <span className="text-[14px] text-[#2B2B2F] font-medium">{item.text}</span>
                            </div>
                            <span className="text-[12px] text-graphite-40 font-medium shrink-0 ml-4">{item.time}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

// ─── Subject Detail View ───────────────────────────────────────────────────────
function SubjectDetailView({ subject, onBack }: { subject: SubjectDetail; onBack: () => void }) {
    const hasActivity = subject.conceptList.length > 0 || subject.lessons.length > 0;

    return (
        <div className="max-w-[820px]">
            {/* Header */}
            <button onClick={onBack} className="flex items-center gap-2 mb-8 cursor-pointer group">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18L9 12L15 6" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[20px] font-bold text-[#3B3F6E] group-hover:text-[#2C2F52] transition-colors">{subject.name}</span>
            </button>

            {!hasActivity ? (
                /* Empty subject state */
                <div className="flex flex-col items-center justify-center h-[calc(100vh-240px)]">
                    <div className="w-[140px] h-[110px] bg-[#EEECEA] rounded-2xl flex items-center justify-center mb-5">
                        <svg width="60" height="50" viewBox="0 0 60 50" fill="none">
                            {/* Clipboard */}
                            <rect x="10" y="5" width="22" height="28" rx="3" stroke="#3B3F6E" strokeWidth="1.5" fill="none"/>
                            <rect x="15" y="2" width="12" height="6" rx="2" stroke="#3B3F6E" strokeWidth="1.2" fill="#EEECEA"/>
                            <line x1="15" y1="15" x2="27" y2="15" stroke="#A9A5D1" strokeWidth="1.2" strokeLinecap="round"/>
                            <line x1="15" y1="20" x2="24" y2="20" stroke="#A9A5D1" strokeWidth="1.2" strokeLinecap="round"/>
                            <line x1="15" y1="25" x2="27" y2="25" stroke="#A9A5D1" strokeWidth="1.2" strokeLinecap="round"/>
                            {/* Compass/gear */}
                            <circle cx="42" cy="22" r="10" stroke="#3B3F6E" strokeWidth="1.5" fill="none"/>
                            <circle cx="42" cy="22" r="3" stroke="#3B3F6E" strokeWidth="1.2" fill="none"/>
                            <line x1="42" y1="12" x2="42" y2="15" stroke="#3B3F6E" strokeWidth="1.2"/>
                            <line x1="42" y1="29" x2="42" y2="32" stroke="#3B3F6E" strokeWidth="1.2"/>
                            <line x1="32" y1="22" x2="35" y2="22" stroke="#3B3F6E" strokeWidth="1.2"/>
                            <line x1="49" y1="22" x2="52" y2="22" stroke="#3B3F6E" strokeWidth="1.2"/>
                        </svg>
                    </div>
                    <p className="text-[14px] text-graphite-60 font-medium">No activity in this subject yet.</p>
                </div>
            ) : (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="bg-transparent rounded-2xl px-6 py-5 border border-[#E9E7E2]">
                            <div className="text-[36px] font-bold text-[#3B3F6E] leading-tight mb-1">{subject.conceptsAttempted}</div>
                            <div className="text-[13px] text-graphite-60 font-medium">Concepts attempted</div>
                        </div>
                        <div className="bg-transparent rounded-2xl px-6 py-5 border border-[#E9E7E2]">
                            <div className="text-[36px] font-bold text-[#3B3F6E] leading-tight mb-1">{subject.conceptsUnderstood}</div>
                            <div className="text-[13px] text-graphite-60 font-medium">Concepts understood</div>
                        </div>
                    </div>

                    {/* Concepts */}
                    {subject.conceptList.length > 0 && (
                        <section className="mb-10">
                            <h3 className="text-[12px] font-bold text-[#3B3F6E] tracking-[0.08em] uppercase mb-5">Concepts</h3>
                            <div className="flex flex-col">
                                {subject.conceptList.map((concept) => (
                                    <div key={concept.name} className="flex items-center justify-between py-4 border-b border-[#F0EDE7] last:border-b-0">
                                        <span className="text-[14px] text-[#2B2B2F] font-medium">{concept.name}</span>
                                        {concept.understood ? (
                                            <div className="w-[22px] h-[22px] rounded-full bg-[#4CAF50] flex items-center justify-center">
                                                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                                                    <path d="M3 7L6 10L11 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </div>
                                        ) : (
                                            <div className="w-[22px] h-[22px] rounded-full border-2 border-[#D5D3CE]" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Lessons */}
                    {subject.lessons.length > 0 && (
                        <section>
                            <h3 className="text-[12px] font-bold text-[#3B3F6E] tracking-[0.08em] uppercase mb-5">Lessons</h3>
                            <div className="flex flex-col gap-4">
                                {subject.lessons.map((lesson) => {
                                    const pct = (lesson.progress / lesson.total) * 100;
                                    return (
                                        <div key={lesson.name} className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] px-5 py-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="shrink-0 opacity-50">
                                                    <rect x="3" y="2" width="14" height="16" rx="2" stroke="#3B3F6E" strokeWidth="1.5"/>
                                                    <line x1="7" y1="6" x2="13" y2="6" stroke="#3B3F6E" strokeWidth="1" strokeLinecap="round"/>
                                                    <line x1="7" y1="10" x2="13" y2="10" stroke="#3B3F6E" strokeWidth="1" strokeLinecap="round"/>
                                                </svg>
                                                <span className="text-[14px] font-semibold text-[#2B2B2F] flex-1">{lesson.name}</span>
                                                <span className="text-[12px] text-graphite-60 font-medium shrink-0">
                                                    {lesson.complete ? (
                                                        <span className="flex items-center gap-1">
                                                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                                                                <path d="M3 7L6 10L11 4" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                            </svg>
                                                            Complete
                                                        </span>
                                                    ) : (
                                                        `${lesson.progress}/${lesson.total} activities`
                                                    )}
                                                </span>
                                            </div>
                                            <div className="w-full h-[5px] bg-[#E9E7E2] rounded-full overflow-hidden">
                                                <div className="h-full bg-[#3B3F6E] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}

// ─── Profile Config Data ─────────────────────────────────────────────────────────
function StudentConnectView({ profile }: { profile?: any }) {
    const [classCode, setClassCode] = useState('');
    const [copied, setCopied] = useState(false);

    const nevoId = profile?.nevo_id || 'NEVO-XXXX';

    const handleCopy = () => {
        navigator.clipboard?.writeText(nevoId).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-[820px]">
            {/* Header */}
            <h1 className="text-[32px] font-bold text-[#3B3F6E] leading-tight tracking-[-0.02em]">
                Connect
            </h1>
            <p className="text-graphite-60 text-[15px] mt-2 mb-8">
                Your learning connections.
            </p>

            {/* Nevo ID Card */}
            <div className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6 mb-8 flex items-start justify-between">
                <div>
                    <span className="text-[11px] font-bold text-[#3B3F6E] tracking-[0.08em] uppercase">Your Nevo ID</span>
                    <h2 className="text-[28px] font-bold text-[#2B2B2F] tracking-[-0.01em] mt-1 mb-4">{nevoId}</h2>
                    <div className="flex items-center gap-3 mb-3">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-4 py-[7px] border-2 border-[#E9E7E2] rounded-full text-[12px] font-semibold text-[#3B3F6E] bg-parchment transition-colors cursor-pointer"
                        >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="#3B3F6E" strokeWidth="1.3"/>
                                <path d="M3 11V3C3 2.44772 3.44772 2 4 2H12" stroke="#3B3F6E" strokeWidth="1.3" strokeLinecap="round"/>
                            </svg>
                            {copied ? 'Copied!' : 'Copy ID'}
                        </button>
                        <button className="flex items-center gap-2 px-4 py-[7px] border-2 border-[#E9E7E2] rounded-full text-[12px] font-semibold text-[#3B3F6E] bg-parchment transition-colors cursor-pointer">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <rect x="2" y="2" width="5" height="5" rx="0.5" stroke="#3B3F6E" strokeWidth="1.2"/>
                                <rect x="9" y="2" width="5" height="5" rx="0.5" stroke="#3B3F6E" strokeWidth="1.2"/>
                                <rect x="2" y="9" width="5" height="5" rx="0.5" stroke="#3B3F6E" strokeWidth="1.2"/>
                                <rect x="9" y="9" width="5" height="5" rx="0.5" stroke="#3B3F6E" strokeWidth="1.2"/>
                            </svg>
                            Show QR
                        </button>
                    </div>
                    <p className="text-[12px] text-graphite-60">Use this to log in or connect with a teacher.</p>
                </div>
                {/* Phone illustration */}
                <div className="w-[100px] h-[100px] bg-[#EEECEA] rounded-2xl flex items-center justify-center shrink-0 ml-6">
                    <svg width="44" height="56" viewBox="0 0 44 56" fill="none">
                        <rect x="4" y="2" width="36" height="52" rx="6" stroke="#3B3F6E" strokeWidth="1.5" fill="white"/>
                        <rect x="10" y="12" width="24" height="28" rx="2" stroke="#A9A5D1" strokeWidth="1" fill="#EEECEA"/>
                        <circle cx="22" cy="48" r="2" stroke="#3B3F6E" strokeWidth="1"/>
                        <rect x="16" y="18" width="12" height="12" rx="1" stroke="#3B3F6E" strokeWidth="0.8"/>
                        <rect x="18" y="20" width="3" height="3" fill="#3B3F6E" opacity="0.4"/>
                        <rect x="23" y="20" width="3" height="3" fill="#3B3F6E" opacity="0.4"/>
                        <rect x="18" y="25" width="3" height="3" fill="#3B3F6E" opacity="0.4"/>
                        <rect x="23" y="25" width="3" height="3" fill="#3B3F6E" opacity="0.4"/>
                    </svg>
                </div>
            </div>

            {/* Add your teacher */}
            <h3 className="text-[18px] font-bold text-[#2B2B2F] mb-5">Add your teacher</h3>

            {/* Scan QR Code */}
            <div className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] px-6 py-5 flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#EEECEA] rounded-xl flex items-center justify-center shrink-0">
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <rect x="2" y="2" width="7" height="7" rx="1" stroke="#3B3F6E" strokeWidth="1.3"/>
                        <rect x="13" y="2" width="7" height="7" rx="1" stroke="#3B3F6E" strokeWidth="1.3"/>
                        <rect x="2" y="13" width="7" height="7" rx="1" stroke="#3B3F6E" strokeWidth="1.3"/>
                        <rect x="14" y="14" width="5" height="5" rx="0.5" stroke="#3B3F6E" strokeWidth="1"/>
                    </svg>
                </div>
                <div className="flex-1">
                    <h4 className="text-[14px] font-semibold text-[#2B2B2F]">Scan QR Code</h4>
                    <p className="text-[12px] text-graphite-60">Use your camera to connect</p>
                </div>
                <button className="px-5 py-[9px] bg-[#3B3F6E] hover:bg-[#2C2F52] text-white rounded-full text-[13px] font-semibold transition-colors cursor-pointer">
                    Open Scanner
                </button>
            </div>

            {/* Enter Class Code */}
            <div className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] px-6 py-5 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#EEECEA] rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-[13px] font-bold text-[#3B3F6E]">ABC</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-[14px] font-semibold text-[#2B2B2F] mb-2">Enter Class Code</h4>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={classCode}
                                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                                placeholder="e.g., NEVO-CLASS-204"
                                className="flex-1 px-4 py-[8px] bg-[#F7F1E6] border border-[#E9E7E2] rounded-lg text-[13px] text-[#2B2B2F] placeholder:text-graphite-40 outline-none focus:border-[#3B3F6E] transition-colors"
                            />
                            <button className="flex items-center gap-1 px-5 py-[8px] border-2 border-[#3B3F6E] text-[#3B3F6E] rounded-full text-[13px] font-semibold hover:bg-[#3B3F6E] hover:text-white transition-all cursor-pointer shrink-0">
                                Connect
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                    <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pending and Connected */}
            <div className="grid grid-cols-2 gap-6">
                {/* Pending */}
                <div>
                    <h4 className="text-[15px] font-bold text-[#2B2B2F] mb-4">Pending</h4>
                    <div className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] px-6 py-8 flex flex-col items-center justify-center">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="mb-3 opacity-40">
                            <rect x="4" y="8" width="24" height="16" rx="3" stroke="#8A8D9F" strokeWidth="1.5"/>
                            <path d="M4 11L16 19L28 11" stroke="#8A8D9F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <p className="text-[13px] text-graphite-40 font-medium">No requests yet.</p>
                    </div>
                </div>

                {/* Connected */}
                <div>
                    <h4 className="text-[15px] font-bold text-[#2B2B2F] mb-4">Connected</h4>
                    {profile?.connections?.length > 0 ? (
                        <div className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
                            {profile.connections.map((conn: any) => (
                                <div key={conn.id} className="flex items-center gap-3 px-5 py-4 border-b border-[#F0EDE7] last:border-b-0">
                                    <div className="w-10 h-10 rounded-full bg-[#E8D5C4] flex items-center justify-center text-[12px] font-bold text-[#5C4A32] shrink-0">
                                        {conn.teacher_name ? conn.teacher_name.substring(0, 2).toUpperCase() : 'T'}
                                    </div>
                                    <div>
                                        <p className="text-[13.5px] font-semibold text-[#2B2B2F]">{conn.teacher_name || 'Teacher'}</p>
                                        <p className="text-[11.5px] text-graphite-40">{conn.subject || 'Subject'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] px-6 py-8 flex flex-col items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="mb-3 opacity-40">
                                <rect x="4" y="8" width="24" height="16" rx="3" stroke="#8A8D9F" strokeWidth="1.5"/>
                                <path d="M4 11L16 19L28 11" stroke="#8A8D9F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <p className="text-[13px] text-graphite-40 font-medium">No connected teachers yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}



interface PreferenceCategory {
    key: string;
    label: string;
    options: string[];
    selected: string[];
}

const defaultPreferences: PreferenceCategory[] = [
    { key: 'learningPreference', label: 'Learning Preference', options: ['Watching and looking', 'Listening to explanations', 'Doing with hands', 'Reading on my own'], selected: ['Watching and looking'] },
    { key: 'whatHelps', label: 'What Helps You Understand', options: ['Pictures and diagrams', 'Step-by-step instructions', 'Examples and stories', 'Trying it myself'], selected: ['Pictures and diagrams'] },
    { key: 'focusDuration', label: 'Focus Duration', options: ['About 5 minutes', 'About 10 minutes', 'About 15 minutes or more'], selected: ['About 10 minutes'] },
    { key: 'whenHard', label: 'When Something Feels Hard', options: ['Take a break', 'Keep trying', 'Ask for help'], selected: ['Ask for help'] },
    { key: 'motivation', label: 'Motivation', options: ['Encouragement', 'Rewards', 'Switch activities'], selected: ['Encouragement'] },
    { key: 'challengeLevel', label: 'Challenge Level', options: ['Easy and straightforward', 'A little challenging', 'Really hard'], selected: ['A little challenging'] },
    { key: 'learningEnvironment', label: 'Learning Environment', options: ['Quiet and calm', 'Visual and colorful', 'Moving and touching'], selected: ['Quiet and calm'] },
];

// ─── Profile View ──────────────────────────────────────────────────────────────
function StudentProfileView({ user, profile, onLogout }: { user?: any; profile?: any; onLogout: () => Promise<void> }) {
    const [settings, setSettings] = useState({
        adaptAutomatically: true,
        cameraForLearningSignals: false,
        voiceGuidance: true,
        notifications: false,
    });
    const [showLogout, setShowLogout] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);
    const [idCopied, setIdCopied] = useState(false);

    // Provide fallbacks if backend doesn't have it
    const displayName = user?.name || profile?.first_name || profile?.name || '';
    const initials = displayName ? displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '';
    const schoolObj = profile?.school || user?.school || {};
    const classObj = profile?.class || user?.class || {};
    const schoolName = schoolObj.school_name || schoolObj.name || profile?.school_name || user?.school_name || 'Greenfield Academy';
    const gradeLevel = classObj.class_name || classObj.name || profile?.class_name || profile?.grade_level || user?.class_name || 'JSS 2';
    const nevoId = profile?.nevo_id || profile?.student_id || user?.nevoId || 'NEVO-XXXX';
    const learningProfile = profile?.learning_profile || profile || null;
    
    // Convert backend learning_profile to UI mapping
    const learningStyle = learningProfile?.learning_modality || learningProfile?.learningStyle || 'Visual';
    const focusTime = learningProfile?.focus_duration ? `${learningProfile.focus_duration} min` : (learningProfile?.focusTime || '15 mins');
    const challengeLevel = learningProfile?.challenge_pref || learningProfile?.challengeLevel || 'Moderate';

    const handleCopyId = () => {
        navigator.clipboard?.writeText(nevoId).catch(() => {});
        setIdCopied(true);
        setTimeout(() => setIdCopied(false), 2000);
    };

    const toggleSetting = async (key: keyof typeof settings) => {
        const newValue = !settings[key];
        setSettings(prev => ({ ...prev, [key]: newValue }));
        
        try {
            await updateStudentSettings({ [key]: newValue });
        } catch (err) {
            console.error("Failed to update setting", err);
            // Revert on error
            setSettings(prev => ({ ...prev, [key]: !newValue }));
        }
    };

    if (showPreferences) {
        return <EditPreferencesView onBack={() => setShowPreferences(false)} />;
    }

    return (
        <div className="max-w-[820px]">
            {/* Profile header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-[56px] h-[56px] rounded-full bg-[#3B3F6E] flex items-center justify-center text-white text-[18px] font-bold shrink-0">
                    {initials}
                </div>
                <div>
                    <h1 className="text-[20px] font-bold text-[#2B2B2F]">{displayName}</h1>
                    <p className="text-[13px] text-graphite-60">{schoolName} · {gradeLevel}</p>
                    <button className="text-[12px] text-[#3B3F6E] font-semibold hover:text-[#2C2F52] transition-colors cursor-pointer mt-0.5">
                        Edit profile
                    </button>
                </div>
            </div>

            {/* How You Learn */}
            <section className="mb-8">
                <h3 className="text-[12px] font-bold text-[#3B3F6E] tracking-[0.08em] uppercase mb-4">How You Learn</h3>
                <div className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EDE7]">
                        <span className="text-[14px] text-[#2B2B2F] font-medium">Learning style</span>
                        <span className="flex items-center gap-2 text-[14px] font-semibold text-[#3B3F6E]">
                            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                                <circle cx="9" cy="9" r="7" stroke="#3B3F6E" strokeWidth="1.4"/>
                                <circle cx="9" cy="9" r="3" fill="#3B3F6E"/>
                            </svg>
                            {learningStyle}
                        </span>
                    </div>
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EDE7]">
                        <span className="text-[14px] text-[#2B2B2F] font-medium">Focus time</span>
                        <span className="text-[14px] font-semibold text-[#3B3F6E]">{focusTime}</span>
                    </div>
                    <div className="flex items-center justify-between px-6 py-4">
                        <span className="text-[14px] text-[#2B2B2F] font-medium">Challenge level</span>
                        <span className="text-[14px] font-semibold text-[#3B3F6E]">{challengeLevel}</span>
                    </div>
                </div>
                <div className="flex justify-end mt-2">
                    <button
                        onClick={() => setShowPreferences(true)}
                        className="text-[12px] text-[#3B3F6E] font-semibold hover:text-[#2C2F52] transition-colors cursor-pointer"
                    >
                        Edit preferences
                    </button>
                </div>
            </section>

            {/* Settings */}
            <section className="mb-8">
                <h3 className="text-[12px] font-bold text-[#3B3F6E] tracking-[0.08em] uppercase mb-4">Settings</h3>
                <div className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
                    {[
                        { key: 'adaptAutomatically' as const, label: 'Adapt automatically' },
                        { key: 'cameraForLearningSignals' as const, label: 'Camera for learning signals' },
                        { key: 'voiceGuidance' as const, label: 'Voice guidance' },
                        { key: 'notifications' as const, label: 'Notifications' },
                    ].map((item, i, arr) => (
                        <div key={item.key} className={`flex items-center justify-between px-6 py-4 ${i < arr.length - 1 ? 'border-b border-[#F0EDE7]' : ''}`}>
                            <span className="text-[14px] text-[#2B2B2F] font-medium">{item.label}</span>
                            <button
                                onClick={() => toggleSetting(item.key)}
                                className={`w-[44px] h-[24px] rounded-full transition-colors duration-200 cursor-pointer relative ${
                                    settings[item.key] ? 'bg-[#3B3F6E]' : 'bg-[#D5D3CE]'
                                }`}
                            >
                                <div className={`absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                    settings[item.key] ? 'translate-x-[22px]' : 'translate-x-[2px]'
                                }`} />
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Unique ID */}
            <div className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] px-6 py-4 flex items-center justify-between mb-6">
                <span className="text-[14px] text-[#2B2B2F] font-medium">Unique ID</span>
                <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-[#3B3F6E]">{nevoId}</span>
                    <button
                        onClick={handleCopyId}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F3F0EA] transition-colors cursor-pointer"
                        title={idCopied ? 'Copied!' : 'Copy ID'}
                    >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="#3B3F6E" strokeWidth="1.3"/>
                            <path d="M3 11V3C3 2.44772 3.44772 2 4 2H12" stroke="#3B3F6E" strokeWidth="1.3" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Log out */}
            <div className="flex justify-center">
                <button
                    onClick={() => setShowLogout(true)}
                    className="text-[14px] font-semibold text-[#C0392B] hover:text-[#A93226] transition-colors cursor-pointer"
                >
                    Log out
                </button>
            </div>

            {/* Logout confirmation modal */}
            {showLogout && (
                <>
                    <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowLogout(false)} />
                    <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
                        <div className="bg-[#FDF8F0] rounded-b-3xl px-8 py-6 max-w-[600px] mx-auto shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                            <div className="flex justify-center mb-5">
                                <div className="w-10 h-1 rounded-full bg-[#D5D3CE]" />
                            </div>
                            <h3 className="text-[18px] font-bold text-[#2B2B2F] mb-1">Log out of Nevo?</h3>
                            <p className="text-[14px] text-graphite-60 mb-6">Make sure you&apos;ve saved your Nevo ID.</p>
                            <button
                                onClick={onLogout}
                                className="w-full py-[13px] bg-transparent border-2 border-[#E8B4B4] text-[#C0392B] rounded-full text-[14px] font-semibold hover:bg-[#FEF5F5] transition-colors cursor-pointer mb-3"
                            >
                                Log out
                            </button>
                            <button
                                onClick={() => setShowLogout(false)}
                                className="w-full py-[10px] text-[14px] font-semibold text-graphite-60 hover:text-[#2B2B2F] transition-colors cursor-pointer text-center"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Edit Preferences View ─────────────────────────────────────────────────────
function EditPreferencesView({ onBack }: { onBack: () => void }) {
    const [preferences, setPreferences] = useState<PreferenceCategory[]>(
        defaultPreferences.map(p => ({ ...p, selected: [...p.selected] }))
    );
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const toggleOption = (categoryKey: string, option: string) => {
        setPreferences(prev =>
            prev.map(cat => {
                if (cat.key !== categoryKey) return cat;
                const isSelected = cat.selected.includes(option);
                return {
                    ...cat,
                    selected: isSelected
                        ? cat.selected.filter(s => s !== option)
                        : [...cat.selected, option],
                };
            })
        );
        setHasChanges(true);
    };

    const handleBack = () => {
        if (hasChanges) {
            setShowSaveModal(true);
        } else {
            onBack();
        }
    };

    return (
        <div className="max-w-[820px]">
            {/* Back button */}
            <button onClick={handleBack} className="flex items-center gap-2 mb-6 cursor-pointer group">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18L9 12L15 6" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>

            {/* Title */}
            <h2 className="text-[18px] font-bold text-[#3B3F6E] text-center mb-8">Your learning style</h2>

            {/* Preference categories */}
            <div className="flex flex-col gap-7">
                {preferences.map((cat) => (
                    <div key={cat.key}>
                        <h4 className="text-[11px] font-bold text-[#3B3F6E] tracking-[0.08em] uppercase mb-3">{cat.label}</h4>
                        <div className="flex flex-wrap gap-2">
                            {cat.options.map((option) => {
                                const isActive = cat.selected.includes(option);
                                return (
                                    <button
                                        key={option}
                                        onClick={() => toggleOption(cat.key, option)}
                                        className={`px-4 py-[8px] rounded-full text-[13px] font-medium border-2 transition-all cursor-pointer ${
                                            isActive
                                                ? 'bg-[#3B3F6E] text-white border-[#3B3F6E]'
                                                : 'bg-white text-[#2B2B2F] border-[#E9E7E2] hover:border-[#3B3F6E]'
                                        }`}
                                    >
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Save button */}
            <button className="w-full mt-8 py-[14px] bg-[#3B3F6E] hover:bg-[#2C2F52] text-white rounded-xl text-[15px] font-semibold transition-colors cursor-pointer">
                Save preferences
            </button>
            <p className="text-[12px] text-graphite-40 text-center mt-3">
                Saving your preferences won&apos;t affect lessons already in progress.
            </p>

            {/* Save changes modal */}
            {showSaveModal && (
                <>
                    <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowSaveModal(false)} />
                    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
                        <div className="bg-white rounded-t-3xl px-8 py-6 max-w-[600px] mx-auto shadow-[0_-8px_32px_rgba(0,0,0,0.12)]">
                            <div className="flex justify-center mb-5">
                                <div className="w-10 h-1 rounded-full bg-[#D5D3CE]" />
                            </div>
                            <h3 className="text-[18px] font-bold text-[#2B2B2F] mb-5 text-center">Save your changes?</h3>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => { setShowSaveModal(false); onBack(); }}
                                    className="flex-1 py-[13px] bg-[#3B3F6E] hover:bg-[#2C2F52] text-white rounded-full text-[14px] font-semibold transition-colors cursor-pointer"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => { setShowSaveModal(false); onBack(); }}
                                    className="flex-1 py-[13px] bg-transparent border-2 border-[#E9E7E2] text-[#3B3F6E] rounded-full text-[14px] font-semibold hover:bg-[#F3F0EA] transition-colors cursor-pointer"
                                >
                                    Discard
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
