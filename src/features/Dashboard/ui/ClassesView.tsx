'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    archiveSchoolClass,
    createSchoolClass,
    getSchoolClassDetail,
    getSchoolClassEditForm,
    getSchoolClassFormOptions,
    getSchoolClassesOverview,
    updateSchoolClass,
} from '../api/school';

export function ClassesView() {
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
            <div className="w-full flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-[22px] font-bold text-[#3B3F6E] tracking-tight">Classes</h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-5 py-[10px] bg-[#3B3F6E] text-white rounded-lg text-[13px] font-semibold hover:bg-[#2C2F52] transition-colors cursor-pointer"
                    >
                        <span className="text-[15px] leading-none">+</span>
                        Create class
                    </button>
                </div>

                {loading ? (
                    <div className="text-[14px] text-graphite-60">Loading classes...</div>
                ) : error ? (
                    <div className="text-[14px] text-[#D4534A]">{error}</div>
                ) : overview?.show_empty_state ? (
                    <ClassesEmptyState
                        title={overview?.empty_state?.title || 'No classes yet'}
                        description={overview?.empty_state?.description || 'Create your first class.'}
                        cta={overview?.empty_state?.primary_action_label || 'Create class'}
                        onCreateClick={() => setShowCreateModal(true)}
                    />
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        {(overview?.classes || []).map((classItem: any) => (
                            <button
                                key={classItem.class_id}
                                onClick={() => setSelectedClassId(classItem.class_id)}
                                className="bg-white rounded-2xl p-5 border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow text-left"
                            >
                                <h3 className="text-[15px] font-bold text-[#3B3F6E] mb-3">{classItem.class_name}</h3>
                                {classItem.teacher_name ? (
                                    <p className="text-[13px] text-[#3B3F6E] font-medium mb-3">{classItem.teacher_name}</p>
                                ) : (
                                    <p className="text-[13px] text-[#E59842] font-medium mb-3">No teacher assigned</p>
                                )}
                                <div className="inline-block px-3 py-1 rounded-full bg-[#EAE8F2] text-[11px] font-semibold text-[#3B3F6E] mb-3">
                                    {classItem.education_level}
                                </div>
                                <p className="text-[12px] text-graphite-60 mb-1">
                                    {classItem.student_count} students · {classItem.lessons_assigned} lessons assigned
                                </p>
                                <p className="text-[12px] text-graphite-40">
                                    Last active: {classItem.last_activity_label}
                                </p>
                            </button>
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
        <div className="flex flex-col items-center justify-center h-[60vh] w-full">
            <div className="w-[60px] h-[48px] bg-[#EAE8F2] rounded-lg flex items-center justify-center mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A29ECA" strokeWidth="1.5">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <line x1="8" y1="10" x2="16" y2="10" strokeLinecap="round" />
                    <line x1="8" y1="14" x2="13" y2="14" strokeLinecap="round" />
                </svg>
            </div>
            <p className="text-[15px] font-semibold text-[#3B3F6E] mb-2">{title}</p>
            <p className="text-[13px] text-graphite-60 font-medium mb-5">{description}</p>
            <button
                onClick={onCreateClick}
                className="flex items-center gap-2 px-5 py-[10px] bg-[#3B3F6E] text-white rounded-lg text-[13px] font-semibold hover:bg-[#2C2F52] transition-colors cursor-pointer"
            >
                <span className="text-[15px] leading-none">+</span>
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
    if (loading) {
        return <div className="text-[14px] text-graphite-60">Loading class details...</div>;
    }

    if (error) {
        return <div className="text-[14px] text-[#D4534A]">{error}</div>;
    }

    if (!detail) {
        return <div className="text-[14px] text-graphite-60">Class not found.</div>;
    }

    return (
        <div className="w-full flex flex-col gap-5">
            <button onClick={onBack} className="flex items-center gap-1 text-[13px] text-[#3B3F6E] font-medium hover:opacity-70 cursor-pointer self-start -mb-1">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 12L6 8L10 4" />
                </svg>
                Classes
            </button>

            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-[22px] font-bold text-[#3B3F6E] tracking-tight">{detail.class_name}</h1>
                    <p className="text-[13px] text-graphite-60 mt-1">
                        {detail.subject || 'General'} · {detail.education_level || 'Education level not set'}
                    </p>
                    {detail.teacher ? (
                        <p className="text-[13px] text-[#3B3F6E] font-medium mt-2">{detail.teacher.teacher_name}</p>
                    ) : (
                        <p className="text-[13px] text-[#E59842] font-medium mt-2">{detail.no_teacher_notice?.description || 'No teacher assigned yet.'}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onEdit} className="px-4 py-2 border border-[#3B3F6E] rounded-lg text-[13px] font-semibold text-[#3B3F6E] hover:bg-black/5 transition-colors cursor-pointer">
                        Edit class
                    </button>
                    <button onClick={onArchive} className="px-4 py-2 border border-[#E9E7E2] rounded-lg text-[13px] font-medium text-graphite-60 hover:bg-black/5 transition-colors cursor-pointer">
                        Archive
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-[1fr_280px] gap-6">
                <div className="min-w-0">
                    <h2 className="text-[15px] font-bold text-[#3B3F6E] mb-4">Students ({detail.students?.length || 0})</h2>
                    <div className="bg-white rounded-2xl border border-[#E9E7E2] overflow-hidden mb-6">
                        {(detail.students || []).length > 0 ? (
                            detail.students.map((student: any) => (
                                <div key={student.student_id} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 border-[#F0EDE6]">
                                    <div>
                                        <p className="text-[13px] font-semibold text-[#3B3F6E]">{student.student_name}</p>
                                        <p className="text-[11px] text-graphite-40">{student.last_activity_label}</p>
                                    </div>
                                    <span className={`w-2 h-2 rounded-full ${student.activity_status === 'active' ? 'bg-[#5A9B6A]' : 'bg-[#E59842]'}`} />
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-[13px] text-graphite-60">No students in this class yet.</div>
                        )}
                    </div>

                    <h2 className="text-[15px] font-bold text-[#3B3F6E] mb-4">Assigned lessons ({detail.lessons?.length || 0})</h2>
                    <div className="bg-white rounded-2xl border border-[#E9E7E2] overflow-hidden">
                        {(detail.lessons || []).length > 0 ? (
                            detail.lessons.map((lesson: any) => (
                                <div key={lesson.lesson_id} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 border-[#F0EDE6]">
                                    <div>
                                        <p className="text-[13px] font-semibold text-[#3B3F6E]">{lesson.title}</p>
                                        <p className="text-[11px] text-graphite-40">{lesson.assigned_at_label}</p>
                                    </div>
                                    <p className="text-[12px] text-graphite-60">
                                        {lesson.completed_count}/{lesson.total_count} completed
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-[13px] text-graphite-60">No lessons assigned yet.</div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {detail.overview ? (
                        <div className="bg-white border border-[#E9E7E2] rounded-xl p-5">
                            <h3 className="text-[13px] font-bold text-[#3B3F6E] mb-4">Overview</h3>
                            <div className="flex flex-col gap-3">
                                <SidebarStat label="Active students" value={detail.overview.active_students_label} />
                                <SidebarStat label="Completion rate" value={detail.overview.completion_rate_label} />
                                <SidebarStat label="Most active day" value={detail.overview.most_active_day_label} />
                            </div>
                        </div>
                    ) : null}
                    <div className="bg-white border border-[#E9E7E2] rounded-xl p-5">
                        <h3 className="text-[13px] font-bold text-[#3B3F6E] mb-4">Needs support</h3>
                        {(detail.support_students || []).length > 0 ? (
                            <div className="flex flex-col gap-3">
                                {detail.support_students.map((student: any) => (
                                    <div key={student.student_id}>
                                        <p className="text-[13px] font-semibold text-[#3B3F6E]">{student.student_name}</p>
                                        <p className="text-[11px] text-graphite-40">{student.reason}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[12px] text-graphite-60">No flagged students right now.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SidebarStat({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[12px] text-graphite-40">{label}</p>
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

    const canSave = form.name.trim() && form.education_level && form.subject;

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
        <ModalShell title="Create class" onClose={onClose}>
            {loading ? (
                <p className="text-[13px] text-graphite-60">Loading class options...</p>
            ) : (
                <div className="flex flex-col gap-4">
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Class name" className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px]" />
                    <select value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })} className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px] bg-white">
                        <option value="">No teacher yet</option>
                        {(options?.teachers || []).map((teacher: any) => (
                            <option key={teacher.teacher_id} value={teacher.teacher_id}>{teacher.teacher_name}</option>
                        ))}
                    </select>
                    <select value={form.education_level} onChange={(e) => setForm({ ...form, education_level: e.target.value })} className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px] bg-white">
                        {(options?.education_levels || []).map((level: string) => (
                            <option key={level} value={level}>{level}</option>
                        ))}
                    </select>
                    <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px] bg-white">
                        {(options?.subjects || []).map((subject: string) => (
                            <option key={subject} value={subject}>{subject}</option>
                        ))}
                    </select>
                    <input value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} placeholder="Academic year (optional)" className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px]" />
                    {error ? <p className="text-[12px] text-[#D4534A]">{error}</p> : null}
                    <button disabled={!canSave || saving} onClick={() => void handleSave()} className={`w-full py-3 rounded-xl text-[14px] font-semibold ${canSave ? 'bg-[#3B3F6E] text-white cursor-pointer' : 'bg-[#B8B6C8] text-white cursor-not-allowed'}`}>
                        {saving ? 'Creating...' : 'Create class'}
                    </button>
                </div>
            )}
        </ModalShell>
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

    const handleSave = async () => {
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
        <ModalShell title="Edit class" onClose={onClose}>
            {loading ? (
                <p className="text-[13px] text-graphite-60">Loading class...</p>
            ) : (
                <div className="flex flex-col gap-4">
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px]" />
                    <select value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })} className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px] bg-white">
                        <option value="">No teacher yet</option>
                        {(options?.teachers || []).map((teacher: any) => (
                            <option key={teacher.teacher_id} value={teacher.teacher_id}>{teacher.teacher_name}</option>
                        ))}
                    </select>
                    <select value={form.education_level} onChange={(e) => setForm({ ...form, education_level: e.target.value })} className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px] bg-white">
                        {(options?.education_levels || []).map((level: string) => (
                            <option key={level} value={level}>{level}</option>
                        ))}
                    </select>
                    <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px] bg-white">
                        {(options?.subjects || []).map((subject: string) => (
                            <option key={subject} value={subject}>{subject}</option>
                        ))}
                    </select>
                    <input value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px]" />
                    {error ? <p className="text-[12px] text-[#D4534A]">{error}</p> : null}
                    <button onClick={() => void handleSave()} disabled={saving} className="w-full py-3 rounded-xl text-[14px] font-semibold bg-[#3B3F6E] text-white cursor-pointer">
                        {saving ? 'Saving...' : 'Save changes'}
                    </button>
                </div>
            )}
        </ModalShell>
    );
}

function ArchiveClassModal({ className, onClose, onConfirm }: { className: string; onClose: () => void; onConfirm: () => Promise<void> }) {
    return (
        <ModalShell title="Archive class" onClose={onClose}>
            <div className="flex flex-col gap-4">
                <p className="text-[14px] text-[#3B3F6E]">Archive <strong>{className}</strong>?</p>
                <p className="text-[12px] text-graphite-60">The class will be removed from active views, but the data will stay in the backend as archived.</p>
                <button onClick={() => void onConfirm()} className="w-full py-3 border border-[#D4534A] rounded-xl text-[14px] font-semibold text-[#D4534A] cursor-pointer">
                    Archive class
                </button>
            </div>
        </ModalShell>
    );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-[#FDFBF9] rounded-2xl w-full max-w-[520px] p-8 relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-6 right-6 text-graphite-60 hover:text-[#3B3F6E] cursor-pointer">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M5 5L15 15M15 5L5 15" />
                    </svg>
                </button>
                <h2 className="text-[18px] font-bold text-[#3B3F6E] text-center mb-8">{title}</h2>
                {children}
            </div>
        </div>
    );
}
