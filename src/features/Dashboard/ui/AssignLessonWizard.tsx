'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthGuard } from '@/shared/lib';

type LessonStatus = 'Published' | 'Draft';

type Lesson = {
    id: string;
    title: string;
    subject: string;
    level: string;
    duration: number;
    status: LessonStatus;
    lastUpdated: string;
    signal?: { type: 'warning' | 'success'; text: string };
};

type ClassOption = {
    id: string;
    name: string;
    teacherName?: string;
    students: number;
};

type StudentOption = {
    id: string;
    name: string;
    initials: string;
};

function buildErrorMessage(data: any, fallback: string) {
    if (typeof data?.detail === 'string') return data.detail;
    if (typeof data?.message === 'string') return data.message;
    if (typeof data?.error === 'string') return data.error;
    return fallback;
}

function formatUpdatedDate(value?: string | null) {
    if (!value) return 'Last updated recently';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Last updated recently';
    return `Last updated ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function getInitials(name: string) {
    return (
        name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() || '')
            .join('') || 'ST'
    );
}

async function fetchTeacherLessons() {
    const params = new URLSearchParams({
        page: '1',
        page_size: '100',
        sort_by: 'created_at',
        sort_order: 'desc',
    });
    const res = await fetch(`/api/teacher/lessons?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw Object.assign(new Error(buildErrorMessage(data, 'Could not load lessons.')), {
            authExpired: res.status === 401 || res.status === 403,
        });
    }

    const rawLessons = Array.isArray(data?.lessons) ? data.lessons : [];
    return rawLessons
        .filter((lesson: any) => String(lesson?.status || '').toLowerCase() === 'published')
        .map((lesson: any): Lesson => {
            const confusionCount = Number(lesson?.confusion_signal_count || 0);
            const completionCount = Number(lesson?.completion_count || 0);
            return {
                id: String(lesson.id),
                title: lesson.title || 'Untitled lesson',
                subject: lesson.subject || lesson.topic || 'General',
                level: lesson.education_level || 'Secondary',
                duration: Number(lesson.estimated_duration_minutes || 0),
                status: 'Published',
                lastUpdated: formatUpdatedDate(lesson.last_updated || lesson.created_at),
                signal:
                    confusionCount > 0
                        ? { type: 'warning', text: `Confusion signals from ${confusionCount} students` }
                        : completionCount > 0
                            ? { type: 'success', text: `${completionCount} students completed` }
                            : undefined,
            };
        });
}

async function fetchTeacherClasses() {
    const res = await fetch('/api/teacher/classes');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw Object.assign(new Error(buildErrorMessage(data, 'Could not load classes.')), {
            authExpired: res.status === 401 || res.status === 403,
        });
    }

    const rawClasses = Array.isArray(data?.classes) ? data.classes : [];
    return rawClasses.map((item: any): ClassOption => ({
        id: String(item.id || item.class_id),
        name: item.name || item.class_name || 'Class',
        teacherName: item.teacher_name || undefined,
        students: Number(item.student_count || 0),
    }));
}

async function fetchAssignableStudents() {
    const res = await fetch('/api/teacher/students/assignable');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw Object.assign(new Error(buildErrorMessage(data, 'Could not load students.')), {
            authExpired: res.status === 401 || res.status === 403,
        });
    }

    const rawStudents = Array.isArray(data?.students) ? data.students : [];
    return rawStudents.map((item: any): StudentOption => {
        const name =
            item.name ||
            `${item.first_name || ''} ${item.last_name || ''}`.trim() ||
            item.email ||
            'Student';
        return {
            id: String(item.id),
            name,
            initials: getInitials(name),
        };
    });
}

async function assignLesson(payload: {
    lessonId: string;
    recipientMode: 'class' | 'students';
    classId?: string | null;
    studentIds?: string[];
    dueDate?: string;
}) {
    const res = await fetch(`/api/teacher/lessons/${payload.lessonId}/assign`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            target: payload.recipientMode === 'class' ? 'class' : 'individual',
            class_id: payload.classId || null,
            student_ids: payload.recipientMode === 'students' ? payload.studentIds || [] : [],
            due_at: payload.dueDate || null,
        }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw Object.assign(new Error(buildErrorMessage(data, 'Could not assign lesson.')), {
            authExpired: res.status === 401 || res.status === 403,
        });
    }
    return data;
}

