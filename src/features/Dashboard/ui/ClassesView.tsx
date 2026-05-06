'use client';

import { useEffect, useState } from 'react';
import { useAuthGuard } from '@/shared/lib';
import {
    archiveSchoolClass,
    createSchoolClass,
    getSchoolClassDetail,
    getSchoolClassEditForm,
    getSchoolClassFormOptions,
    getSchoolClassesOverview,
    updateSchoolClass,
} from '../api/school';
import { DashboardViewSkeleton, DetailViewSkeleton, ModalFormSkeleton } from './DashboardSkeletons';

export function ClassesView() {
    const guardAuth = useAuthGuard('school');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [overview, setOverview] = useState<any | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [detail, setDetail] = useState<any | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);

    const loadOverview = async () => {
        setLoading(true);
        const res = await getSchoolClassesOverview();
        if (guardAuth(res)) return;

        if ('error' in res && res.error) {
            setError(res.error);
            setOverview(null);
        } else {
            setError(null);
            setOverview('data' in res ? res.data : null);
        }

        setLoading(false);
    };

    const loadDetail = async (classId: string) => {
        setDetailLoading(true);
        const res = await getSchoolClassDetail(classId);
        if (guardAuth(res)) return;

        if ('error' in res && res.error) {
            setError(res.error);
            setDetail(null);
        } else {
            setError(null);
            setDetail('data' in res ? res.data : null);
        }

        setDetailLoading(false);
    };

    useEffect(() => {
        void loadOverview();
    }, []);

    useEffect(() => {
        if (!selectedClassId) {
            setDetail(null);
            return;
        }

        void loadDetail(selectedClassId);
    }, [selectedClassId]);

    if (selectedClassId) {
        return (
            <>
                <ClassDetailView
                    detail={detail}
                    loading={detailLoading}
                    error={error}
                    onBack={() => setSelectedClassId(null)}
                    onEdit={() => setShowEditModal(true)}
                    onArchive={() => setShowArchiveModal(true)}
                />

                {showEditModal && detail ? (
                    <EditClassModal
                        classId={selectedClassId}
                        onClose={() => setShowEditModal(false)}
                        onSaved={async () => {
                            setShowEditModal(false);
                            await loadOverview();
                            await loadDetail(selectedClassId);
                        }}
                    />
                ) : null}

                {showArchiveModal && detail ? (
                    <ArchiveClassModal
                        className={detail.class_name}
                        activeAssignments={Number(detail.lessons?.length || 0)}
                        onClose={() => setShowArchiveModal(false)}
                        onConfirm={async () => {
                            const res = await archiveSchoolClass(selectedClassId);
                            if ('error' in res && res.error) {
                                setError(res.error);
                                return;
                            }

                            setShowArchiveModal(false);
                            setSelectedClassId(null);
                            await loadOverview();
                        }}
                    />
                ) : null}
            </>
        );
    }

    return (
        <>
            <div className="mx-auto flex w-full max-w-[1136px] flex-col gap-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-[22px] font-bold leading-[33px] text-[#3B3F6E]">Classes</h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex h-[44px] items-center gap-2 rounded-[12px] bg-[#3B3F6E] px-5 text-[14px] font-semibold text-[#F7F1E6] transition-colors hover:bg-[#30345F]"
                    >
                        <span className="text-[16px] leading-none">+</span>
                        Create class
                    </button>
                </div>

                {loading ? (
                    <DashboardViewSkeleton titleWidth="w-32" cardCount={3} rowCount={4} />
                ) : error ? (
                    <div className="text-[14px] text-[#D4534A]">{error}</div>
                ) : overview?.show_empty_state ? (
                    <ClassesEmptyState
                        title={overview?.empty_state?.title || 'No classes yet.'}
                        description={overview?.empty_state?.description || 'Create your first class.'}
                        cta={overview?.empty_state?.primary_action_label || 'Create class'}
                        onCreateClick={() => setShowCreateModal(true)}
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {(overview?.classes || []).map((classItem: any) => (
                            <ClassCard
                                key={classItem.class_id}
                                classItem={classItem}
                                onOpen={() => setSelectedClassId(classItem.class_id)}
                                onEdit={() => {
                                    setSelectedClassId(classItem.class_id);
                                    setShowEditModal(true);
                                }}
                                onArchive={() => {
                                    setSelectedClassId(classItem.class_id);
                                    setShowArchiveModal(true);
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {showCreateModal ? (
                <CreateClassModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={async () => {
                        setShowCreateModal(false);
                        await loadOverview();
                    }}
                />
            ) : null}
        </>
    );
}

function ClassCard({
    classItem,
    onOpen,
    onEdit,
    onArchive,
}: {
    classItem: any;
    onOpen: () => void;
    onEdit: () => void;
    onArchive: () => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const initials = getAvatarInitials(classItem.teacher_name || classItem.class_name);

    return (
        <div
            className="group relative rounded-[12px] border border-[#E0D9CE] bg-white p-5 transition-shadow hover:shadow-[0_8px_24px_rgba(59,63,110,0.08)]"
        >
            <button type="button" onClick={onOpen} className="absolute inset-0 rounded-[12px]" aria-label={`Open ${classItem.class_name}`} />

            <div className="relative z-[1]">
                <h3 className="text-[16px] font-semibold leading-[24px] text-[#3B3F6E]">
                    {classItem.class_name}
                </h3>

                <div className="mt-3 flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#9A9CCB] text-[10px] font-semibold uppercase text-white">
                        {initials}
                    </div>
                    <p className="text-[13px] leading-[20px] text-[#2B2B2F]/65">
                        {classItem.teacher_name || 'No teacher assigned'}
                    </p>
                </div>

                <div className="mt-4">
                    <span className="inline-flex rounded-full bg-[#F2EFFA] px-3 py-1 text-[11px] font-medium text-[#3B3F6E]">
                        {classItem.education_level || classItem.subject || 'Class'}
                    </span>
                </div>

                <p className="mt-5 text-[13px] leading-[20px] text-[#2B2B2F]/55">
                    {classItem.student_count} students · {classItem.lessons_assigned} lessons assigned
                </p>

                <div className="mt-4 flex items-center justify-between">
                    <p className="text-[12px] leading-[18px] text-[#2B2B2F]/45">
                        Last active: {classItem.last_activity_label}
                    </p>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                setMenuOpen((current) => !current);
                            }}
                            className="relative z-[2] flex h-8 w-8 items-center justify-center rounded-full text-[#2B2B2F]/55 hover:bg-[rgba(59,63,110,0.05)]"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="3.25" r="1" fill="currentColor" />
                                <circle cx="8" cy="8" r="1" fill="currentColor" />
                                <circle cx="8" cy="12.75" r="1" fill="currentColor" />
                            </svg>
                        </button>
                        {menuOpen ? (
                            <div className="absolute right-0 top-9 z-10 w-[120px] rounded-[10px] border border-[#E0D9CE] bg-white p-1 shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setMenuOpen(false);
                                        onEdit();
                                    }}
                                    className="flex h-9 w-full items-center rounded-[8px] px-3 text-left text-[13px] text-[#2B2B2F] hover:bg-[rgba(59,63,110,0.05)]"
                                >
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setMenuOpen(false);
                                        onArchive();
                                    }}
                                    className="flex h-9 w-full items-center rounded-[8px] px-3 text-left text-[13px] text-[#2B2B2F] hover:bg-[rgba(232,168,74,0.12)]"
                                >
                                    Archive
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ClassesEmptyState({
    title,
    description,
    cta,
    onCreateClick,
}: {
    title: string;
    description: string;
    cta: string;
    onCreateClick: () => void;
}) {
    return (
        <div className="flex min-h-[680px] flex-col items-center justify-center">
            <div className="flex h-[92px] w-[92px] items-center justify-center rounded-full bg-[rgba(154,156,203,0.12)]">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <rect x="9" y="11" width="22" height="18" rx="3" stroke="#C6C1E6" strokeWidth="2" />
                    <path d="M9 17H31" stroke="#C6C1E6" strokeWidth="2" />
                </svg>
            </div>
            <p className="mt-6 text-[15px] leading-[22px] text-[#2B2B2F]/60">
                {title} {description}
            </p>
            <button
                onClick={onCreateClick}
                className="mt-6 flex h-12 items-center gap-2 rounded-[12px] bg-[#3B3F6E] px-6 text-[14px] font-semibold text-[#F7F1E6]"
            >
                <span className="text-[16px] leading-none">+</span>
                {cta}
            </button>
        </div>
    );
}

function ClassDetailView({
    detail,
    loading,
    error,
    onBack,
    onEdit,
    onArchive,
}: {
    detail: any;
    loading: boolean;
    error: string | null;
    onBack: () => void;
    onEdit: () => void;
    onArchive: () => void;
}) {
    if (loading) return <DetailViewSkeleton backLabel="Classes" />;

    if (error) {
        return <div className="text-[14px] text-[#D4534A]">{error}</div>;
    }

    if (!detail) {
        return <div className="text-[14px] text-[#2B2B2F]/60">Class not found.</div>;
    }

    return (
        <div className="mx-auto flex w-full max-w-[1136px] flex-col gap-5">
            <button
                onClick={onBack}
                className="flex items-center gap-1 self-start text-[13px] font-medium text-[#3B3F6E]"
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 12L6 8L10 4" />
                </svg>
                Classes
            </button>

            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-[22px] font-bold text-[#3B3F6E]">{detail.class_name}</h1>
                    <p className="mt-1 text-[13px] text-[#2B2B2F]/55">
                        {detail.subject || 'General'} · {detail.education_level || 'Education level not set'}
                    </p>
                    <p className="mt-2 text-[13px] font-medium text-[#3B3F6E]">
                        {detail.teacher?.teacher_name || 'No teacher assigned yet'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onEdit}
                        className="h-11 rounded-[10px] border border-[#3B3F6E] px-4 text-[14px] font-medium text-[#3B3F6E]"
                    >
                        Edit class
                    </button>
                    <button
                        onClick={onArchive}
                        className="h-11 rounded-[10px] border border-[#E0D9CE] px-4 text-[14px] font-medium text-[#2B2B2F]/70"
                    >
                        Archive
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
                <div className="min-w-0">
                    <SectionCard title={`Students (${detail.students?.length || 0})`}>
                        {(detail.students || []).length > 0 ? (
                            detail.students.map((student: any) => (
                                <div key={student.student_id} className="flex items-center justify-between border-b border-[#F0E9DD] px-4 py-3 last:border-b-0">
                                    <div>
                                        <p className="text-[13px] font-semibold text-[#3B3F6E]">{student.student_name}</p>
                                        <p className="text-[11px] text-[#2B2B2F]/40">{student.last_activity_label}</p>
                                    </div>
                                    <span className={`h-2 w-2 rounded-full ${student.activity_status === 'active' ? 'bg-[#7AB87A]' : 'bg-[#E8A84A]'}`} />
                                </div>
                            ))
                        ) : (
                            <EmptySectionText text="No students in this class yet." />
                        )}
                    </SectionCard>

                    <div className="mt-6">
                        <SectionCard title={`Assigned lessons (${detail.lessons?.length || 0})`}>
                            {(detail.lessons || []).length > 0 ? (
                                detail.lessons.map((lesson: any) => (
                                    <div key={lesson.lesson_id} className="flex items-center justify-between border-b border-[#F0E9DD] px-4 py-3 last:border-b-0">
                                        <div>
                                            <p className="text-[13px] font-semibold text-[#3B3F6E]">{lesson.title}</p>
                                            <p className="text-[11px] text-[#2B2B2F]/40">{lesson.assigned_at_label}</p>
                                        </div>
                                        <p className="text-[12px] text-[#2B2B2F]/55">
                                            {lesson.completed_count}/{lesson.total_count} completed
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <EmptySectionText text="No lessons assigned yet." />
                            )}
                        </SectionCard>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {detail.overview ? (
                        <div className="rounded-[12px] border border-[#E0D9CE] bg-white p-5">
                            <h3 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[#3B3F6E]/70">
                                Overview
                            </h3>
                            <div className="mt-4 flex flex-col gap-3">
                                <SidebarStat label="Active students" value={detail.overview.active_students_label} />
                                <SidebarStat label="Completion rate" value={detail.overview.completion_rate_label} />
                                <SidebarStat label="Most active day" value={detail.overview.most_active_day_label} />
                            </div>
                        </div>
                    ) : null}

                    <div className="rounded-[12px] border border-[#E0D9CE] bg-white p-5">
                        <h3 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[#3B3F6E]/70">
                            Needs support
                        </h3>
                        {(detail.support_students || []).length > 0 ? (
                            <div className="mt-4 flex flex-col gap-3">
                                {detail.support_students.map((student: any) => (
                                    <div key={student.student_id}>
                                        <p className="text-[13px] font-semibold text-[#3B3F6E]">{student.student_name}</p>
                                        <p className="text-[11px] text-[#2B2B2F]/45">{student.reason}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-4 text-[12px] text-[#2B2B2F]/55">No flagged students right now.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h2 className="mb-4 text-[15px] font-semibold text-[#3B3F6E]">{title}</h2>
            <div className="overflow-hidden rounded-[12px] border border-[#E0D9CE] bg-white">{children}</div>
        </div>
    );
}

function EmptySectionText({ text }: { text: string }) {
    return <div className="px-4 py-8 text-[13px] text-[#2B2B2F]/55">{text}</div>;
}

function SidebarStat({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[12px] text-[#2B2B2F]/40">{label}</p>
            <p className="text-[12px] font-medium text-[#3B3F6E]">{value}</p>
        </div>
    );
}

function CreateClassModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => Promise<void> }) {
    const [options, setOptions] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '',
        teacher_id: '',
        education_level: '',
        subject: '',
        academic_year: '',
    });

    useEffect(() => {
        let mounted = true;

        void (async () => {
            const res = await getSchoolClassFormOptions();
            if (!mounted) return;

            if ('error' in res && res.error) {
                setError(res.error);
            } else {
                const data = 'data' in res ? res.data : null;
                setOptions(data);
                setForm((current) => ({
                    ...current,
                    education_level: data?.education_levels?.[0] || '',
                    subject: data?.subjects?.[0] || '',
                }));
            }

            setLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, []);

    const canSave = Boolean(form.name.trim() && form.education_level && form.subject);

    const handleSave = async () => {
        if (!canSave) return;

        setSaving(true);
        setError(null);

        const res = await createSchoolClass({
            ...form,
            teacher_id: form.teacher_id || null,
            academic_year: form.academic_year || null,
        });

        setSaving(false);

        if ('error' in res && res.error) {
            setError(res.error);
            return;
        }

        await onCreated();
    };

    return (
        <ClassFormShell title="Create a class" onClose={onClose}>
            {loading ? (
                <ModalFormSkeleton />
            ) : (
                <div className="flex flex-col gap-5">
                    <TextInput
                        value={form.name}
                        onChange={(value) => setForm({ ...form, name: value })}
                        placeholder="e.g. Grade 7 Mathematics"
                    />

                    <SelectField
                        value={form.teacher_id}
                        onChange={(value) => setForm({ ...form, teacher_id: value })}
                        options={[
                            { label: 'Select a teacher', value: '' },
                            ...(options?.teachers || []).map((teacher: any) => ({
                                label: teacher.teacher_name,
                                value: teacher.teacher_id,
                            })),
                        ]}
                    />

                    <FieldLabel text="Education level" />
                    <PillSelector
                        items={options?.education_levels || []}
                        value={form.education_level}
                        onChange={(value) => setForm({ ...form, education_level: value })}
                    />

                    <FieldLabel text="Subject(s)" />
                    <PillSelector
                        items={options?.subjects || []}
                        value={form.subject}
                        onChange={(value) => setForm({ ...form, subject: value })}
                        wrap
                    />

                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <FieldLabel text="Academic year / Term" />
                            <span className="rounded-full bg-[#B4B0DF] px-2 py-[2px] text-[11px] text-white">
                                Optional
                            </span>
                        </div>
                        <TextInput
                            value={form.academic_year}
                            onChange={(value) => setForm({ ...form, academic_year: value })}
                            placeholder=""
                        />
                    </div>

                    {error ? <p className="text-[12px] text-[#D4534A]">{error}</p> : null}

                    <button
                        disabled={!canSave || saving}
                        onClick={() => void handleSave()}
                        className={`h-[56px] rounded-[12px] text-[16px] font-semibold ${
                            canSave
                                ? 'bg-[#3B3F6E] text-[#F7F1E6]'
                                : 'bg-[#B8B6C8] text-white'
                        }`}
                    >
                        {saving ? 'Creating...' : 'Create class'}
                    </button>

                    <button onClick={onClose} className="text-[14px] text-[#3B3F6E]/65">
                        Cancel
                    </button>
                </div>
            )}
        </ClassFormShell>
    );
}

function EditClassModal({ classId, onClose, onSaved }: { classId: string; onClose: () => void; onSaved: () => Promise<void> }) {
    const [options, setOptions] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '',
        teacher_id: '',
        education_level: '',
        subject: '',
        academic_year: '',
    });

    useEffect(() => {
        let mounted = true;

        void (async () => {
            const res = await getSchoolClassEditForm(classId);
            if (!mounted) return;

            if ('error' in res && res.error) {
                setError(res.error);
            } else {
                const data = 'data' in res ? res.data : null;
                setOptions(data);
                setForm({
                    name: data?.values?.name || '',
                    teacher_id: data?.values?.teacher_id || '',
                    education_level: data?.values?.education_level || '',
                    subject: data?.values?.subject || '',
                    academic_year: data?.values?.academic_year || '',
                });
            }

            setLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, [classId]);

    const canSave = Boolean(form.name.trim() && form.education_level && form.subject);

    const handleSave = async () => {
        if (!canSave) return;

        setSaving(true);
        setError(null);

        const res = await updateSchoolClass(classId, {
            ...form,
            teacher_id: form.teacher_id || '',
            clear_teacher: !form.teacher_id,
        });

        setSaving(false);

        if ('error' in res && res.error) {
            setError(res.error);
            return;
        }

        await onSaved();
    };

    return (
        <ClassFormShell title="Edit class" onClose={onClose}>
            {loading ? (
                <ModalFormSkeleton />
            ) : (
                <div className="flex flex-col gap-5">
                    <TextInput value={form.name} onChange={(value) => setForm({ ...form, name: value })} placeholder="" />

                    <SelectField
                        value={form.teacher_id}
                        onChange={(value) => setForm({ ...form, teacher_id: value })}
                        options={[
                            { label: 'No teacher yet', value: '' },
                            ...(options?.teachers || []).map((teacher: any) => ({
                                label: teacher.teacher_name,
                                value: teacher.teacher_id,
                            })),
                        ]}
                    />

                    <FieldLabel text="Education level" />
                    <PillSelector
                        items={options?.education_levels || []}
                        value={form.education_level}
                        onChange={(value) => setForm({ ...form, education_level: value })}
                    />

                    <FieldLabel text="Subject(s)" />
                    <PillSelector
                        items={options?.subjects || []}
                        value={form.subject}
                        onChange={(value) => setForm({ ...form, subject: value })}
                        wrap
                    />

                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <FieldLabel text="Academic year / Term" />
                            <span className="rounded-full bg-[#B4B0DF] px-2 py-[2px] text-[11px] text-white">
                                Optional
                            </span>
                        </div>
                        <TextInput value={form.academic_year} onChange={(value) => setForm({ ...form, academic_year: value })} placeholder="" />
                    </div>

                    {error ? <p className="text-[12px] text-[#D4534A]">{error}</p> : null}

                    <button
                        onClick={() => void handleSave()}
                        disabled={!canSave || saving}
                        className={`h-[56px] rounded-[12px] text-[16px] font-semibold ${
                            canSave
                                ? 'bg-[#3B3F6E] text-[#F7F1E6]'
                                : 'bg-[#B8B6C8] text-white'
                        }`}
                    >
                        {saving ? 'Saving...' : 'Save changes'}
                    </button>

                    <button onClick={onClose} className="text-[14px] text-[#3B3F6E]/65">
                        Cancel
                    </button>
                </div>
            )}
        </ClassFormShell>
    );
}

function ArchiveClassModal({
    className,
    activeAssignments,
    onClose,
    onConfirm,
}: {
    className: string;
    activeAssignments: number;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
            <div className="w-full max-w-[480px] rounded-[16px] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                <div className="flex justify-center pt-7">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(232,168,74,0.25)]">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <circle cx="14" cy="14" r="10.5" stroke="#E8A84A" strokeWidth="1.75" />
                            <path d="M14 8V16" stroke="#E8A84A" strokeWidth="1.75" strokeLinecap="round" />
                            <circle cx="14" cy="20.25" r="1.2" fill="#E8A84A" />
                        </svg>
                    </div>
                </div>

                <div className="px-8 pb-8 pt-6 text-center">
                    <h2 className="text-[20px] font-bold text-[#3B3F6E]">Archive this class?</h2>
                    <p className="mt-3 text-[16px] font-semibold text-[#2B2B2F]">{className}</p>
                    <p className="mx-auto mt-4 max-w-[384px] text-[14px] leading-[22px] text-[#2B2B2F]/65">
                        Archiving will remove this class from your active workspace. Teachers and students currently in this class will lose access to class-specific features.
                    </p>

                    {activeAssignments > 0 ? (
                        <div className="mt-4 rounded-[8px] bg-[rgba(232,168,74,0.12)] p-3 text-left">
                            <p className="text-[13px] font-semibold text-[#C47D0E]">
                                {activeAssignments} active lesson assignments
                            </p>
                            <p className="mt-1 text-[12px] leading-[18px] text-[#C47D0E]/80">
                                Students with active assignments can still complete them.
                            </p>
                        </div>
                    ) : null}

                    <div className="mt-8 flex flex-col gap-3">
                        <button
                            onClick={() => void onConfirm()}
                            className="h-[52px] rounded-[12px] border-[1.5px] border-[#3B3F6E]/50 text-[15px] font-medium text-[#3B3F6E]/50"
                        >
                            Archive class
                        </button>
                        <button
                            onClick={onClose}
                            className="h-[52px] rounded-[12px] bg-[#3B3F6E] text-[15px] font-semibold text-[#F7F1E6]"
                        >
                            Cancel
                        </button>
                    </div>

                    <p className="mt-3 text-[12px] text-[#2B2B2F]/40">
                        You can restore archived classes from Settings.
                    </p>
                </div>
            </div>
        </div>
    );
}

function ClassFormShell({
    title,
    onClose,
    children,
}: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#F7F1E6] px-6 py-20">
            <div className="mx-auto w-full max-w-[560px]">
                <button
                    onClick={onClose}
                    className="mb-8 ml-auto flex h-11 w-11 items-center justify-center rounded-full text-[#3B3F6E]"
                    aria-label="Close"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M6 6L18 18M18 6L6 18" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>

                <div className="rounded-[20px]">
                    <h2 className="text-center text-[22px] font-bold text-[#3B3F6E]">{title}</h2>
                    <div className="mt-10 px-6">{children}</div>
                </div>
            </div>
        </div>
    );
}

function TextInput({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    return (
        <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="h-[56px] w-full rounded-[12px] border border-[rgba(59,63,110,0.35)] bg-[#F7F1E6] px-4 text-[15px] text-[#2B2B2F] outline-none placeholder:text-[#2B2B2F]/25"
        />
    );
}

function SelectField({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (value: string) => void;
    options: Array<{ label: string; value: string }>;
}) {
    return (
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-[56px] w-full rounded-[12px] border border-[rgba(59,63,110,0.35)] bg-[#F7F1E6] px-4 text-[15px] text-[#2B2B2F] outline-none"
        >
            {options.map((option) => (
                <option key={`${option.label}-${option.value}`} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}

function FieldLabel({ text }: { text: string }) {
    return <p className="text-[15px] font-medium text-[#3B3F6E]">{text}</p>;
}

function PillSelector({
    items,
    value,
    onChange,
    wrap = false,
}: {
    items: string[];
    value: string;
    onChange: (value: string) => void;
    wrap?: boolean;
}) {
    return (
        <div className={`flex gap-3 ${wrap ? 'flex-wrap' : 'flex-wrap'}`}>
            {items.map((item) => {
                const active = item === value;

                return (
                    <button
                        key={item}
                        type="button"
                        onClick={() => onChange(item)}
                        className={`rounded-full border px-6 py-2 text-[14px] ${
                            active
                                ? 'border-[#3B3F6E] bg-[#3B3F6E] text-[#F7F1E6]'
                                : 'border-[#3B3F6E] bg-transparent text-[#3B3F6E]'
                        }`}
                    >
                        {item}
                    </button>
                );
            })}
        </div>
    );
}

function getAvatarInitials(text: string) {
    return text
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}
