'use client';

import { useState } from 'react';

/* ─── Mock Data ─── */
type LessonStatus = 'Published' | 'Draft';

interface Lesson {
    id: number;
    title: string;
    subject: string;
    level: string;
    duration: number;
    status: LessonStatus;
    lastUpdated: string;
    signal?: { type: 'warning' | 'success'; text: string };
}

const DUMMY_LESSONS: Lesson[] = [
    {
        id: 2,
        title: 'Cellular Respiration Process',
        subject: 'Science',
        level: 'Secondary',
        duration: 60,
        status: 'Draft',
        lastUpdated: 'Last updated Mar 14',
    },
    {
        id: 3,
        title: "Shakespeare's Macbeth Analysis",
        subject: 'English',
        level: 'Secondary',
        duration: 90,
        status: 'Published',
        lastUpdated: 'Last updated Mar 12',
        signal: { type: 'success', text: '8 students completed' },
    },
    {
        id: 4,
        title: 'Ancient Egyptian Civilization',
        subject: 'History',
        level: 'Secondary',
        duration: 55,
        status: 'Published',
        lastUpdated: 'Last updated Mar 10',
    },
    {
        id: 1,
        title: 'Introduction to Quadratic Equations',
        subject: 'Mathematics',
        level: 'Secondary',
        duration: 45,
        status: 'Published',
        lastUpdated: 'Last updated Mar 15',
        signal: { type: 'warning', text: 'Confusion signals from 3 students' },
    },
    {
        id: 5,
        title: 'Photosynthesis and Plant Biology',
        subject: 'Science',
        level: 'Primary',
        duration: 50,
        status: 'Published',
        lastUpdated: 'Last updated Mar 16',
    },
];

const DUMMY_CLASSES = [
    { id: 'c1', name: 'Form 3A Mathematics', students: 24 },
    { id: 'c2', name: 'Form 3B Mathematics', students: 22 },
    { id: 'c3', name: 'Form 4A Mathematics', students: 26 },
    { id: 'c4', name: 'Form 2C General Science', students: 28 },
];

const DUMMY_STUDENTS = [
    { id: 's1', name: 'Adebayo Olumide', initials: 'AO', cls: '3A' },
    { id: 's2', name: 'Chen Ming', initials: 'CM', cls: '3B' },
    { id: 's3', name: 'Okonkwo Chioma', initials: 'OC', cls: '3A' },
    { id: 's4', name: 'Patel Ravi', initials: 'PR', cls: '4A' },
    { id: 's5', name: 'Williams Sarah', initials: 'WS', cls: '3B' },
    { id: 's6', name: 'Mensah Kwame', initials: 'MK', cls: '3A' },
    { id: 's7', name: 'Ibrahim Fatima', initials: 'IF', cls: '4A' },
    { id: 's8', name: 'Lopez Maria', initials: 'LM', cls: '3B' },
];

/* ─── Components ─── */

