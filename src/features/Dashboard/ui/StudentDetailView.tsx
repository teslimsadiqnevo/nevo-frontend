'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useAuthGuard } from '@/shared/lib';
import {
    getSchoolClassesOverview,
    getSchoolStudentDetail,
    moveSchoolStudentToClass,
    removeSchoolStudent,
    resetSchoolStudentId,
} from '../api/school';

interface StudentDetailViewProps {
    studentId: number | string;
    studentData?: any;
    onBack: () => void;
    onStudentUpdated?: () => Promise<void> | void;
    initialAction?: 'view' | 'move-class';
}

interface ClassChoice {
    id: string;
    name: string;
    teacherName: string;
    studentCount: number;
}

interface LessonActivityItem {
    lesson_id: string;
    title: string;
    status: string;
    status_label: string;
    time_label: string;
}

export function StudentDetailView({
    studentId,
    studentData,
    onBack,
    onStudentUpdated,
    initialAction = 'view',
}: StudentDetailViewProps) {
    const guardAuth = useAuthGuard('school');
    const [classes, setClasses] = useState<ClassChoice[]>([]);
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(true);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [showMoveSuccess, setShowMoveSuccess] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [detailState, setDetailState] = useState(studentData || {});

    useEffect(() => {
        setDetailState(studentData || {});
    }, [studentData]);

    useEffect(() => {
        let mounted = true;

        void (async () => {
            setLoadingDetail(true);
            const res = await getSchoolStudentDetail(String(studentId));

            if (!mounted) return;
            if (guardAuth(res)) return;

            if ('error' in res && res.error) {
                setDetailError(res.error);
                setLoadingDetail(false);
                return;
            }

            setDetailState('data' in res ? res.data : {});
            setDetailError(null);
            setLoadingDetail(false);
        })();

        return () => {
            mounted = false;
        };
    }, [guardAuth, studentId]);

    useEffect(() => {
        let mounted = true;

        void (async () => {
            const res = await getSchoolClassesOverview();

            if (!mounted) return;
            if (guardAuth(res)) return;

            if ('data' in res && res.data) {
                const overviewClasses = Array.isArray(res.data?.classes) ? res.data.classes : [];
                setClasses(
                    overviewClasses.map((classItem: any) => ({
                        id: String(classItem.class_id),
                        name: classItem.class_name || 'Class',
                        teacherName: classItem.teacher_name || 'No teacher assigned',
                        studentCount: Number(classItem.student_count || 0),
                    })),
                );
            } else {
                setClasses([]);
            }

            setLoadingClasses(false);
        })();

        return () => {
            mounted = false;
        };
    }, [guardAuth]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 2200);
        return () => clearTimeout(timer);
    }, [toast]);

    useEffect(() => {
        if (initialAction === 'move-class' && !loadingDetail) {
            setShowMoveModal(true);
        }
    }, [initialAction, loadingDetail]);

    const fullName =
        detailState?.full_name ||
        detailState?.name ||
        [detailState?.first_name, detailState?.last_name].filter(Boolean).join(' ').trim() ||
        'Student';
    const firstName = detailState?.first_name || fullName.split(' ')[0] || 'Student';
    const initials = detailState?.initials || getInitials(fullName);
    const nevoId = String(detailState?.nevo_id || detailState?.student_id || studentId);
    const className = detailState?.class_name || 'Unassigned';
    const currentTeacher = detailState?.teacher_name || findTeacherNameForClass(classes, detailState?.class_id, className);
    const enrolledLabel = detailState?.enrolled_at_label || 'Unknown';
    const lastActiveLabel = detailState?.last_active_label || 'No activity yet';
    const profileLabel = detailState?.profile_completed ? 'Completed' : 'Pending';
    const pinLabel = detailState?.has_pin ? 'Set' : 'Not set';
    const lessonActivity: LessonActivityItem[] = Array.isArray(detailState?.lesson_activity)
        ? detailState.lesson_activity
        : [];

    const selectedClassChoice = useMemo(
        () => classes.find((classItem) => String(classItem.id) === String(detailState?.class_id || '')) || null,
        [classes, detailState?.class_id],
    );

    const handleMoveComplete = async (nextClass: ClassChoice) => {
        setDetailState((current: any) => ({
            ...current,
            class_id: nextClass.id,
            class_name: nextClass.name,
            teacher_name: nextClass.teacherName,
        }));
        setShowMoveModal(false);
        setShowMoveSuccess(true);
        setActionError(null);
        await onStudentUpdated?.();
    };

    const handleRemoveComplete = async () => {
        await onStudentUpdated?.();
        onBack();
    };

    if (loadingDetail) {
        return (
            <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-5">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-2 self-start text-[15px] font-normal text-[#3B3F6E]"
                >
                    <BackIcon />
                    Students
                </button>
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                    <div className="space-y-6">
                        <div className="h-[110px] rounded-[18px] bg-white/70" />
                        <div className="h-[220px] rounded-[18px] bg-white/70" />
                        <div className="h-[240px] rounded-[18px] bg-white/70" />
                    </div>
                    <div className="space-y-5">
                        <div className="h-[260px] rounded-[18px] bg-white/70" />
                        <div className="h-[220px] rounded-[18px] bg-white/70" />
                    </div>
                </div>
            </div>
        );
    }

    if (detailError) {
        return (
            <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-5">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-2 self-start text-[15px] font-normal text-[#3B3F6E]"
                >
                    <BackIcon />
                    Students
                </button>
                <div className="rounded-[16px] border border-[#E0D9CE] bg-white px-6 py-10 text-center">
                    <p className="text-[16px] font-semibold text-[#3B3F6E]">Couldn&apos;t load student details.</p>
                    <p className="mt-2 text-[14px] text-[#2B2B2F]/60">{detailError}</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-5">
                {toast ? (
                    <div className="self-start rounded-[12px] bg-[#3B3F6E] px-4 py-3 text-[13px] font-medium text-white">
                        {toast}
                    </div>
                ) : null}

                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-2 self-start text-[15px] font-normal text-[#3B3F6E]"
                >
                    <BackIcon />
                    Students
                </button>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                    <div className="min-w-0">
                        <div className="rounded-[18px] border border-[#E0D9CE] bg-white px-6 py-6">
                            <div className="flex items-start gap-4">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#3B3F6E] text-[21px] font-semibold text-[#F7F1E6]">
                                    {initials}
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-[22px] font-bold leading-[30px] text-[#2B2B2F]">{fullName}</h1>
                                    <div className="mt-1 flex items-center gap-2 text-[14px] text-[#2B2B2F]/55">
                                        <span>{nevoId}</span>
                                        <button type="button" onClick={() => void copyValue(nevoId, () => setToast('Nevo ID copied'))}>
                                            <CopyIcon />
                                        </button>
                                    </div>
                                    <p className="mt-2 text-[15px] text-[#2B2B2F]/60">
                                        {className}
                                        {currentTeacher ? ` · ${currentTeacher}` : ''}
                                    </p>
                                    <p className="mt-4 text-[14px] text-[#2B2B2F]/45">
                                        Enrolled: {enrolledLabel}
                                        <span className="mx-3">•</span>
                                        Last active: {lastActiveLabel}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <section className="mt-8">
                            <h2 className="mb-4 text-[15px] font-semibold uppercase tracking-[0.02em] text-[#6F78A8]">Current class</h2>
                            <div className="flex items-center justify-between rounded-[16px] border border-[#E0D9CE] bg-white px-5 py-5">
                                <div>
                                    <p className="text-[18px] font-semibold text-[#3B3F6E]">{className}</p>
                                    <p className="mt-1 text-[15px] text-[#2B2B2F]/55">{currentTeacher || 'Teacher not assigned yet'}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowMoveModal(true)}
                                    className="text-[15px] font-medium text-[#9A9CCB]"
                                >
                                    Move to another class
                                </button>
                            </div>
                        </section>

                        <section className="mt-8">
                            <h2 className="mb-4 text-[15px] font-semibold uppercase tracking-[0.02em] text-[#6F78A8]">Lesson activity</h2>
                            {lessonActivity.length > 0 ? (
                                <div className="rounded-[16px] border border-[#E0D9CE] bg-white px-5 py-3">
                                    <div className="flex flex-col gap-4">
                                        {lessonActivity.map((lesson) => (
                                            <div
                                                key={`${lesson.lesson_id}-${lesson.time_label}`}
                                                className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center md:gap-4"
                                            >
                                                <p className="text-[15px] font-medium text-[#2B2B2F]">{lesson.title}</p>
                                                <span className={`rounded-full px-3 py-1 text-[14px] ${statusBadgeClass(lesson.status)}`}>
                                                    {lesson.status_label}
                                                </span>
                                                <span className="text-[14px] text-[#2B2B2F]/45">{lesson.time_label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-[16px] border border-[#E0D9CE] bg-white py-12 text-center text-[15px] text-[#2B2B2F]/45">
                                    No lesson activity yet.
                                </div>
                            )}
                        </section>
                    </div>

                    <div className="flex flex-col gap-5">
                        <div className="rounded-[16px] border border-[#E0D9CE] bg-white px-5 py-5">
                            <h2 className="text-[15px] font-semibold uppercase tracking-[0.02em] text-[#6F78A8]">Actions</h2>
                            <div className="mt-5 flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowMoveModal(true)}
                                    className="flex h-[48px] items-center justify-center gap-3 rounded-[12px] border border-[#3B3F6E] text-[15px] font-medium text-[#3B3F6E]"
                                >
                                    <ArrowRightIcon />
                                    Move to another class
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setActionError(null);
                                        const res = await resetSchoolStudentId(String(studentId));
                                        if (guardAuth(res)) return;
                                        if ('error' in res && res.error) {
                                            setActionError(res.error);
                                            return;
                                        }
                                        const nextId =
                                            ('data' in res && (res.data as any)?.nevo_id) ||
                                            nevoId;
                                        setDetailState((current: any) => ({ ...current, nevo_id: nextId, student_id: nextId }));
                                        setToast('Student ID reset');
                                        await onStudentUpdated?.();
                                    }}
                                    className="flex h-[48px] items-center justify-center gap-3 rounded-[12px] border border-[#3B3F6E] text-[15px] font-medium text-[#3B3F6E]"
                                >
                                    <ResetIcon />
                                    Reset student ID
                                </button>
                                <p className="px-1 text-[14px] text-[#2B2B2F]/45">
                                    Generate a new Nevo ID if the current one has been exposed or lost.
                                </p>
                                <div className="my-2 h-px bg-[#E0D9CE]" />
                                <button
                                    type="button"
                                    onClick={() => setShowRemoveModal(true)}
                                    className="flex h-[48px] items-center justify-center gap-3 rounded-[12px] border border-[#E25B4B] text-[15px] font-medium text-[#D94836]"
                                >
                                    <WarningCircleIcon />
                                    Remove from school
                                </button>
                                <p className="px-1 text-[14px] text-[#E25B4B]">This cannot be undone.</p>
                            </div>
                            {actionError ? <p className="mt-3 text-[13px] text-[#C0392B]">{actionError}</p> : null}
                        </div>

                        <div className="rounded-[16px] border border-[#E0D9CE] bg-white px-5 py-5">
                            <div className="space-y-4">
                                <InfoRow
                                    label="Nevo ID"
                                    value={nevoId}
                                    trailing={
                                        <button type="button" onClick={() => void copyValue(nevoId, () => setToast('Nevo ID copied'))}>
                                            <CopyIcon />
                                        </button>
                                    }
                                />
                                <InfoRow label="Enrolled" value={enrolledLabel} />
                                <InfoRow label="Last active" value={lastActiveLabel} />
                                <InfoRow label="PIN status" value={pinLabel} isBadge={detailState?.has_pin} />
                                <InfoRow label="Profile" value={profileLabel} isBadge={detailState?.profile_completed} />
                                <InfoRow label="Status" value={detailState?.status_reason || 'No status yet'} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showMoveModal ? (
                <MoveStudentModal
                    studentName={fullName}
                    currentClassId={String(detailState?.class_id || selectedClassChoice?.id || '')}
                    currentClassName={className}
                    currentTeacherName={currentTeacher || 'No teacher assigned'}
                    classes={classes}
                    loading={loadingClasses}
                    onClose={() => setShowMoveModal(false)}
                    onMoved={handleMoveComplete}
                    studentId={String(studentId)}
                />
            ) : null}

            {showMoveSuccess ? (
                <MoveSuccessModal
                    studentName={fullName}
                    className={detailState?.class_name || className}
                    onClose={() => setShowMoveSuccess(false)}
                />
            ) : null}

            {showRemoveModal ? (
                <RemoveStudentModal
                    studentName={fullName}
                    className={className}
                    studentId={String(studentId)}
                    firstName={firstName}
                    onClose={() => setShowRemoveModal(false)}
                    onRemoved={handleRemoveComplete}
                />
            ) : null}
        </>
    );
}

function MoveStudentModal({
    studentName,
    currentClassId,
    currentClassName,
    currentTeacherName,
    classes,
    loading,
    onClose,
    onMoved,
    studentId,
}: {
    studentName: string;
    currentClassId: string;
    currentClassName: string;
    currentTeacherName: string;
    classes: ClassChoice[];
    loading: boolean;
    onClose: () => void;
    onMoved: (nextClass: ClassChoice) => Promise<void>;
    studentId: string;
}) {
    const guardAuth = useAuthGuard('school');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedClass = classes.find((classItem) => classItem.id === selectedClassId) || null;
    const movableClasses = classes.filter((classItem) => classItem.id !== currentClassId);
    const canSave = Boolean(selectedClassId);

    return (
        <ModalShell onClose={onClose}>
            <div className="w-full max-w-[480px] rounded-[16px] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                <div className="flex items-center justify-between">
                    <h2 className="text-[20px] font-bold leading-[30px] text-[#3B3F6E]">Move student to another class</h2>
                    <button type="button" onClick={onClose} className="p-2 text-[#3B3F6E]/70">
                        <CloseSmallIcon />
                    </button>
                </div>

                <div className="mt-4 flex items-center gap-3 border-b border-[#EDE7DD] pb-4">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3B3F6E] text-[12px] font-semibold text-white">
                        {getInitials(studentName)}
                    </div>
                    <div>
                        <p className="text-[15px] font-medium text-[#2B2B2F]">{studentName}</p>
                        <p className="text-[13px] text-[#2B2B2F]/45">{currentClassName}</p>
                    </div>
                </div>

                <div className="mt-5">
                    <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.04em] text-[#6F78A8]">Select new class</p>
                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            disabled
                            className="grid grid-cols-1 gap-2 rounded-[12px] border border-[#E0D9CE] bg-[#F7F1E6]/35 px-4 py-3 text-left opacity-55 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center"
                        >
                            <div>
                                <p className="text-[15px] font-medium text-[#3B3F6E]">{currentClassName}</p>
                                <p className="text-[13px] text-[#2B2B2F]/45">{currentTeacherName}</p>
                            </div>
                            <span className="text-[12px] text-[#2B2B2F]/45">Current</span>
                        </button>

                        {loading ? (
                            <div className="py-6 text-center text-[14px] text-[#2B2B2F]/45">Loading classes...</div>
                        ) : (
                            movableClasses.map((classItem) => {
                                const selected = classItem.id === selectedClassId;
                                return (
                                    <button
                                        key={classItem.id}
                                        type="button"
                                        onClick={() => setSelectedClassId(classItem.id)}
                                        className={`grid grid-cols-1 gap-2 rounded-[12px] border px-4 py-3 text-left md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center ${
                                            selected
                                                ? 'border-[#3B3F6E] bg-white shadow-[inset_0_0_0_1px_#3B3F6E]'
                                                : 'border-[#E0D9CE] bg-[#F7F1E6] hover:border-[#CFC6BA]'
                                        }`}
                                    >
                                        <div>
                                            <p className="text-[15px] font-medium text-[#3B3F6E]">{classItem.name}</p>
                                            <p className="text-[13px] text-[#2B2B2F]/55">{classItem.teacherName}</p>
                                        </div>
                                        <span className="text-[12px] text-[#2B2B2F]/45">{classItem.studentCount} students</span>
                                        <span className="ml-3">{selected ? <SelectedCheckIcon /> : null}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="mt-5">
                    <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.04em] text-[#6F78A8]">Notify teacher (optional)</p>
                    <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Add a note for the new teacher..."
                        className="min-h-[72px] w-full rounded-[12px] border border-[#E0D9CE] bg-white px-4 py-4 text-[14px] text-[#2B2B2F] outline-none placeholder:text-[#2B2B2F]/35"
                    />
                </div>

                {error ? <p className="mt-3 text-[13px] text-[#C0392B]">{error}</p> : null}

                <button
                    type="button"
                    disabled={!canSave || saving}
                    onClick={async () => {
                        if (!selectedClass) return;
                        setSaving(true);
                        setError(null);
                        const res = await moveSchoolStudentToClass({
                            studentId,
                            classId: selectedClass.id,
                            note: note.trim(),
                        });
                        setSaving(false);
                        if (guardAuth(res)) return;

                        if ('error' in res && res.error) {
                            setError(res.error);
                            return;
                        }

                        await onMoved(selectedClass);
                    }}
                    className={`mt-5 flex h-[52px] w-full items-center justify-center rounded-[12px] text-[15px] font-semibold text-[#F7F1E6] ${
                        !canSave || saving ? 'bg-[rgba(59,63,110,0.4)]' : 'bg-[#3B3F6E]'
                    }`}
                >
                    {saving ? 'Moving student...' : 'Move student'}
                </button>

                <button type="button" onClick={onClose} className="mt-4 block w-full text-center text-[14px] text-[#6F78A8]">
                    Cancel
                </button>
            </div>
        </ModalShell>
    );
}

function MoveSuccessModal({
    studentName,
    className,
    onClose,
}: {
    studentName: string;
    className: string;
    onClose: () => void;
}) {
    return (
        <ModalShell onClose={onClose}>
            <div className="w-full max-w-[480px] rounded-[16px] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                <div className="flex flex-col items-center py-3 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(122,184,122,0.2)]">
                        <SuccessCheckIcon />
                    </div>
                    <p className="mt-6 text-[18px] font-medium text-[#2B2B2F]">
                        {studentName} moved to {className}.
                    </p>
                    <p className="mt-3 text-[14px] text-[#2B2B2F]/40">The new class teacher has been notified.</p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="mt-8 flex h-[52px] w-full items-center justify-center rounded-[12px] bg-[#3B3F6E] text-[15px] font-semibold text-[#F7F1E6]"
                    >
                        Done
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

function RemoveStudentModal({
    studentName,
    className,
    studentId,
    firstName,
    onClose,
    onRemoved,
}: {
    studentName: string;
    className: string;
    studentId: string;
    firstName: string;
    onClose: () => void;
    onRemoved: () => Promise<void>;
}) {
    const guardAuth = useAuthGuard('school');
    const [typedName, setTypedName] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const matches = typedName.trim().toLowerCase() === firstName.trim().toLowerCase();

    return (
        <ModalShell onClose={onClose}>
            <div className="w-full max-w-[420px] rounded-[16px] bg-white px-8 py-7 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                <div className="flex flex-col items-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(226,91,75,0.15)]">
                        <WarningCircleIcon large />
                    </div>
                    <h2 className="mt-6 text-[20px] font-bold leading-[30px] text-[#3B3F6E]">Remove this student?</h2>
                    <p className="mt-2 text-[15px] text-[#2B2B2F]/55">
                        {studentName} · {className}
                    </p>
                </div>

                <ul className="mt-6 space-y-3 text-[15px] text-[#2B2B2F]/55">
                    <li className="flex gap-3"><span className="mt-[8px] h-1.5 w-1.5 rounded-full bg-[#D94836]" />Their account and Nevo ID will be permanently deleted</li>
                    <li className="flex gap-3"><span className="mt-[8px] h-1.5 w-1.5 rounded-full bg-[#D94836]" />All lesson progress and learning data will be removed</li>
                    <li className="flex gap-3"><span className="mt-[8px] h-1.5 w-1.5 rounded-full bg-[#D94836]" />This cannot be undone</li>
                </ul>

                <p className="mt-6 text-[14px] font-medium text-[#6F78A8]">
                    To confirm, type the student&apos;s first name below:
                </p>

                <input
                    value={typedName}
                    onChange={(event) => setTypedName(event.target.value)}
                    placeholder="Type name to confirm"
                    className="mt-4 h-[48px] w-full rounded-[12px] border border-[#3B3F6E] bg-white px-4 text-center text-[15px] text-[#2B2B2F] outline-none"
                />

                {error ? <p className="mt-3 text-[13px] text-[#C0392B]">{error}</p> : null}

                <button
                    type="button"
                    disabled={!matches || saving}
                    onClick={async () => {
                        setSaving(true);
                        setError(null);
                        const res = await removeSchoolStudent(studentId);
                        setSaving(false);
                        if (guardAuth(res)) return;

                        if ('error' in res && res.error) {
                            setError(res.error);
                            return;
                        }

                        await onRemoved();
                    }}
                    className={`mt-5 flex h-[52px] w-full items-center justify-center rounded-[12px] text-[15px] font-semibold text-white ${
                        !matches || saving ? 'bg-[#F0E8DE] text-[#E25B4B]/45' : 'bg-[#D33F2E]'
                    }`}
                >
                    {saving ? 'Removing student...' : 'Remove student'}
                </button>

                <button
                    type="button"
                    onClick={onClose}
                    className="mt-4 flex h-[52px] w-full items-center justify-center rounded-[12px] bg-[#4A4D83] text-[15px] font-semibold text-[#F7F1E6]"
                >
                    Cancel
                </button>

                <p className="mt-4 text-center text-[12px] text-[#2B2B2F]/30">
                    If you just need to move this student, use Move to class instead.
                </p>
            </div>
        </ModalShell>
    );
}

function ModalShell({ children, onClose }: { children: ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 px-4 py-6 sm:px-6" onClick={onClose}>
            <div className="flex min-h-full items-center justify-center" onClick={(event) => event.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}

function InfoRow({
    label,
    value,
    trailing,
    isBadge = false,
}: {
    label: string;
    value: string;
    trailing?: ReactNode;
    isBadge?: boolean;
}) {
    return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:items-center sm:gap-3">
            <span className="text-[15px] text-[#2B2B2F]">{label}</span>
            {isBadge ? (
                <span className="justify-self-start rounded-full bg-[rgba(122,184,122,0.2)] px-3 py-1 text-[14px] text-[#7AB87A] sm:justify-self-end">{value}</span>
            ) : (
                <span className="justify-self-start text-[15px] text-[#2B2B2F]/65 sm:justify-self-end">{value}</span>
            )}
            <span>{trailing}</span>
        </div>
    );
}

function findTeacherNameForClass(classes: ClassChoice[], classId?: string, className?: string) {
    const byId = classes.find((classItem) => String(classItem.id) === String(classId || ''));
    if (byId) return byId.teacherName;
    const byName = classes.find((classItem) => classItem.name === className);
    return byName?.teacherName || '';
}

function statusBadgeClass(status: string) {
    const normalized = String(status || '').toLowerCase();
    if (normalized.includes('complete')) return 'bg-[rgba(122,184,122,0.15)] text-[#7AB87A]';
    if (normalized.includes('start') || normalized.includes('progress')) return 'bg-[rgba(154,156,203,0.12)] text-[#9A9CCB]';
    return 'bg-[rgba(247,241,230,1)] text-[#2B2B2F]/45';
}

function getInitials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('') || 'ST';
}

async function copyValue(value: string, onDone: () => void) {
    try {
        await navigator.clipboard.writeText(value);
        onDone();
    } catch {
        // no-op
    }
}

function BackIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11.5 4.5L7 9L11.5 13.5" stroke="#3B3F6E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function CopyIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M5.5 5.5H11.5V11.5H5.5V5.5Z" stroke="#3B3F6E" strokeWidth="1" />
            <path d="M4 10.5H3.5C2.94772 10.5 2.5 10.0523 2.5 9.5V3.5C2.5 2.94772 2.94772 2.5 3.5 2.5H9.5C10.0523 2.5 10.5 2.94772 10.5 3.5V4" stroke="#3B3F6E" strokeWidth="1" />
        </svg>
    );
}

function ArrowRightIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="#3B3F6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function ResetIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12.5 4.5V8.5H8.5" stroke="#3B3F6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11.25 11.25C10.4167 12.0833 9.25 12.5 8 12.5C5.51472 12.5 3.5 10.4853 3.5 8C3.5 5.51472 5.51472 3.5 8 3.5C9.25 3.5 10.4167 3.91667 11.25 4.75L12.5 6" stroke="#3B3F6E" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function WarningCircleIcon({ large = false }: { large?: boolean }) {
    const size = large ? 22 : 16;
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="7" stroke="#D94836" strokeWidth="1.6" />
            <path d="M10 6V10.2" stroke="#D94836" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="10" cy="13.5" r="0.8" fill="#D94836" />
        </svg>
    );
}

function SelectedCheckIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="10" fill="#3B3F6E" />
            <path d="M7.5 11.5L9.7 13.7L14.5 8.9" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function SuccessCheckIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M7 12L10.3 15.3L17 8.6" stroke="#7AB87A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function CloseSmallIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M6 6L14 14M14 6L6 14" stroke="#3B3F6E" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}