export function AssignLessonWizard({
    onClose,
    initialLessonId,
}: {
    onClose: () => void;
    initialLessonId?: number | string;
}) {
    const guardAuth = useAuthGuard('teacher');
    const [step, setStep] = useState(1);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successCount, setSuccessCount] = useState(0);
    const TOTAL_STEPS = 4;

    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [students, setStudents] = useState<StudentOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [assigning, setAssigning] = useState(false);

    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(
        initialLessonId ? String(initialLessonId) : null,
    );
    const [isSelectingLesson, setIsSelectingLesson] = useState(!initialLessonId);
    const [recipientMode, setRecipientMode] = useState<'class' | 'students' | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [dueDate, setDueDate] = useState('');

    useEffect(() => {
        let mounted = true;

        (async () => {
            setLoading(true);
            setLoadError(null);

            try {
                const [lessonResult, classResult, studentResult] = await Promise.allSettled([
                    fetchTeacherLessons(),
                    fetchTeacherClasses(),
                    fetchAssignableStudents(),
                ]);

                if (!mounted) return;

                // Lessons are required — if they fail, show an error
                if (lessonResult.status === 'rejected') {
                    const err = lessonResult.reason;
                    if (guardAuth(err as any)) return;
                    setLoadError(err instanceof Error ? err.message : 'Could not load lessons.');
                    return;
                }

                setLessons(lessonResult.value);
                setClasses(classResult.status === 'fulfilled' ? classResult.value : []);
                setStudents(studentResult.status === 'fulfilled' ? studentResult.value : []);
            } catch (error) {
                if (!mounted) return;
                if (guardAuth(error as any)) return;
                setLoadError(error instanceof Error ? error.message : 'Could not load assignment data.');
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    const selectedLesson = useMemo(
        () => lessons.find((lesson) => lesson.id === selectedLessonId),
        [lessons, selectedLessonId],
    );

    const selectedClass = useMemo(
        () => classes.find((classItem) => classItem.id === selectedClassId),
        [classes, selectedClassId],
    );

    const selectedStudentRecords = useMemo(
        () => students.filter((student) => selectedStudents.includes(student.id)),
        [students, selectedStudents],
    );

    const handleBack = () => {
        setSubmitError(null);
        if (step === 1) {
            onClose();
        } else {
            setStep((current) => current - 1);
        }
    };

    const handleContinue = () => {
        setSubmitError(null);
        if (step < TOTAL_STEPS) setStep((current) => current + 1);
    };

    const handleAssign = async () => {
        if (!selectedLessonId || !recipientMode) return;

        setAssigning(true);
        setSubmitError(null);

        try {
            const result = await assignLesson({
                lessonId: selectedLessonId,
                recipientMode,
                classId: recipientMode === 'class' ? selectedClassId : null,
                studentIds: recipientMode === 'students' ? selectedStudents : [],
                dueDate,
            });

            setSuccessCount(Number(result?.assigned_count || 0));
            setShowSuccess(true);
        } catch (error) {
            if (guardAuth(error as any)) {
                setAssigning(false);
                return;
            }
            setSubmitError(error instanceof Error ? error.message : 'Could not assign lesson.');
        } finally {
            setAssigning(false);
        }
    };

    const resetWizard = () => {
        setStep(1);
        setSelectedLessonId(initialLessonId ? String(initialLessonId) : null);
        setIsSelectingLesson(!initialLessonId);
        setRecipientMode(null);
        setSelectedClassId(null);
        setSelectedStudents([]);
        setDueDate('');
        setSubmitError(null);
        setShowSuccess(false);
        setSuccessCount(0);
    };

    if (showSuccess) {
        return (
            <AssignmentSuccess
                recipientCount={successCount}
                onView={onClose}
                onAssignAnother={resetWizard}
                onBack={onClose}
            />
        );
    }

    if (loading) {
        return (
            <div className="flex h-full w-full max-w-[900px] items-center justify-center">
                <span className="text-[14px] text-[#6E74AA]">Loading assignment options...</span>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="flex h-full w-full max-w-[900px] flex-col items-center justify-center gap-4 text-center">
                <p className="text-[15px] font-semibold text-[#3B3F6E]">We couldn&apos;t load assignment data.</p>
                <p className="text-[13px] text-graphite-60">{loadError}</p>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl bg-[#3B3F6E] px-5 py-3 text-[14px] font-semibold text-white cursor-pointer"
                >
                    Close
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full max-w-[900px] pb-12">
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

            {step === 1 ? (
                <Step1Lesson
                    lessons={lessons}
                    selectedLessonId={selectedLessonId}
                    setSelectedLessonId={setSelectedLessonId}
                    isSelectingLesson={isSelectingLesson}
                    setIsSelectingLesson={setIsSelectingLesson}
                    onContinue={handleContinue}
                />
            ) : null}

            {step === 2 ? (
                <Step2Recipients
                    recipientMode={recipientMode}
                    setRecipientMode={setRecipientMode}
                    classes={classes}
                    selectedClassId={selectedClassId}
                    setSelectedClassId={setSelectedClassId}
                    students={students}
                    selectedStudents={selectedStudents}
                    setSelectedStudents={setSelectedStudents}
                    onContinue={handleContinue}
                />
            ) : null}

            {step === 3 ? (
                <Step3Scheduling dueDate={dueDate} setDueDate={setDueDate} onContinue={handleContinue} />
            ) : null}

            {step === 4 ? (
                <Step4Summary
                    lesson={selectedLesson}
                    recipientMode={recipientMode}
                    selectedClass={selectedClass}
                    selectedStudents={selectedStudentRecords}
                    dueDate={dueDate}
                    onAssign={handleAssign}
                    assigning={assigning}
                    submitError={submitError}
                />
            ) : null}
        </div>
    );
}

function Step1Lesson({
    lessons,
    selectedLessonId,
    setSelectedLessonId,
    isSelectingLesson,
    setIsSelectingLesson,
    onContinue,
}: {
    lessons: Lesson[];
    selectedLessonId: string | null;
    setSelectedLessonId: (id: string) => void;
    isSelectingLesson: boolean;
    setIsSelectingLesson: (value: boolean) => void;
    onContinue: () => void;
}) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredLessons = useMemo(
        () =>
            lessons.filter(
                (lesson) =>
                    lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    lesson.subject.toLowerCase().includes(searchQuery.toLowerCase()),
            ),
        [lessons, searchQuery],
    );

    const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId);

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
                        {filteredLessons.map((lesson) => {
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
                                            ) : null}
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
                                        <span className="text-[12px] text-graphite-40">{lesson.lastUpdated}</span>
                                    </div>
                                    {lesson.signal ? (
                                        <div className={`flex items-center gap-1.5 mt-2.5 text-[12px] font-medium ${
                                            lesson.signal.type === 'warning' ? 'text-[#D97706]' : 'text-[#16A34A]'
                                        }`}>
                                            <span className={`w-[6px] h-[6px] rounded-full inline-block ${
                                                lesson.signal.type === 'warning' ? 'bg-[#D97706]' : 'bg-[#16A34A]'
                                            }`} />
                                            {lesson.signal.text}
                                        </div>
                                    ) : null}
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

function Step2Recipients({
    recipientMode,
    setRecipientMode,
    classes,
    selectedClassId,
    setSelectedClassId,
    students,
    selectedStudents,
    setSelectedStudents,
    onContinue,
}: {
    recipientMode: 'class' | 'students' | null;
    setRecipientMode: (value: 'class' | 'students') => void;
    classes: ClassOption[];
    selectedClassId: string | null;
    setSelectedClassId: (value: string | null) => void;
    students: StudentOption[];
    selectedStudents: string[];
    setSelectedStudents: React.Dispatch<React.SetStateAction<string[]>>;
    onContinue: () => void;
}) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredStudents = useMemo(
        () =>
            students.filter((student) =>
                student.name.toLowerCase().includes(searchQuery.toLowerCase()),
            ),
        [students, searchQuery],
    );

    const allFilteredSelected =
        filteredStudents.length > 0 &&
        filteredStudents.every((student) => selectedStudents.includes(student.id));

    const toggleStudent = (studentId: string) => {
        setSelectedStudents((current) =>
            current.includes(studentId)
                ? current.filter((id) => id !== studentId)
                : [...current, studentId],
        );
    };

    const toggleSelectAll = () => {
        if (allFilteredSelected) {
            setSelectedStudents((current) =>
                current.filter((id) => !filteredStudents.find((student) => student.id === id)),
            );
            return;
        }

        const additions = filteredStudents
            .filter((student) => !selectedStudents.includes(student.id))
            .map((student) => student.id);
        setSelectedStudents((current) => [...current, ...additions]);
    };

    const canContinue =
        recipientMode === 'class'
            ? Boolean(selectedClassId)
            : recipientMode === 'students'
                ? selectedStudents.length > 0
                : false;

    return (
        <div className="flex flex-col h-full flex-1">
            <h2 className="text-[20px] font-semibold text-[#3B3F6E] mb-6">Who receives this lesson?</h2>

            <div className="flex gap-2 mb-8">
                <button
                    onClick={() => {
                        setRecipientMode('class');
                        setSelectedStudents([]);
                    }}
                    className={`px-5 py-2.5 rounded-full text-[13px] font-semibold border transition-all cursor-pointer ${
                        recipientMode === 'class'
                            ? 'bg-[#3B3F6E] text-white border-[#3B3F6E]'
                            : 'bg-white text-[#2B2B2F] border-[#E0DDD8] hover:border-[#3B3F6E]'
                    }`}
                >
                    Entire class
                </button>
                <button
                    onClick={() => {
                        setRecipientMode('students');
                        setSelectedClassId(null);
                    }}
                    className={`px-5 py-2.5 rounded-full text-[13px] font-semibold border transition-all cursor-pointer ${
                        recipientMode === 'students'
                            ? 'bg-[#3B3F6E] text-white border-[#3B3F6E]'
                            : 'bg-white text-[#2B2B2F] border-[#E0DDD8] hover:border-[#3B3F6E]'
                    }`}
                >
                    Specific students
                </button>
            </div>

            {!recipientMode ? (
                <div className="flex items-center justify-center flex-1 pb-20">
                    <p className="text-[14px] text-[#6E74AA]">Select how you&apos;d like to assign this lesson</p>
                </div>
            ) : null}

            {recipientMode === 'class' ? (
                <div className="flex flex-col gap-3 flex-1 overflow-y-auto pb-6 hide-scrollbar min-h-0">
                    {classes.length === 0 ? (
                        <div className="rounded-2xl border border-[#E9E7E2] bg-white px-6 py-5 text-[13px] text-graphite-60">
                            No classes are available yet.
                        </div>
                    ) : (
                        classes.map((classItem) => {
                            const isSelected = selectedClassId === classItem.id;
                            return (
                                <button
                                    key={classItem.id}
                                    onClick={() => setSelectedClassId(isSelected ? null : classItem.id)}
                                    className={`w-full flex items-center justify-between px-6 py-5 rounded-2xl border transition-colors cursor-pointer ${
                                        isSelected
                                            ? 'bg-[#F7F5FC] border-[#3B3F6E]'
                                            : 'bg-[#FDFBF9] border-[#E0DDD8] hover:border-[#D0CCC5]'
                                    }`}
                                >
                                    <div className="text-left">
                                        <span className="block text-[14px] font-semibold text-[#3B3F6E]">{classItem.name}</span>
                                        {classItem.teacherName ? (
                                            <span className="mt-1 block text-[12px] text-graphite-40">
                                                Teacher: {classItem.teacherName}
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[13px] text-graphite-40">
                                            {classItem.students} students
                                        </span>
                                        {isSelected ? (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B3F6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 6L9 17l-5-5" />
                                            </svg>
                                        ) : null}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            ) : null}

            {recipientMode === 'students' ? (
                <div className="flex flex-col flex-1 min-h-0">
                    <div className="relative mb-4 shrink-0">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#9B9B9B" strokeWidth="1.5">
                                <circle cx="7.5" cy="7.5" r="5.5" />
                                <line x1="11.5" y1="11.5" x2="16" y2="16" strokeLinecap="round" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#E0DDD8] bg-white text-[14px] outline-none focus:border-[#3B3F6E] transition-colors"
                        />
                    </div>

                    <div className="flex items-center justify-between mb-3 px-2 shrink-0">
                        <span className="text-[13px] text-graphite-40">{filteredStudents.length} students</span>
                        <button onClick={toggleSelectAll} className="text-[13px] font-semibold text-[#3B3F6E] hover:underline">
                            {allFilteredSelected ? 'Deselect all' : 'Select all'}
                        </button>
                    </div>

                    <div className="flex flex-col gap-1 pb-6 overflow-y-auto hide-scrollbar flex-1 min-h-0">
                        {filteredStudents.map((student) => {
                            const isSelected = selectedStudents.includes(student.id);
                            return (
                                <label
                                    key={student.id}
                                    className="flex items-center gap-4 px-4 py-3 hover:bg-[#F7F5FC] rounded-xl cursor-pointer transition-colors"
                                >
                                    <div className="w-9 h-9 rounded-full bg-[#E8E6F5] text-[#3B3F6E] flex items-center justify-center font-bold text-[12px]">
                                        {student.initials}
                                    </div>
                                    <span className="text-[14px] font-medium text-[#3B3F6E] flex-1">{student.name}</span>
                                    <div className={`w-[18px] h-[18px] rounded flex items-center justify-center transition-colors border ${
                                        isSelected ? 'bg-[#3B3F6E] border-[#3B3F6E]' : 'bg-white border-[#D0CCC5]'
                                    }`}>
                                        {isSelected ? (
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 6L9 17l-5-5" />
                                            </svg>
                                        ) : null}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleStudent(student.id)}
                                        className="sr-only"
                                    />
                                </label>
                            );
                        })}
                    </div>
                </div>
            ) : null}

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

function Step3Scheduling({
    dueDate,
    setDueDate,
    onContinue,
}: {
    dueDate: string;
    setDueDate: (value: string) => void;
    onContinue: () => void;
}) {
    return (
        <div className="flex flex-col h-full flex-1">
            <h2 className="text-[20px] font-semibold text-[#3B3F6E] mb-1">When should students complete this?</h2>
            <p className="text-[13px] text-graphite-60 mb-8">A due date is optional.</p>

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
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#E0DDD8] bg-white text-[14px] outline-none transition-colors focus:border-[#3B3F6E]"
                    />
                    {!dueDate ? (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-graphite-60 pointer-events-none bg-white pl-2">
                            No due date
                        </span>
                    ) : null}
                </div>
            </div>

            <div className="flex-1" />

            <button
                onClick={onContinue}
                className="w-full py-3.5 rounded-2xl font-semibold text-[14px] transition-all cursor-pointer mt-4 bg-[#3B3F6E] text-white hover:bg-[#2E3259]"
            >
                Continue
            </button>
        </div>
    );
}

function Step4Summary({
    lesson,
    recipientMode,
    selectedClass,
    selectedStudents,
    dueDate,
    onAssign,
    assigning,
    submitError,
}: {
    lesson?: Lesson;
    recipientMode: 'class' | 'students' | null;
    selectedClass?: ClassOption;
    selectedStudents: StudentOption[];
    dueDate: string;
    onAssign: () => void;
    assigning: boolean;
    submitError: string | null;
}) {
    const recipientLabel =
        recipientMode === 'class'
            ? selectedClass?.name || 'Class'
            : `${selectedStudents.length} student${selectedStudents.length === 1 ? '' : 's'}`;

    const formatDate = (value: string) => {
        if (!value) return 'No due date';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'No due date';
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="flex flex-col h-full flex-1">
            <h2 className="text-[20px] font-semibold text-[#3B3F6E] mb-1">Ready to assign.</h2>
            <p className="text-[13px] text-graphite-60 mb-8">Review the details before sending.</p>

            <div className="bg-white rounded-xl border border-[#E0DDD8] p-5 mb-8">
                <span className="block text-[13px] font-bold text-[#3B3F6E] mb-4">Assignment summary</span>

                <div className="flex justify-between items-start mb-4">
                    <span className="text-[13px] text-graphite-40 w-[100px]">Lesson</span>
                    <span className="text-[13px] font-medium text-[#2B2B2F] text-right flex-1">{lesson?.title || 'Unknown lesson'}</span>
                </div>
                <div className="flex justify-between items-start mb-4">
                    <span className="text-[13px] text-graphite-40 w-[100px]">Recipients</span>
                    <span className="text-[13px] font-medium text-[#2B2B2F] text-right flex-1">{recipientLabel}</span>
                </div>
                <div className="flex justify-between items-start">
                    <span className="text-[13px] text-graphite-40 w-[100px]">Due</span>
                    <span className="text-[13px] font-medium text-graphite-60 text-right flex-1">{formatDate(dueDate)}</span>
                </div>
            </div>

            {submitError ? (
                <div className="mb-5 rounded-xl border border-[#F1C5BF] bg-[#FFF6F4] px-4 py-3 text-[13px] text-[#B54708]">
                    {submitError}
                </div>
            ) : null}

            <div className="flex-1" />

            <button
                onClick={onAssign}
                disabled={assigning}
                className={`w-full py-3.5 rounded-2xl font-semibold text-[14px] transition-all cursor-pointer ${
                    assigning
                        ? 'bg-[#B0ADAD] text-white cursor-not-allowed'
                        : 'bg-[#3B3F6E] text-white hover:bg-[#2E3259]'
                }`}
            >
                {assigning ? 'Assigning...' : 'Assign lesson'}
            </button>
        </div>
    );
}

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