export function AssignLessonWizard({
    onClose,
    initialLessonId,
}: {
    onClose: () => void;
    initialLessonId?: number;
}) {
    const [step, setStep] = useState(1);
    const [showSuccess, setShowSuccess] = useState(false);
    const TOTAL_STEPS = 4;

    const [selectedLessonId, setSelectedLessonId] = useState<number | null>(initialLessonId || null);
    const [isSelectingLesson, setIsSelectingLesson] = useState(!initialLessonId);

    // Step 2 State
    const [recipientMode, setRecipientMode] = useState<'class' | 'students' | null>(null);
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

    // Step 3 & 4 State
    const [availableFrom, setAvailableFrom] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [allowOffline, setAllowOffline] = useState(false);
    const [selfPaced, setSelfPaced] = useState(true);

    const handleBack = () => {
        if (step === 1) {
            onClose();
        } else {
            setStep(step - 1);
        }
    };

    const handleContinue = () => {
        if (step < TOTAL_STEPS) setStep(step + 1);
        else setShowSuccess(true);
    };

    if (showSuccess) {
        return (
            <AssignmentSuccess
                recipientCount={recipientMode === 'class' ? selectedClasses.length * 24 : selectedStudents.length}
                onView={() => onClose()}
                onAssignAnother={() => {
                    setStep(1);
                    setSelectedLessonId(null);
                    setRecipientMode(null);
                    setSelectedClasses([]);
                    setSelectedStudents([]);
                    setShowSuccess(false);
                }}
                onBack={onClose}
            />
        );
    }

    return (
        <div className="flex flex-col h-full w-full max-w-[900px] pb-12">
            {/* Header */}
            <div className="flex items-center mb-6">
                <button
                    onClick={handleBack}
                    className="p-1 hover:bg-white/40 rounded-lg transition-colors cursor-pointer"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#3B3F6E" strokeWidth="1.8">
                        <path d="M12 4L6 10L12 16" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <span className="flex-1 text-center text-[13px] text-[#6E74AA] font-medium">
                    Step {step} of {TOTAL_STEPS}
                </span>
            </div>

            {step === 1 && (
                <Step1Lesson
                    selectedLessonId={selectedLessonId}
                    setSelectedLessonId={setSelectedLessonId}
                    isSelectingLesson={isSelectingLesson}
                    setIsSelectingLesson={setIsSelectingLesson}
                    onContinue={handleContinue}
                />
            )}

            {step === 2 && (
                <Step2Recipients
                    recipientMode={recipientMode}
                    setRecipientMode={setRecipientMode}
                    selectedClasses={selectedClasses}
                    setSelectedClasses={setSelectedClasses}
                    selectedStudents={selectedStudents}
                    setSelectedStudents={setSelectedStudents}
                    onContinue={handleContinue}
                />
            )}

            {step === 3 && (
                <Step3Scheduling
                    availableFrom={availableFrom}
                    setAvailableFrom={setAvailableFrom}
                    dueDate={dueDate}
                    setDueDate={setDueDate}
                    onContinue={handleContinue}
                />
            )}

            {step === 4 && (
                <Step4Summary
                    lesson={DUMMY_LESSONS.find(l => l.id === selectedLessonId)}
                    recipientMode={recipientMode}
                    recipientCount={recipientMode === 'class' ? selectedClasses.length * 24 : selectedStudents.length}
                    availableFrom={availableFrom}
                    dueDate={dueDate}
                    allowOffline={allowOffline}
                    setAllowOffline={setAllowOffline}
                    selfPaced={selfPaced}
                    setSelfPaced={setSelfPaced}
                    onAssign={handleContinue}
                />
            )}
        </div>
    );
}

