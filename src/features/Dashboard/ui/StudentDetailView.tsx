'use client';

import { useState, useEffect } from 'react';
import { getTeacherDashboard, updateStudentNote } from '../api/teacher';

/* ─── Types ─── */
interface LessonProgress {
    title: string;
    progress: number; // 0–100
    date: string;
}

interface LearningSignal {
    type: 'warning' | 'info' | 'success';
    text: string;
}

interface LearningProfile {
    learningStyle: string | null;
    focusTime: string | null;
    challengeLevel: string | null;
}

export interface StudentDetail {
    id: number;
    initials: string;
    avatarBg: string;
    name: string;
    classInfo: string;
    subject: string;
    lastActive: string;
    lessonsInProgress: LessonProgress[];
    learningProfile: LearningProfile;
    signals: LearningSignal[];
}

/* ─── Main Component ─── */
export function StudentDetailView({
    studentId,
    studentData,
    onBack,
}: {
    studentId: number | string;
    studentData?: any;
    onBack: () => void;
}) {
    const [isLoading, setIsLoading] = useState(true);
    const [note, setNote] = useState('');
    const [showRecommend, setShowRecommend] = useState(false);
    const [showFlag, setShowFlag] = useState(false);
    const [showFlagSuccess, setShowFlagSuccess] = useState(false);
    const [successToast, setSuccessToast] = useState<string | null>(null);

    const [recommendLessons, setRecommendLessons] = useState<{ title: string; tag: string; tagBg: string }[]>([]);
    const name = studentData?.name || `${studentData?.first_name || ''} ${studentData?.last_name || ''}`.trim() || 'Student';
    const initials = name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part: string) => part[0]?.toUpperCase() || '')
        .join('') || 'ST';
    const classInfo = studentData?.class_name || studentData?.class || studentData?.classInfo || 'Class';
    const subject = studentData?.subject || studentData?.primary_subject || '';
    const lessonsInProgress: LessonProgress[] = Array.isArray(studentData?.lessons_in_progress)
        ? studentData.lessons_in_progress.map((l: any, idx: number) => ({
              title: l.title || l.name || `Lesson ${idx + 1}`,
              progress: Number(l.progress ?? l.completion_percent ?? 0),
              date: l.date || l.updated_at || 'Recently',
          }))
        : [];
    const signals: LearningSignal[] = Array.isArray(studentData?.signals)
        ? studentData.signals
              .map((s: any) => ({
                  type: s.type === 'warning' || s.type === 'success' ? s.type : 'info',
                  text: s.text || s.message || '',
              }))
              .filter((s: LearningSignal) => s.text.length > 0)
        : [];
    const learningProfile: LearningProfile = {
        learningStyle: studentData?.learning_profile?.learning_style || null,
        focusTime: studentData?.learning_profile?.focus_time || null,
        challengeLevel: studentData?.learning_profile?.challenge_level || null,
    };
    const student: StudentDetail = {
        id: Number(studentId),
        initials,
        avatarBg: '#3B3F6E',
        name,
        classInfo,
        subject,
        lastActive: studentData?.last_active || studentData?.last_seen || 'Recently',
        lessonsInProgress,
        learningProfile,
        signals,
    };
    const firstName = student.name.split(' ')[0];
    const hasLessons = student.lessonsInProgress.length > 0;
    const hasSignals = student.signals.length > 0;
    const hasProfile = student.learningProfile.learningStyle !== null;

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 300);
        return () => clearTimeout(timer);
    }, [studentId]);

    useEffect(() => {
        (async () => {
            const res = await getTeacherDashboard();
            const d = 'data' in res ? res.data : null;
            const rawLessons = Array.isArray(d?.lessons) ? d.lessons : Array.isArray(d) ? d : [];
            const mapped = rawLessons.slice(0, 8).map((l: any) => ({
                title: l.title || l.name || 'Lesson',
                tag: l.subject || l.topic || 'General',
                tagBg: '#E8E4DC',
            }));
            setRecommendLessons(mapped);
        })();
    }, []);

    // Auto-dismiss toast
    useEffect(() => {
        if (!successToast) return;
        const timer = setTimeout(() => setSuccessToast(null), 4000);
        return () => clearTimeout(timer);
    }, [successToast]);

    const handleRecommendSend = (lessonTitle: string) => {
        setShowRecommend(false);
        setSuccessToast(`Lesson recommended to ${student.name}`);
    };

    const handleMessage = () => {
        setSuccessToast(`Message thread opened for ${student.name}`);
    };

    const handleFlagSubmit = () => {
        setShowFlag(false);
        setShowFlagSuccess(true);
    };

    const handleNoteBlur = async () => {
        if (!note.trim()) return;
        await updateStudentNote(String(studentId), note.trim());
    };

    if (isLoading) return <DetailSkeleton onBack={onBack} />;

    return (
        <div className="flex flex-col h-full w-full max-w-[900px] pb-12">
            {/* Success Toast */}
            {successToast && (
                <div className="bg-[#3B3F6E] text-white text-[13px] font-medium py-3 px-5 rounded-xl mb-4 flex items-center gap-2 animate-fade-in">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.3" />
                        <path d="M5 8L7 10L11 6" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {successToast}
                </div>
            )}

            {/* Back nav */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-[14px] text-graphite-60 font-medium mb-6 hover:text-[#3B3F6E] transition-colors cursor-pointer w-fit"
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M10 3L5 8L10 13" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Students
            </button>

            {/* Student Header */}
            <div className="flex items-center gap-4 mb-5">
                <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white text-[16px] font-bold ring-2 ring-offset-2 shrink-0"
                    style={{ backgroundColor: student.avatarBg, '--tw-ring-color': student.avatarBg } as React.CSSProperties}
                >
                    {student.initials}
                </div>
                <div>
                    <h2 className="text-[18px] font-semibold text-[#2B2B2F] leading-snug">{student.name}</h2>
                    <p className="text-[13px] text-graphite-60">
                        {student.classInfo} {student.subject}
                    </p>
                    <p className="text-[12px] text-graphite-40">Last active: {student.lastActive}</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-8">
                <ActionButton icon={<MessageIcon />} label="Message" onClick={handleMessage} />
                <ActionButton
                    icon={<PlusIcon />}
                    label="Recommend lesson"
                    onClick={() => setShowRecommend(true)}
                />
                <ActionButton icon={<FlagIcon />} label="Flag for support" variant="warning" onClick={() => setShowFlag(true)} />
            </div>

            {/* IN PROGRESS */}
            <Section title="IN PROGRESS">
                {hasLessons ? (
                    <div className="flex flex-col gap-3">
                        {student.lessonsInProgress.map((lesson) => (
                            <div
                                key={lesson.title}
                                className="bg-white rounded-xl border border-[#E9E7E2] px-5 py-4"
                            >
                                <div className="flex justify-between items-center mb-2.5">
                                    <span className="text-[13.5px] font-semibold text-[#2B2B2F]">{lesson.title}</span>
                                    <span className="text-[12px] text-graphite-40">{lesson.date}</span>
                                </div>
                                <div className="w-full h-[5px] bg-[#EEECEA] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#3B3F6E] rounded-full transition-all"
                                        style={{ width: `${lesson.progress}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptySection
                        illustration={<BookIllustration />}
                        text="No lessons started yet"
                    />
                )}
            </Section>

            {/* HOW [NAME] LEARNS */}
            <Section title={`HOW ${firstName.toUpperCase()} LEARNS`}>
                <div className="bg-white rounded-xl border border-[#E9E7E2] overflow-hidden">
                    <ProfileRow label="Learning style" value={student.learningProfile.learningStyle} />
                    <ProfileRow label="Focus time" value={student.learningProfile.focusTime} border />
                    <ProfileRow label="Challenge level" value={student.learningProfile.challengeLevel} border />
                </div>
            </Section>

            {/* LEARNING SIGNALS */}
            <Section title="LEARNING SIGNALS">
                {hasSignals ? (
                    <div className="flex flex-col gap-3">
                        {student.signals.map((signal, i) => (
                            <div key={i} className="bg-white rounded-xl border border-[#E9E7E2] px-5 py-4 flex items-center gap-3">
                                <span className={`w-[8px] h-[8px] rounded-full shrink-0 ${
                                    signal.type === 'warning' ? 'bg-[#D97706]' :
                                    signal.type === 'info' ? 'bg-[#6B7FE0]' :
                                    'bg-[#16A34A]'
                                }`} />
                                <span className="text-[13.5px] text-[#2B2B2F]">{signal.text}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptySection
                        illustration={<ClipboardIllustration />}
                        text="Not enough data yet"
                        subtext={`Check back after ${firstName} completes a few lessons`}
                    />
                )}
            </Section>

            {/* YOUR NOTES */}
            <Section title="YOUR NOTES">
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onBlur={handleNoteBlur}
                    placeholder="Add a private note about this student..."
                    className="w-full bg-white border border-[#E9E7E2] rounded-xl px-5 py-4 text-[13.5px] text-[#2B2B2F] placeholder-graphite-40 outline-none focus:border-[#3B3F6E] transition-colors resize-none min-h-[80px]"
                />
            </Section>

            {/* Recommend Lesson Bottom Sheet */}
            {showRecommend && (
                <RecommendSheet
                    studentName={student.name}
                    lessons={recommendLessons}
                    onClose={() => setShowRecommend(false)}
                    onSend={handleRecommendSend}
                />
            )}

            {/* Flag Support Bottom Sheet */}
            {showFlag && (
                <FlagSupportSheet
                    studentName={student.name}
                    onClose={() => setShowFlag(false)}
                    onSubmit={handleFlagSubmit}
                />
            )}

            {/* Flag Success Modal */}
            {showFlagSuccess && (
                <FlagSuccessModal onClose={() => setShowFlagSuccess(false)} />
            )}
        </div>
    );
}

/* ─── Section Wrapper ─── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="mb-8">
            <h3 className="text-[11px] font-bold text-[#3B3F6E] tracking-wider uppercase mb-3">{title}</h3>
            {children}
        </section>
    );
}

/* ─── Profile Row ─── */
function ProfileRow({ label, value, border }: { label: string; value: string | null; border?: boolean }) {
    return (
        <div className={`flex justify-between items-center px-5 py-3.5 ${border ? 'border-t border-[#EEECEA]' : ''}`}>
            <span className="text-[13.5px] text-graphite-60">{label}</span>
            <span className={`text-[13.5px] font-semibold ${value ? 'text-[#3B3F6E]' : 'text-graphite-40'}`}>
                {value || 'Not set yet'}
            </span>
        </div>
    );
}

/* ─── Empty Section ─── */
function EmptySection({ illustration, text, subtext }: { illustration: React.ReactNode; text: string; subtext?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-10">
            <div className="mb-3">{illustration}</div>
            <p className="text-[13.5px] text-graphite-40">{text}</p>
            {subtext && <p className="text-[12px] text-graphite-40 mt-1">{subtext}</p>}
        </div>
    );
}

/* ─── Action Button ─── */
function ActionButton({
    icon,
    label,
    variant = 'default',
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    variant?: 'default' | 'warning';
    onClick?: () => void;
}) {
    const styles = variant === 'warning'
        ? 'border-[#F59E0B]/40 text-[#D97706] hover:bg-[#FEF3C7]'
        : 'border-[#3B3F6E]/30 text-[#3B3F6E] hover:bg-indigo-5';

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-[12.5px] font-semibold transition-all cursor-pointer ${styles}`}
        >
            {icon}
            {label}
        </button>
    );
}

/* ─── Recommend Lesson Bottom Sheet ─── */
function RecommendSheet({
    studentName,
    lessons,
    onClose,
    onSend,
}: {
    studentName: string;
    lessons: { title: string; tag: string; tagBg: string }[];
    onClose: () => void;
    onSend: (lessonTitle: string) => void;
}) {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string | null>(null);
    const [message, setMessage] = useState('');

    const filtered = lessons.filter(l =>
        l.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative w-full max-w-[540px] bg-[#F7F1E6] rounded-t-3xl px-6 pt-4 pb-6 animate-slide-up max-h-[85vh] flex flex-col">
                {/* Drag handle */}
                <div className="flex justify-center mb-4">
                    <div className="w-10 h-1 rounded-full bg-graphite-40/40" />
                </div>

                <h3 className="text-[17px] font-semibold text-[#3B3F6E] mb-0.5">Recommend a lesson</h3>
                <p className="text-[13px] text-graphite-60 mb-4">for {studentName}</p>

                {/* Search */}
                <div className="relative mb-4">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2">
                        <SearchIcon />
                    </span>
                    <input
                        type="text"
                        placeholder="Search your lesson library"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E0DDD8] bg-white text-[13px] outline-none focus:border-[#3B3F6E] text-[#111111] font-medium placeholder-graphite-40 transition-colors"
                    />
                </div>

                {/* Lesson List */}
                <div className="flex-1 overflow-y-auto mb-4 min-h-0">
                    {filtered.map((lesson) => (
                        <button
                            key={lesson.title}
                            onClick={() => setSelected(selected === lesson.title ? null : lesson.title)}
                            className={`w-full flex items-center justify-between px-4 py-3.5 border-b border-[#EEECEA] text-left transition-colors cursor-pointer ${
                                selected === lesson.title ? 'bg-white/60' : 'hover:bg-white/40'
                            }`}
                        >
                            <span className={`text-[13.5px] font-medium ${
                                selected === lesson.title ? 'text-[#3B3F6E] font-semibold' : 'text-[#3B3F6E]'
                            }`}>
                                {lesson.title}
                            </span>
                            <div className="flex items-center gap-2">
                                <span
                                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold"
                                    style={{ backgroundColor: lesson.tagBg, color: '#4A4A4A' }}
                                >
                                    {lesson.tag}
                                </span>
                                {selected === lesson.title && (
                                    <div className="w-5 h-5 rounded-full bg-[#3B3F6E] flex items-center justify-center">
                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.5">
                                            <path d="M2 5L4 7L8 3" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Optional message */}
                <div className="mb-4">
                    <p className="text-[12px] text-graphite-60 mb-2">
                        Add a message <span className="text-graphite-40">(optional)</span>
                    </p>
                    <input
                        type="text"
                        placeholder={`Let ${studentName.split(' ')[0]} know why this lesson might help...`}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E0DDD8] bg-white text-[13px] outline-none focus:border-[#3B3F6E] text-[#111111] font-medium placeholder-graphite-40 transition-colors"
                    />
                </div>

                {/* Submit */}
                <button
                    onClick={() => selected && onSend(selected)}
                    disabled={!selected}
                    className={`w-full py-3.5 rounded-2xl font-semibold text-[14px] transition-all cursor-pointer ${
                        selected
                            ? 'bg-[#3B3F6E] text-white hover:bg-[#2E3259]'
                            : 'bg-[#3B3F6E]/40 text-white/70 cursor-not-allowed'
                    }`}
                >
                    Send recommendation
                </button>
            </div>
        </div>
    );
}

/* ─── Skeleton Loader ─── */
function DetailSkeleton({ onBack }: { onBack: () => void }) {
    return (
        <div className="flex flex-col h-full w-full max-w-[900px] pb-12">
            {/* Offline banner */}
            <div className="bg-[#E8E4DC] text-graphite-60 text-[12px] py-2 px-4 rounded-lg mb-4">
                You&apos;re offline. Showing last synced data.
            </div>

            {/* Back */}
            <button onClick={onBack} className="flex items-center gap-2 text-[14px] text-graphite-60 font-medium mb-6 cursor-pointer w-fit">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M10 3L5 8L10 13" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Students
            </button>

            {/* Avatar + info skeleton */}
            <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-full bg-[#E4E0D9] animate-pulse shrink-0" />
                <div className="flex flex-col gap-2">
                    <div className="h-4 w-[180px] bg-[#E4E0D9] rounded-md animate-pulse" />
                    <div className="h-3 w-[120px] bg-[#EDEBE6] rounded-md animate-pulse" />
                </div>
            </div>

            {/* Action buttons skeleton */}
            <div className="flex gap-3 mb-8">
                <div className="h-9 w-[100px] bg-[#E4E0D9] rounded-full animate-pulse" />
                <div className="h-9 w-[140px] bg-[#E4E0D9] rounded-full animate-pulse" />
            </div>

            {/* IN PROGRESS skeleton */}
            <SkeletonSection title="IN PROGRESS" rows={3} />
            <SkeletonSection title="HOW CHIOMA LEARNS" rows={3} />
            <SkeletonSection title="LEARNING SIGNALS" rows={3} />

            {/* NOTES skeleton */}
            <div className="mb-8">
                <h3 className="text-[11px] font-bold text-[#3B3F6E] tracking-wider uppercase mb-3">YOUR NOTES</h3>
                <div className="bg-white rounded-xl border border-[#E9E7E2] px-5 py-4">
                    <div className="h-3.5 w-[80%] bg-[#E4E0D9] rounded-md animate-pulse" />
                    <div className="h-3.5 w-[50%] bg-[#EDEBE6] rounded-md animate-pulse mt-2" />
                </div>
            </div>
        </div>
    );
}

function SkeletonSection({ title, rows }: { title: string; rows: number }) {
    return (
        <div className="mb-8">
            <h3 className="text-[11px] font-bold text-[#3B3F6E] tracking-wider uppercase mb-3">{title}</h3>
            <div className="bg-white rounded-xl border border-[#E9E7E2] overflow-hidden">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className={`flex items-center justify-between px-5 py-4 ${i > 0 ? 'border-t border-[#EEECEA]' : ''}`}>
                        <div className="h-3.5 w-[55%] bg-[#E4E0D9] rounded-md animate-pulse" />
                        <div className="h-3.5 w-[20%] bg-[#EDEBE6] rounded-md animate-pulse" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Flag Support Bottom Sheet ─── */
const FLAG_REASONS = ['Academic support needed', 'Attendance concern', 'Other'];

function FlagSupportSheet({
    studentName,
    onClose,
    onSubmit,
}: {
    studentName: string;
    onClose: () => void;
    onSubmit: () => void;
}) {
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [context, setContext] = useState('');

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative w-full max-w-[540px] bg-[#F7F1E6] rounded-t-3xl px-6 pt-4 pb-6 animate-slide-up max-h-[85vh] flex flex-col">
                {/* Drag handle */}
                <div className="flex justify-center mb-4">
                    <div className="w-10 h-1 rounded-full bg-graphite-40/40" />
                </div>

                <h3 className="text-[17px] font-semibold text-[#3B3F6E] mb-0.5">Flag for school support</h3>
                <p className="text-[13px] text-graphite-60 font-medium">{studentName}</p>
                <p className="text-[12px] text-graphite-40 mb-5">This will notify your school admin. Your notes are kept confidential.</p>

                {/* Reason */}
                <p className="text-[11px] font-bold text-[#3B3F6E] tracking-wider uppercase mb-3">Reason</p>
                <div className="flex flex-col gap-2.5 mb-5">
                    {FLAG_REASONS.map((reason) => {
                        const isSelected = selectedReason === reason;
                        return (
                            <button
                                key={reason}
                                onClick={() => setSelectedReason(reason)}
                                className={`w-full text-left px-5 py-3.5 rounded-xl border text-[13.5px] font-medium transition-all cursor-pointer flex items-center justify-between ${
                                    isSelected
                                        ? 'border-[#3B3F6E] bg-[#3B3F6E]/5 text-[#3B3F6E]'
                                        : 'border-[#E0DDD8] bg-white text-[#2B2B2F] hover:border-[#C4C0BA]'
                                }`}
                            >
                                {reason}
                                {isSelected && (
                                    <div className="w-5 h-5 rounded-full bg-[#3B3F6E] flex items-center justify-center shrink-0">
                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.5">
                                            <path d="M2 5L4 7L8 3" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Additional context */}
                <p className="text-[12px] text-graphite-60 mb-2">
                    Additional context <span className="text-graphite-40">(optional)</span>
                </p>
                <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Add any additional details..."
                    className="w-full bg-white border border-[#E0DDD8] rounded-xl px-5 py-3.5 text-[13px] text-[#2B2B2F] placeholder-graphite-40 outline-none focus:border-[#3B3F6E] transition-colors resize-none min-h-[80px] mb-5"
                />

                {/* Submit */}
                <button
                    onClick={onSubmit}
                    disabled={!selectedReason}
                    className={`w-full py-3.5 rounded-2xl font-semibold text-[14px] transition-all cursor-pointer ${
                        selectedReason
                            ? 'bg-[#3B3F6E] text-white hover:bg-[#2E3259]'
                            : 'bg-[#3B3F6E]/40 text-white/70 cursor-not-allowed'
                    }`}
                >
                    Submit flag
                </button>
            </div>
        </div>
    );
}

/* ─── Flag Success Modal ─── */
function FlagSuccessModal({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
            <div className="relative bg-white rounded-2xl px-10 py-10 flex flex-col items-center max-w-[380px] w-full shadow-xl animate-fade-in">
                {/* Green checkmark */}
                <div className="w-12 h-12 rounded-full bg-[#16A34A] flex items-center justify-center mb-4">
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <path d="M6 11L9.5 14.5L16 7.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <h3 className="text-[16px] font-semibold text-[#2B2B2F] mb-1">Flag submitted.</h3>
                <p className="text-[13px] text-graphite-40 mb-6">Your school admin has been notified.</p>
                <button
                    onClick={onClose}
                    className="w-full max-w-[240px] py-3 bg-[#3B3F6E] text-white rounded-2xl font-semibold text-[14px] hover:bg-[#2E3259] transition-colors cursor-pointer"
                >
                    Close
                </button>
            </div>
        </div>
    );
}

/* ─── Illustrations ─── */
function BookIllustration() {
    return (
        <div className="w-[80px] h-[60px] bg-[#E8E4DC] rounded-xl flex items-center justify-center">
            <svg width="36" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 4C18 4 14 2 8 2C4 2 2 3 2 3V24C2 24 4 23 8 23C14 23 18 25 18 25" stroke="#3B3F6E" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18 4C18 4 22 2 28 2C32 2 34 3 34 3V24C34 24 32 23 28 23C22 23 18 25 18 25" stroke="#3B3F6E" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="18" y1="4" x2="18" y2="25" stroke="#3B3F6E" strokeWidth="1.3"/>
            </svg>
        </div>
    );
}

function ClipboardIllustration() {
    return (
        <div className="w-[80px] h-[60px] bg-[#E8E4DC] rounded-xl flex items-center justify-center">
            <svg width="28" height="34" viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="4" width="24" height="28" rx="3" stroke="#3B3F6E" strokeWidth="1.3"/>
                <rect x="9" y="1" width="10" height="6" rx="2" stroke="#3B3F6E" strokeWidth="1.3" fill="#E8E4DC"/>
                <line x1="8" y1="14" x2="20" y2="14" stroke="#3B3F6E" strokeWidth="1.3" strokeLinecap="round"/>
                <line x1="8" y1="19" x2="20" y2="19" stroke="#3B3F6E" strokeWidth="1.3" strokeLinecap="round"/>
                <line x1="8" y1="24" x2="15" y2="24" stroke="#3B3F6E" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
        </div>
    );
}

/* ─── Icons ─── */
function SearchIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="#9B9B9B" strokeWidth="1.5">
            <circle cx="7.5" cy="7.5" r="5.5" />
            <line x1="11.5" y1="11.5" x2="16" y2="16" strokeLinecap="round" />
        </svg>
    );
}

function MessageIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
            <circle cx="8" cy="8" r="6.5" />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="6" y1="2" x2="6" y2="10" strokeLinecap="round" />
            <line x1="2" y1="6" x2="10" y2="6" strokeLinecap="round" />
        </svg>
    );
}

function FlagIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M2 1V13" strokeLinecap="round" />
            <path d="M2 1H11L9 4.5L11 8H2" strokeLinejoin="round" />
        </svg>
    );
}
