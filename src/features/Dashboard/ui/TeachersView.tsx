'use client';

import { useState } from 'react';

interface ClassAssignment {
    id: string;
    name: string;
    studentCount: number;
}

interface TeacherData {
    id: string;
    name: string;
    email: string;
    initials: string;
    classes: ClassAssignment[];
    lessonsUploaded: number;
    lastActive: string;
    status: 'Active' | 'Invited' | 'Unassigned';
    memberSince: string;
    subjects: string[];
}

interface LessonEntry {
    id: string;
    name: string;
    date: string;
}

const INITIAL_TEACHERS: TeacherData[] = [
    {
        id: '1', name: 'Chinedu Eze', email: 'c.eze@lagosintl.edu.ng', initials: 'CE',
        classes: [{ id: 'c1', name: 'Primary 4A', studentCount: 18 }, { id: 'c2', name: 'Primary 5B', studentCount: 20 }],
        lessonsUploaded: 24, lastActive: 'Today', status: 'Active', memberSince: 'Jan 2026',
        subjects: ['Mathematics'],
    },
    {
        id: '2', name: 'Ngozi Okafor', email: 'n.okafor@lagosintl.edu.ng', initials: 'NO',
        classes: [{ id: 'c3', name: 'Primary 3C', studentCount: 16 }, { id: 'c4', name: 'Primary 4B', studentCount: 19 }],
        lessonsUploaded: 31, lastActive: 'Today', status: 'Active', memberSince: 'Jan 2026',
        subjects: ['English Language'],
    },
    {
        id: '3', name: 'Olumide Adewale', email: 'o.adewale@lagosintl.edu.ng', initials: 'OA',
        classes: [{ id: 'c5', name: 'Secondary 1A', studentCount: 22 }],
        lessonsUploaded: 18, lastActive: '2 days ago', status: 'Active', memberSince: 'Feb 2026',
        subjects: ['Basic Science'],
    },
    {
        id: '4', name: 'Amaka Nwosu', email: 'a.nwosu@lagosintl.edu.ng', initials: 'AN',
        classes: [{ id: 'c6', name: 'Primary 2A', studentCount: 16 }, { id: 'c7', name: 'Primary 2B', studentCount: 18 }],
        lessonsUploaded: 27, lastActive: 'Today', status: 'Active', memberSince: 'Jan 2026',
        subjects: ['Mathematics', 'Basic Science'],
    },
    {
        id: '5', name: 'Tunde Balogun', email: 't.balogun@lagosintl.edu.ng', initials: 'TB',
        classes: [{ id: 'c8', name: 'Secondary 2B', studentCount: 20 }, { id: 'c9', name: 'Secondary 3A', studentCount: 22 }],
        lessonsUploaded: 15, lastActive: '5 days ago', status: 'Active', memberSince: 'Feb 2026',
        subjects: ['Social Studies'],
    },
    {
        id: '6', name: 'Fatima Mohammed', email: 'f.mohammed@lagosintl.edu.ng', initials: 'FM',
        classes: [],
        lessonsUploaded: 0, lastActive: 'Never', status: 'Unassigned', memberSince: 'Mar 2026',
        subjects: [],
    },
    {
        id: '7', name: 'Emeka Obi', email: 'e.obi@lagosintl.edu.ng', initials: 'EO',
        classes: [{ id: 'c10', name: 'Primary 1A', studentCount: 14 }],
        lessonsUploaded: 22, lastActive: '3 days ago', status: 'Active', memberSince: 'Jan 2026',
        subjects: ['English Language'],
    },
    {
        id: '8', name: 'Blessing Ikenna', email: 'b.ikenna@lagosintl.edu.ng', initials: 'BI',
        classes: [],
        lessonsUploaded: 0, lastActive: 'Never', status: 'Invited', memberSince: 'Apr 2026',
        subjects: [],
    },
    {
        id: '9', name: 'Yusuf Abdullahi', email: 'y.abdullahi@lagosintl.edu.ng', initials: 'YA',
        classes: [{ id: 'c11', name: 'Secondary 1B', studentCount: 16 }, { id: 'c12', name: 'Secondary 1C', studentCount: 19 }],
        lessonsUploaded: 29, lastActive: 'Yesterday', status: 'Active', memberSince: 'Jan 2026',
        subjects: ['Mathematics', 'Computer Studies'],
    },
    {
        id: '10', name: 'Chioma Agu', email: 'c.agu@lagosintl.edu.ng', initials: 'CA',
        classes: [{ id: 'c13', name: 'Primary 5A', studentCount: 12 }],
        lessonsUploaded: 12, lastActive: '1 week ago', status: 'Active', memberSince: 'Feb 2026',
        subjects: ['Agricultural Science'],
    },
];