/* ─── Step 1: Which lesson? ─── */
function Step1Lesson({
    selectedLessonId,
    setSelectedLessonId,
    isSelectingLesson,
    setIsSelectingLesson,
    onContinue,
}: {
    selectedLessonId: number | null;
    setSelectedLessonId: (id: number) => void;
    isSelectingLesson: boolean;
    setIsSelectingLesson: (v: boolean) => void;
    onContinue: () => void;
}) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredLessons = DUMMY_LESSONS.filter(l => 
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        l.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedLesson = DUMMY_LESSONS.find(l => l.id === selectedLessonId);

    return (
        <div className="flex flex-col h-full flex-1">
            <h2 className="text-[20px] font-semibold text-[#3B3F6E] mb-6">Which lesson?</h2>

            {!isSelectingLesson && selectedLesson ? (
                <div className="bg-white rounded-2xl border border-[#E9E7E2] px-6 py-5">
                    <div className="flex items-start justify-between mb-2.5">
                        <h3 className="text-[15px] font-semibold text-[#2B2B2F] leading-snug">{selectedLesson.title}</h3>
                        <button
                            onClick={() => setIsSelectingLesson(true)}
                            className="text-[#8E86C8] text-[13px] font-medium hover:text-[#3B3F6E] transition-colors"
                        >
                            Change
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={selectedLesson.status} />
                        <Tag label={selectedLesson.subject} />
                        <Tag label={selectedLesson.level} />
                    </div>
                </div>
            ) : (
                <>
                    <div className="relative mb-6">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#9B9B9B" strokeWidth="1.5">
                                <circle cx="7.5" cy="7.5" r="5.5" />
                                <line x1="11.5" y1="11.5" x2="16" y2="16" strokeLinecap="round" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search your lessons..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#E0DDD8] bg-white text-[14px] outline-none focus:border-[#3B3F6E] transition-colors placeholder-graphite-40"
                        />
                    </div>

                    <div className="flex flex-col gap-3 pb-6 flex-1 overflow-y-auto hide-scrollbar min-h-0">
                        {filteredLessons.map(lesson => {
                            const isSelected = selectedLessonId === lesson.id;
                            return (
                                <div
                                    key={lesson.id}
                                    onClick={() => setSelectedLessonId(lesson.id)}
                                    className={`rounded-2xl border px-6 py-5 transition-colors cursor-pointer relative ${
                                        isSelected
                                            ? 'bg-[#F7F5FC] border-[#3B3F6E]'
                                            : 'bg-white border-[#E9E7E2] hover:border-[#D0CCC5]'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-2.5">
                                        <h3 className={`text-[15px] font-semibold leading-snug ${isSelected ? 'text-[#3B3F6E]' : 'text-[#2B2B2F]'}`}>
                                            {lesson.title}
                                        </h3>
                                        <div className="flex items-center gap-2 shrink-0 ml-4">
                                            <StatusBadge status={lesson.status} />
                                            {isSelected ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B3F6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                                                    <path d="M20 6L9 17l-5-5" />
                                                </svg>
                                            ) : (
                                                <button className="text-graphite-40 hover:text-graphite p-1 rounded-full transition-colors cursor-pointer ml-1">
                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                        <circle cx="8" cy="3" r="1.2" />
                                                        <circle cx="8" cy="8" r="1.2" />
                                                        <circle cx="8" cy="13" r="1.2" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Tag label={lesson.subject} />
                                            <Tag label={lesson.level} />
                                            <span className="flex items-center gap-1 text-[12px] text-graphite-40 ml-1">
                                                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#9B9B9B" strokeWidth="1.3">
                                                    <circle cx="7" cy="7" r="5.5" />
                                                    <polyline points="7,4.5 7,7 9,8.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                {lesson.duration} min
                                            </span>
                                        </div>
                                        {lesson.lastUpdated && (
                                            <span className="text-[12px] text-graphite-40">{lesson.lastUpdated}</span>
                                        )}
                                    </div>
                                    {lesson.signal && (
                                        <div className={`flex items-center gap-1.5 mt-2.5 text-[12px] font-medium ${
                                            lesson.signal.type === 'warning' ? 'text-[#D97706]' : 'text-[#16A34A]'
                                        }`}>
                                            <span className={`w-[6px] h-[6px] rounded-full inline-block ${
                                                lesson.signal.type === 'warning' ? 'bg-[#D97706]' : 'bg-[#16A34A]'
                                            }`} />
                                            {lesson.signal.text}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            <div className="flex-1" />

            <button
                disabled={!selectedLessonId}
                onClick={() => {
                    setIsSelectingLesson(false);
                    onContinue();
                }}
                className={`w-full py-3.5 rounded-2xl font-semibold text-[14px] transition-all cursor-pointer mt-4 ${
                    selectedLessonId 
                        ? 'bg-[#3B3F6E] text-white hover:bg-[#2E3259]' 
                        : 'bg-[#B0ADAD] text-white cursor-not-allowed'
                }`}
            >
                Continue
            </button>
        </div>
    );
}

/* ─── Step 2: Who receives this lesson? ─── */
function Step2Recipients({
    recipientMode,
    setRecipientMode,
    selectedClasses,
    setSelectedClasses,
    selectedStudents,
    setSelectedStudents,
    onContinue,
}: {
    recipientMode: 'class' | 'students' | null;
    setRecipientMode: (v: 'class' | 'students') => void;
    selectedClasses: string[];
    setSelectedClasses: React.Dispatch<React.SetStateAction<string[]>>;
    selectedStudents: string[];
    setSelectedStudents: React.Dispatch<React.SetStateAction<string[]>>;
    onContinue: () => void;
}) {
    const [studentFilter, setStudentFilter] = useState('All');

    const toggleClass = (id: string) => {
        setSelectedClasses(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleStudent = (id: string) => {
        setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const canContinue = recipientMode === 'class' ? selectedClasses.length > 0 : selectedStudents.length > 0;

    const filteredStudents = studentFilter === 'All' 
        ? DUMMY_STUDENTS 
        : DUMMY_STUDENTS.filter(s => s.cls === studentFilter.replace('Form ', ''));

    const allFilteredSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.includes(s.id));
    const toggleSelectAll = () => {
        if (allFilteredSelected) {
            setSelectedStudents(prev => prev.filter(id => !filteredStudents.find(s => s.id === id)));
        } else {
            const additions = filteredStudents.filter(s => !selectedStudents.includes(s.id)).map(s => s.id);
            setSelectedStudents(prev => [...prev, ...additions]);
        }
    };

    return (
        <div className="flex flex-col h-full flex-1">
            <h2 className="text-[20px] font-semibold text-[#3B3F6E] mb-6">Who receives this lesson?</h2>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-8">
                <button
                    onClick={() => setRecipientMode('class')}
                    className={`px-5 py-2.5 rounded-full text-[13px] font-semibold border transition-all cursor-pointer ${
                        recipientMode === 'class'
                            ? 'bg-[#3B3F6E] text-white border-[#3B3F6E]'
                            : 'bg-white text-[#2B2B2F] border-[#E0DDD8] hover:border-[#3B3F6E]'
                    }`}
                >
                    Entire class
                </button>
                <button
                    onClick={() => setRecipientMode('students')}
                    className={`px-5 py-2.5 rounded-full text-[13px] font-semibold border transition-all cursor-pointer ${
                        recipientMode === 'students'
                            ? 'bg-[#3B3F6E] text-white border-[#3B3F6E]'
                            : 'bg-white text-[#2B2B2F] border-[#E0DDD8] hover:border-[#3B3F6E]'
                    }`}
                >
                    Specific students
                </button>
            </div>

            {/* Empty State */}
            {!recipientMode && (
                <div className="flex items-center justify-center flex-1 pb-20">
                    <p className="text-[14px] text-[#6E74AA]">Select how you'd like to assign this lesson</p>
                </div>
            )}

            {/* Class Selection View */}
            {recipientMode === 'class' && (
                <div className="flex flex-col gap-3 flex-1 overflow-y-auto pb-6 hide-scrollbar min-h-0">
                    {DUMMY_CLASSES.map(cls => {
                        const isSelected = selectedClasses.includes(cls.id);
                        return (
                            <button
                                key={cls.id}
                                onClick={() => toggleClass(cls.id)}
                                className={`w-full flex items-center justify-between px-6 py-5 rounded-2xl border transition-colors cursor-pointer ${
                                    isSelected
                                        ? 'bg-[#F7F5FC] border-[#3B3F6E]'
                                        : 'bg-[#FDFBF9] border-[#E0DDD8] hover:border-[#D0CCC5]'
                                }`}
                            >
                                <span className="text-[14px] font-semibold text-[#3B3F6E]">{cls.name}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-[13px] text-graphite-40">{cls.students} students</span>
                                    {isSelected && (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B3F6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 6L9 17l-5-5" />
                                        </svg>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Student Selection View */}
            {recipientMode === 'students' && (
                <div className="flex flex-col flex-1 min-h-0">
                    {/* Filters */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-1 hide-scrollbar shrink-0">
                        {['All classes', 'Form 3A', 'Form 3B', 'Form 4A'].map(filter => {
                            const val = filter === 'All classes' ? 'All' : filter;
                            const isActive = studentFilter === val;
                            return (
                                <button
                                    key={filter}
                                    onClick={() => setStudentFilter(val)}
                                    className={`shrink-0 px-4 py-2 rounded-full text-[12.5px] font-semibold transition-all cursor-pointer ${
                                        isActive
                                            ? 'bg-[#3B3F6E] text-white'
                                            : 'bg-white text-[#2B2B2F] border border-[#E0DDD8] hover:border-[#3B3F6E]'
                                    }`}
                                >
                                    {filter}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between mb-3 px-2 shrink-0">
                        <span className="text-[13px] text-graphite-40">{filteredStudents.length} students</span>
                        <button onClick={toggleSelectAll} className="text-[13px] font-semibold text-[#3B3F6E] hover:underline">
                            {allFilteredSelected ? 'Deselect all' : 'Select all'}
                        </button>
                    </div>

                    <div className="flex flex-col gap-1 pb-6 overflow-y-auto hide-scrollbar flex-1 min-h-0">
                        {filteredStudents.map(student => {
                            const isSelected = selectedStudents.includes(student.id);
                            return (
                                <label
                                    key={student.id}
                                    className="flex items-center gap-4 px-4 py-3 hover:bg-[#F7F5FC] rounded-xl cursor-pointer transition-colors"
                                >
                                    <div className="w-9 h-9 rounded-full bg-[#E8E6F5] text-[#3B3F6E] flex items-center justify-center font-bold text-[12px]">
                                        {student.initials}
                                    </div>
                                    <span className="text-[14px] font-medium text-[#3B3F6E] flex-1">
                                        {student.name}
                                    </span>
                                    <span className="text-[13px] text-graphite-40 font-medium w-8 text-right mr-4">
                                        {student.cls}
                                    </span>
                                    <div className={`w-[18px] h-[18px] rounded flex items-center justify-center transition-colors border ${
                                        isSelected ? 'bg-[#3B3F6E] border-[#3B3F6E]' : 'bg-white border-[#D0CCC5]'
                                    }`}>
                                        {isSelected && (
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 6L9 17l-5-5" />
                                            </svg>
                                        )}
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="flex-1" />

            <button
                disabled={!canContinue}
                onClick={onContinue}
                className={`w-full py-3.5 rounded-2xl font-semibold text-[14px] transition-all cursor-pointer mt-4 ${
                    canContinue 
                        ? 'bg-[#3B3F6E] text-white hover:bg-[#2E3259]' 
                        : 'bg-[#B0ADAD] text-white cursor-not-allowed'
                }`}
            >
                Continue
            </button>
        </div>
    );
}

/* ─── Shared UI ─── */
function StatusBadge({ status }: { status: LessonStatus }) {
    const styles = status === 'Published'
        ? 'bg-[#E8F5E9] text-[#2E7D32]'
        : 'bg-[#F0F0F0] text-[#6B6B70]';

    return (
        <span className={`px-2.5 py-1 rounded-md text-[11.5px] font-semibold ${styles}`}>
            {status}
        </span>
    );
}

function Tag({ label }: { label: string }) {
    return (
        <span className="px-2.5 py-1 bg-[#F0EDE8] text-[#4A4A4A] text-[11.5px] font-medium rounded-md">
            {label}
        </span>
    );
}

/* ─── Step 3: When should students do this? ─── */
function Step3Scheduling({
    availableFrom,
    setAvailableFrom,
    dueDate,
    setDueDate,
    onContinue,
}: {
    availableFrom: string;
    setAvailableFrom: (v: string) => void;
    dueDate: string;
    setDueDate: (v: string) => void;
    onContinue: () => void;
}) {
    // Basic date parsing validation if format allows it or just string compare
    const isError = availableFrom && dueDate && new Date(dueDate) < new Date(availableFrom);

    return (
        <div className="flex flex-col h-full flex-1">
            <h2 className="text-[20px] font-semibold text-[#3B3F6E] mb-8">When should students do this?</h2>

            <div className="mb-6">
                <label className="text-[11px] font-bold text-graphite-60 tracking-wider uppercase mb-2 block">
                    AVAILABLE FROM
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6E74AA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </span>
                    <input
                        type="date"
                        value={availableFrom}
                        onChange={(e) => setAvailableFrom(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#E0DDD8] bg-white text-[14px] text-[#2B2B2F] outline-none focus:border-[#3B3F6E] transition-colors"
                        style={{ appearance: 'none' }}
                    />
                    {!availableFrom && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-graphite-60 pointer-events-none">Today</span>
                    )}
                </div>
            </div>

            <div className="mb-2">
                <div className="flex items-center gap-2 mb-2">
                    <label className="text-[11px] font-bold text-graphite-60 tracking-wider uppercase block">
                        DUE DATE
                    </label>
                    <span className="px-2 py-0.5 rounded-full bg-[#E8E6F5] text-[#6E74AA] text-[10px] font-bold uppercase tracking-wider">Optional</span>
                </div>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6E74AA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </span>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className={`w-full pl-11 pr-4 py-3.5 rounded-xl border bg-white text-[14px] outline-none transition-colors ${
                            isError ? 'border-[#E5533D] text-[#E5533D]' : 'border-[#E0DDD8] text-[#2B2B2F] focus:border-[#3B3F6E]'
                        }`}
                    />
                    {!dueDate && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-graphite-60 pointer-events-none bg-white pl-2">No due date — students can complete anytime</span>
                    )}
                </div>
            </div>
            
            {isError && (
                <div className="flex items-center gap-1.5 mt-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E5533D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span className="text-[12px] font-medium text-[#E5533D]">Due date must be after the start date.</span>
                </div>
            )}

            <div className="flex-1" />

            <button
                disabled={!!isError}
                onClick={onContinue}
                className={`w-full py-3.5 rounded-2xl font-semibold text-[14px] transition-all cursor-pointer mt-4 ${
                    !isError
                        ? 'bg-[#3B3F6E] text-white hover:bg-[#2E3259]'
                        : 'bg-[#B0ADAD] text-white cursor-not-allowed'
                }`}
            >
                Continue
            </button>
        </div>
    );
}

/* ─── Step 4: A few last things ─── */
function Step4Summary({
    lesson,
    recipientMode,
    recipientCount,
    availableFrom,
    dueDate,
    allowOffline,
    setAllowOffline,
    selfPaced,
    setSelfPaced,
    onAssign,
}: {
    lesson?: Lesson;
    recipientMode: string | null;
    recipientCount: number;
    availableFrom: string;
    dueDate: string;
    allowOffline: boolean;
    setAllowOffline: (v: boolean) => void;
    selfPaced: boolean;
    setSelfPaced: (v: boolean) => void;
    onAssign: () => void;
}) {
    const formatDate = (d: string) => {
        if (!d) return 'Today';
        return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="flex flex-col h-full flex-1">
            <h2 className="text-[20px] font-semibold text-[#3B3F6E] mb-1">A few last things.</h2>
            <p className="text-[13px] text-graphite-60 mb-8">All optional.</p>

            {/* Offline Switch */}
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <p className="text-[14px] text-[#2B2B2F] font-medium mb-1">Allow offline download</p>
                    <p className="text-[12px] text-graphite-40">Students can download this lesson to use without internet.</p>
                </div>
                <button
                    onClick={() => setAllowOffline(!allowOffline)}
                    className={`w-10 h-6 mt-[2px] rounded-full flex items-center shrink-0 px-1 transition-colors ${allowOffline ? 'bg-[#8E86C8]' : 'bg-[#D0CCC5]'}`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${allowOffline ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
            </div>

            {/* Self Paced Switch */}
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <p className="text-[14px] text-[#2B2B2F] font-medium mb-1">Self-paced</p>
                    <p className="text-[12px] text-graphite-40">Students work through the lesson at their own speed.</p>
                </div>
                <button
                    onClick={() => setSelfPaced(!selfPaced)}
                    className={`w-10 h-6 mt-[2px] rounded-full flex items-center shrink-0 px-1 transition-colors ${selfPaced ? 'bg-[#8E86C8]' : 'bg-[#D0CCC5]'}`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${selfPaced ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
            </div>

            {/* Assignment Summary */}
            <div className="bg-white rounded-xl border border-[#E0DDD8] p-5 mb-8">
                <span className="block text-[13px] font-bold text-[#3B3F6E] mb-4">Assignment summary</span>
                
                <div className="flex justify-between items-start mb-4">
                    <span className="text-[13px] text-graphite-40 w-[100px]">Lesson</span>
                    <span className="text-[13px] font-medium text-[#2B2B2F] text-right flex-1">{lesson?.title || 'Unknown Lesson'}</span>
                </div>
                <div className="flex justify-between items-start mb-4">
                    <span className="text-[13px] text-graphite-40 w-[100px]">Recipients</span>
                    <span className="text-[13px] font-medium text-[#2B2B2F] text-right flex-1">
                        {recipientCount} {recipientMode === 'class' ? 'students (Class)' : 'students'}
                    </span>
                </div>
                <div className="flex justify-between items-start mb-4">
                    <span className="text-[13px] text-graphite-40 w-[100px]">Available from</span>
                    <span className="text-[13px] font-medium text-[#2B2B2F] text-right flex-1">{formatDate(availableFrom)}</span>
                </div>
                <div className="flex justify-between items-start">
                    <span className="text-[13px] text-graphite-40 w-[100px]">Due</span>
                    <span className="text-[13px] font-medium text-graphite-60 text-right flex-1">{dueDate ? formatDate(dueDate) : 'No due date'}</span>
                </div>
            </div>

            <div className="flex-1" />

            <button
                onClick={onAssign}
                className="w-full py-3.5 rounded-2xl bg-[#3B3F6E] text-white font-semibold text-[14px] hover:bg-[#2E3259] transition-all cursor-pointer"
            >
                Assign lesson
            </button>
        </div>
    );
}

/* ─── Success Screen ─── */
function AssignmentSuccess({
    recipientCount,
    onView,
    onAssignAnother,
    onBack,
}: {
    recipientCount: number;
    onView: () => void;
    onAssignAnother: () => void;
    onBack: () => void;
}) {
    return (
        <div className="flex flex-col h-full flex-1 relative items-center justify-center -mt-16">
            {/* Top toast */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#3B3F6E] text-white text-[13px] font-medium px-6 py-3 rounded-lg shadow-sm whitespace-nowrap">
                Lesson sent to {recipientCount} students
            </div>

            <div className="w-[88px] h-[88px] bg-[#E8F5E9] rounded-full flex items-center justify-center mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                </svg>
            </div>

            <h2 className="text-[24px] font-bold text-[#2B2B2F] mb-3">Lesson assigned.</h2>
            <p className="text-[14px] text-graphite-60 mb-8">Students will see it in their lessons tab.</p>

            <button
                onClick={onView}
                className="w-full max-w-[340px] py-4 rounded-xl border border-[#3B3F6E] text-[#3B3F6E] font-semibold text-[14px] bg-[#F7F1E6] hover:bg-[#E8E6F5] transition-colors cursor-pointer mb-3"
            >
                View assignment
            </button>
            <button
                onClick={onAssignAnother}
                className="w-full max-w-[340px] py-4 rounded-xl border border-[#3B3F6E] text-[#3B3F6E] font-semibold text-[14px] bg-[#F7F1E6] hover:bg-[#E8E6F5] transition-colors cursor-pointer mb-6"
            >
                Assign another lesson
            </button>

            <button onClick={onBack} className="text-[13px] text-graphite-60 font-medium hover:text-graphite transition-colors cursor-pointer">
                Back to dashboard
            </button>
        </div>
    );
}