const MOCK_TEACHER_LESSONS: LessonEntry[] = [
    { id: '1', name: 'Quadratic Equations - Introduction', date: 'Jan 15, 2026' },
    { id: '2', name: 'Solving Quadratic Equations', date: 'Jan 14, 2026' },
    { id: '3', name: 'Functions and Graphs', date: 'Jan 13, 2026' },
    { id: '4', name: 'Linear Equations Review', date: 'Jan 12, 2026' },
    { id: '5', name: 'Algebraic Expressions', date: 'Jan 11, 2026' },
    { id: '6', name: 'Coordinate Geometry Basics', date: 'Jan 10, 2026' },
    { id: '7', name: 'Trigonometry Introduction', date: 'Jan 9, 2026' },
    { id: '8', name: 'Probability Theory', date: 'Jan 8, 2026' },
];

const DETAIL_CLASSES: ClassAssignment[] = [
    { id: 'd1', name: 'SS2 Mathematics A', studentCount: 18 },
    { id: 'd2', name: 'SS2 Mathematics B', studentCount: 20 },
    { id: 'd3', name: 'SS3 Mathematics A', studentCount: 16 },
    { id: 'd4', name: 'SS3 Mathematics B', studentCount: 19 },
    { id: 'd5', name: 'SS2 Advanced Math', studentCount: 12 },
    { id: 'd6', name: 'SS3 Advanced Math', studentCount: 14 },
];

// ─── Main Component ───

export function TeachersView() {
    const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [hasTeachers, setHasTeachers] = useState(true);
    const [teachers, setTeachers] = useState<TeacherData[]>(INITIAL_TEACHERS);

    const selectedTeacher = teachers.find(t => t.id === selectedTeacherId) || null;

    if (selectedTeacher) {
        return (
            <TeacherDetailView
                teacher={selectedTeacher}
                onBack={() => setSelectedTeacherId(null)}
                onRemove={() => {
                    setTeachers(prev => prev.filter(t => t.id !== selectedTeacher.id));
                    setSelectedTeacherId(null);
                }}
            />
        );
    }

    return (
        <>
            <div className="w-full flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-[22px] font-bold text-[#3B3F6E] tracking-tight">Teachers</h1>
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2 px-5 py-[10px] bg-[#3B3F6E] text-white rounded-lg text-[13px] font-semibold hover:bg-[#2C2F52] transition-colors cursor-pointer"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="12" height="10" rx="2" />
                            <path d="M2 5.5L8 9L14 5.5" />
                        </svg>
                        Invite teacher
                    </button>
                </div>

                {hasTeachers && teachers.length > 0 ? (
                    <TeachersTable teachers={teachers} onViewTeacher={setSelectedTeacherId} />
                ) : (
                    <TeachersEmptyState onInviteClick={() => setShowInviteModal(true)} />
                )}
            </div>

            {showInviteModal && (
                <InviteTeacherModal onClose={() => setShowInviteModal(false)} />
            )}

            <button
                onClick={() => setHasTeachers(!hasTeachers)}
                className="fixed bottom-6 right-6 px-4 py-2 bg-white text-[#3B3F6E] rounded-full text-[11px] font-bold shadow-[0_4px_12px_rgba(0,0,0,0.1)] z-50 border border-[#E9E7E2] hover:bg-gray-50 transition-colors cursor-pointer"
            >
                Toggle Empty/Populated
            </button>
        </>
    );
}

// ─── Teachers Table ───

function TeachersTable({ teachers, onViewTeacher }: { teachers: TeacherData[]; onViewTeacher: (id: string) => void }) {
    return (
        <div className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto] items-center px-6 py-3 border-b border-[#E9E7E2] bg-[#FDFBF9]">
                <span className="text-[11px] font-bold text-graphite-60 uppercase tracking-wider">Name</span>
                <span className="text-[11px] font-bold text-graphite-60 uppercase tracking-wider">Classes</span>
                <span className="text-[11px] font-bold text-graphite-60 uppercase tracking-wider w-[100px]">Lessons uploaded</span>
                <span className="text-[11px] font-bold text-graphite-60 uppercase tracking-wider w-[100px]">Last active</span>
                <span className="text-[11px] font-bold text-graphite-60 uppercase tracking-wider w-[100px]">Status</span>
                <span className="text-[11px] font-bold text-graphite-60 uppercase tracking-wider w-[80px]">Actions</span>
            </div>

            {/* Rows */}
            {teachers.map((teacher) => (
                <div key={teacher.id} className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto] items-center px-6 py-4 border-b border-[#F0EDE6] last:border-b-0 hover:bg-[#FDFBF9] transition-colors">
                    {/* Name + email */}
                    <div className="flex items-center gap-3">
                        <div className="w-[32px] h-[32px] rounded-full bg-[#EAE8F2] flex items-center justify-center text-[#3B3F6E] text-[10px] font-bold shrink-0">
                            {teacher.initials}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-[#3B3F6E] truncate">{teacher.name}</p>
                            <p className="text-[11px] text-graphite-40 truncate">{teacher.email}</p>
                        </div>
                    </div>

                    {/* Classes */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {teacher.classes.length === 0 ? (
                            <span className="text-[12px] text-graphite-40">&mdash;</span>
                        ) : (
                            <>
                                {teacher.classes.slice(0, 2).map(c => (
                                    <span key={c.id} className="px-2 py-[3px] bg-[#EAE8F2] rounded text-[11px] font-medium text-[#3B3F6E] whitespace-nowrap">
                                        {c.name}
                                    </span>
                                ))}
                                {teacher.classes.length > 2 && (
                                    <span className="px-2 py-[3px] bg-[#EAE8F2] rounded text-[11px] font-medium text-[#3B3F6E]">
                                        +{teacher.classes.length - 2} more
                                    </span>
                                )}
                            </>
                        )}
                    </div>

                    {/* Lessons uploaded */}
                    <span className="text-[13px] text-[#3B3F6E] font-medium w-[100px] text-center">{teacher.lessonsUploaded}</span>

                    {/* Last active */}
                    <span className="text-[12px] text-graphite-60 w-[100px]">{teacher.lastActive}</span>

                    {/* Status */}
                    <div className="w-[100px]">
                        <StatusBadge status={teacher.status} />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-[80px]">
                        <button
                            onClick={() => onViewTeacher(teacher.id)}
                            className="text-[12px] font-medium text-[#3B3F6E] hover:underline cursor-pointer"
                        >
                            View
                        </button>
                        <button className="text-graphite-40 hover:text-[#3B3F6E] cursor-pointer p-1">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                <circle cx="8" cy="3" r="1.5" />
                                <circle cx="8" cy="8" r="1.5" />
                                <circle cx="8" cy="13" r="1.5" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

function StatusBadge({ status }: { status: TeacherData['status'] }) {
    const styles = {
        Active: 'bg-[#E8F5E9] text-[#2E7D32]',
        Invited: 'bg-[#EDE7F6] text-[#5E35B1]',
        Unassigned: 'bg-[#FFF3E0] text-[#E65100]',
    };

    return (
        <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold ${styles[status]}`}>
            {status}
        </span>
    );
}

// ─── Empty State ───

function TeachersEmptyState({ onInviteClick }: { onInviteClick: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] w-full">
            <div className="w-[60px] h-[48px] bg-[#EAE8F2] rounded-lg flex items-center justify-center mb-5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A29ECA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7L12 13L21 7" />
                </svg>
            </div>
            <p className="text-[14px] text-graphite-60 font-medium mb-5">No teachers yet. Invite your first teacher.</p>
            <button
                onClick={onInviteClick}
                className="flex items-center gap-2 px-5 py-[10px] bg-[#3B3F6E] text-white rounded-lg text-[13px] font-semibold hover:bg-[#2C2F52] transition-colors cursor-pointer"
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="12" height="10" rx="2" />
                    <path d="M2 5.5L8 9L14 5.5" />
                </svg>
                Invite teacher
            </button>
        </div>
    );
}

// ─── Invite Teacher Modal ───

type InviteStep = 'form' | 'success';

function InviteTeacherModal({ onClose }: { onClose: () => void }) {
    const [step, setStep] = useState<InviteStep>('form');
    const [email, setEmail] = useState('');
    const [assignedClass, setAssignedClass] = useState('');
    const [showClassDropdown, setShowClassDropdown] = useState(false);
    const [sentEmail, setSentEmail] = useState('');

    const isExistingAccount = email.length > 10 && email.includes('@');
    const isValid = email.trim().length > 0 && email.includes('@');

    const availableClasses = ['Primary 1A', 'Primary 2A', 'Primary 3C', 'Secondary 1A', 'Secondary 2B', 'SS2 Mathematics A'];

    const handleSend = () => {
        if (!isValid) return;
        setSentEmail(email);
        setStep('success');
    };

    const handleInviteAnother = () => {
        setEmail('');
        setAssignedClass('');
        setStep('form');
    };

    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-[500px] p-8 relative" onClick={e => e.stopPropagation()}>
                {step === 'form' ? (
                    <InviteForm
                        email={email}
                        setEmail={setEmail}
                        assignedClass={assignedClass}
                        setAssignedClass={setAssignedClass}
                        showClassDropdown={showClassDropdown}
                        setShowClassDropdown={setShowClassDropdown}
                        availableClasses={availableClasses}
                        isExistingAccount={isExistingAccount}
                        isValid={isValid}
                        onSend={handleSend}
                        onClose={onClose}
                    />
                ) : (
                    <InviteSuccess
                        email={sentEmail}
                        onInviteAnother={handleInviteAnother}
                        onDone={onClose}
                    />
                )}
            </div>
        </div>
    );
}

function InviteForm({
    email, setEmail, assignedClass, setAssignedClass,
    showClassDropdown, setShowClassDropdown, availableClasses,
    isExistingAccount, isValid, onSend, onClose,
}: {
    email: string; setEmail: (v: string) => void;
    assignedClass: string; setAssignedClass: (v: string) => void;
    showClassDropdown: boolean; setShowClassDropdown: (v: boolean) => void;
    availableClasses: string[]; isExistingAccount: boolean;
    isValid: boolean; onSend: () => void; onClose: () => void;
}) {
    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-[18px] font-bold text-[#3B3F6E]">Invite a teacher</h2>
                <button onClick={onClose} className="text-graphite-40 hover:text-[#3B3F6E] cursor-pointer">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M5 5L15 15M15 5L5 15" />
                    </svg>
                </button>
            </div>

            <div className="flex flex-col gap-5">
                {/* Email */}
                <div>
                    <label className="text-[11px] font-bold text-graphite-60 uppercase tracking-wider mb-2 block">
                        Teacher&apos;s email address
                    </label>
                    <input
                        type="email"
                        placeholder="teacher@school.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px] text-[#3B3F6E] placeholder:text-graphite-40 bg-[#FDFBF9] focus:outline-none focus:border-[#3B3F6E] transition-colors"
                    />
                    {isExistingAccount && (
                        <p className="text-[12px] text-graphite-40 mt-2 leading-relaxed">
                            This teacher already has a Nevo account. They can join using your school code.
                        </p>
                    )}
                </div>

                {/* Assign to class */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <label className="text-[13px] font-semibold text-[#3B3F6E]">Assign to class</label>
                        <span className="text-[10px] font-bold text-white bg-[#5A9B6A] px-2 py-[2px] rounded-full">Optional</span>
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowClassDropdown(!showClassDropdown)}
                            className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px] bg-white flex items-center justify-between cursor-pointer"
                        >
                            <span className={assignedClass ? 'text-[#3B3F6E] font-medium' : 'text-graphite-40'}>
                                {assignedClass || 'No class yet'}
                            </span>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#9a9ccb" strokeWidth="2" strokeLinecap="round" className={`transition-transform ${showClassDropdown ? 'rotate-180' : ''}`}>
                                <path d="M4 6L8 10L12 6" />
                            </svg>
                        </button>

                        {showClassDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E9E7E2] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] z-10 max-h-[180px] overflow-y-auto">
                                <button
                                    onClick={() => { setAssignedClass(''); setShowClassDropdown(false); }}
                                    className="w-full px-4 py-3 text-left text-[13px] font-medium text-graphite-40 hover:bg-[#F7F1E6] cursor-pointer transition-colors"
                                >
                                    No class yet
                                </button>
                                {availableClasses.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => { setAssignedClass(c); setShowClassDropdown(false); }}
                                        className="w-full px-4 py-3 text-left text-[13px] font-medium text-[#3B3F6E] hover:bg-[#F7F1E6] cursor-pointer transition-colors"
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Send button */}
                <button
                    onClick={onSend}
                    disabled={!isValid}
                    className={`w-full py-3 rounded-xl text-[14px] font-semibold transition-colors ${
                        isValid
                            ? 'bg-[#3B3F6E] text-white hover:bg-[#2C2F52] cursor-pointer'
                            : 'bg-[#B8B6C8] text-white cursor-not-allowed'
                    }`}
                >
                    Send invite
                </button>
            </div>
        </>
    );
}

function InviteSuccess({ email, onInviteAnother, onDone }: { email: string; onInviteAnother: () => void; onDone: () => void }) {
    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-[18px] font-bold text-[#3B3F6E]">Invite a teacher</h2>
                <button onClick={onDone} className="text-graphite-40 hover:text-[#3B3F6E] cursor-pointer">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M5 5L15 15M15 5L5 15" />
                    </svg>
                </button>
            </div>

            <div className="flex flex-col items-center text-center">
                {/* Green checkmark */}
                <div className="w-[48px] h-[48px] rounded-full bg-[#5A9B6A] flex items-center justify-center mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17L4 12" />
                    </svg>
                </div>

                <p className="text-[14px] font-semibold text-[#3B3F6E] mb-1">Invite sent to {email}</p>
                <p className="text-[12px] text-graphite-40 mb-6">They&apos;ll receive an email with your school code.</p>

                <div className="flex flex-col gap-3 w-full">
                    <button
                        onClick={onInviteAnother}
                        className="w-full py-3 border border-[#E9E7E2] rounded-xl text-[14px] font-medium text-[#3B3F6E] hover:bg-black/5 transition-colors cursor-pointer"
                    >
                        Invite another
                    </button>
                    <button
                        onClick={onDone}
                        className="w-full py-3 bg-[#3B3F6E] text-white rounded-xl text-[14px] font-semibold hover:bg-[#2C2F52] transition-colors cursor-pointer"
                    >
                        Done
                    </button>
                </div>
            </div>
        </>
    );
}

// ─── Teacher Detail View ───

function TeacherDetailView({ teacher, onBack, onRemove }: {
    teacher: TeacherData;
    onBack: () => void;
    onRemove: () => void;
}) {
    const [showAllLessons, setShowAllLessons] = useState(false);
    const hasClasses = teacher.classes.length > 0;
    const hasLessons = teacher.lessonsUploaded > 0;
    const detailClasses = hasClasses ? DETAIL_CLASSES : [];
    const detailLessons = hasLessons ? MOCK_TEACHER_LESSONS : [];
    const displayedLessons = showAllLessons ? detailLessons : detailLessons.slice(0, 8);
    const classCount = hasClasses ? DETAIL_CLASSES.length : 0;
    const lessonCount = hasLessons ? teacher.lessonsUploaded : 0;

    return (
        <div className="w-full flex flex-col gap-5">
            {/* Back link */}
            <button onClick={onBack} className="flex items-center gap-1 text-[13px] text-[#3B3F6E] font-medium hover:opacity-70 cursor-pointer self-start -mb-1">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 12L6 8L10 4" />
                </svg>
                Teachers
            </button>

            {/* Header + Sidebar layout */}
            <div className="flex gap-6">
                {/* Left: Main content */}
                <div className="flex-1 min-w-0">
                    {/* Profile header */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-[56px] h-[56px] rounded-full bg-[#EAE8F2] flex items-center justify-center text-[#3B3F6E] text-[16px] font-bold shrink-0">
                            {teacher.initials}
                        </div>
                        <div>
                            <h1 className="text-[20px] font-bold text-[#3B3F6E] tracking-tight">{teacher.name}</h1>
                            <p className="text-[13px] text-graphite-40">{teacher.email}</p>
                        </div>
                    </div>

                    {/* Subject tags */}
                    {teacher.subjects.length > 0 && (
                        <div className="flex gap-2 mb-6">
                            {teacher.subjects.map(s => (
                                <span key={s} className="px-3 py-1 bg-[#3B3F6E] text-white rounded-full text-[11px] font-semibold">
                                    {s}
                                </span>
                            ))}
                            {hasClasses && (
                                <>
                                    <span className="px-3 py-1 bg-[#3B3F6E] text-white rounded-full text-[11px] font-semibold">SS2</span>
                                    <span className="px-3 py-1 bg-[#3B3F6E] text-white rounded-full text-[11px] font-semibold">SS3</span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Classes */}
                    <h2 className="text-[15px] font-bold text-[#3B3F6E] mb-4">Classes ({classCount})</h2>

                    {hasClasses ? (
                        <>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {detailClasses.map(c => (
                                    <div key={c.id} className="border border-[#E9E7E2] rounded-xl px-4 py-3 bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow cursor-pointer">
                                        <p className="text-[13px] font-semibold text-[#3B3F6E]">{c.name}</p>
                                        <p className="text-[11px] text-graphite-40">{c.studentCount} students</p>
                                    </div>
                                ))}
                            </div>
                            <button className="px-4 py-2 border border-[#E9E7E2] rounded-lg text-[13px] font-medium text-[#3B3F6E] hover:bg-black/5 transition-colors cursor-pointer mb-8">
                                Assign to another class
                            </button>
                        </>
                    ) : (
                        <div className="bg-[#FDFBF9] border border-[#E9E7E2] rounded-xl px-6 py-6 flex flex-col items-center gap-4 mb-8">
                            <p className="text-[13px] text-graphite-40">No classes assigned yet</p>
                            <button className="px-5 py-[10px] bg-[#3B3F6E] text-white rounded-lg text-[13px] font-semibold hover:bg-[#2C2F52] transition-colors cursor-pointer">
                                Assign to class
                            </button>
                        </div>
                    )}

                    {/* Lessons uploaded */}
                    <h2 className="text-[15px] font-bold text-[#3B3F6E] mb-4">Lessons uploaded ({lessonCount})</h2>

                    {hasLessons ? (
                        <>
                            <div className="flex flex-col">
                                {displayedLessons.map(lesson => (
                                    <div key={lesson.id} className="flex items-center justify-between py-3 border-b border-[#F0EDE6]">
                                        <p className="text-[13px] font-medium text-[#3B3F6E]">{lesson.name}</p>
                                        <span className="text-[12px] text-graphite-40 shrink-0">{lesson.date}</span>
                                    </div>
                                ))}
                            </div>
                            {!showAllLessons && detailLessons.length >= 8 && (
                                <button
                                    onClick={() => setShowAllLessons(true)}
                                    className="mt-3 text-[13px] font-medium text-[#3B3F6E] hover:underline cursor-pointer w-full text-center py-2"
                                >
                                    View all {lessonCount} lessons
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="bg-[#FDFBF9] border border-[#E9E7E2] rounded-xl px-6 py-6 flex items-center justify-center">
                            <p className="text-[13px] text-graphite-40">No lessons uploaded yet</p>
                        </div>
                    )}
                </div>

                {/* Right: Sidebar */}
                <div className="w-[260px] shrink-0 flex flex-col gap-4">
                    {/* Stats card */}
                    <div className="bg-white border border-[#E9E7E2] rounded-xl p-5">
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between">
                                <span className="text-[12px] text-graphite-40">Last active</span>
                                <span className="text-[12px] font-semibold text-[#3B3F6E]">{teacher.lastActive}</span>
                            </div>
                            <div className="border-b border-[#F0EDE6]" />
                            <div className="flex justify-between">
                                <span className="text-[12px] text-graphite-40">Member since</span>
                                <span className="text-[12px] font-semibold text-[#3B3F6E]">{teacher.memberSince}</span>
                            </div>
                            <div className="border-b border-[#F0EDE6]" />
                            <div className="flex justify-between">
                                <span className="text-[12px] text-graphite-40">Classes</span>
                                <span className="text-[12px] font-semibold text-[#3B3F6E]">{classCount}</span>
                            </div>
                            <div className="border-b border-[#F0EDE6]" />
                            <div className="flex justify-between">
                                <span className="text-[12px] text-graphite-40">Lessons uploaded</span>
                                <span className="text-[12px] font-semibold text-[#3B3F6E]">{lessonCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Remove action */}
                    <div className="bg-white border border-[#E9E7E2] rounded-xl p-5">
                        <p className="text-[11px] text-graphite-40 mb-3">This will unassign them from all classes.</p>
                        <button
                            onClick={onRemove}
                            className="w-full py-[10px] border border-[#D4534A] rounded-lg text-[13px] font-semibold text-[#D4534A] hover:bg-[#FFF5F0] transition-colors cursor-pointer"
                        >
                            Remove from school
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
