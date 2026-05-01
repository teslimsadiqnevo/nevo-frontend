'use client';

import { useEffect, useState } from 'react';
import {
    checkSchoolTeacherInviteEmail,
    getSchoolTeacherInviteForm,
    getSchoolTeachersPage,
    inviteSchoolTeacher,
} from '../api/school';

export function TeachersView() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [teachersPage, setTeachersPage] = useState<any | null>(null);
    const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);

    const loadTeachers = async () => {
        setLoading(true);
        const res = await getSchoolTeachersPage();
        if ('error' in res && res.error) {
            setError(res.error);
            setTeachersPage(null);
        } else {
            setError(null);
            setTeachersPage('data' in res ? res.data : null);
        }
        setLoading(false);
    };

    useEffect(() => {
        void loadTeachers();
    }, []);

    if (selectedTeacher) {
        return (
            <TeacherDetailView
                teacher={selectedTeacher}
                onBack={() => setSelectedTeacher(null)}
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
                        Invite teacher
                    </button>
                </div>

                {loading ? (
                    <div className="text-[14px] text-graphite-60">Loading teachers...</div>
                ) : error ? (
                    <div className="text-[14px] text-[#D4534A]">{error}</div>
                ) : teachersPage?.show_empty_state ? (
                    <TeachersEmptyState
                        title={teachersPage?.empty_state?.title || 'No teachers yet'}
                        description={teachersPage?.empty_state?.description || 'Invite your first teacher.'}
                        cta={teachersPage?.empty_state?.primary_action_label || 'Invite teacher'}
                        onInviteClick={() => setShowInviteModal(true)}
                    />
                ) : (
                    <TeachersTable
                        teachers={teachersPage?.teachers || []}
                        onViewTeacher={(teacher) => setSelectedTeacher(teacher)}
                    />
                )}
            </div>

            {showInviteModal ? (
                <InviteTeacherModal
                    onClose={() => setShowInviteModal(false)}
                    onSuccess={async () => {
                        setShowInviteModal(false);
                        await loadTeachers();
                    }}
                />
            ) : null}
        </>
    );
}

function TeachersTable({ teachers, onViewTeacher }: { teachers: any[]; onViewTeacher: (teacher: any) => void }) {
    return (
        <div className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="grid grid-cols-[1.2fr_1fr_auto_auto_auto_auto] items-center px-6 py-3 border-b border-[#E9E7E2] bg-[#FDFBF9]">
                <span className="text-[11px] font-bold text-graphite-60 uppercase tracking-wider">Name</span>
                <span className="text-[11px] font-bold text-graphite-60 uppercase tracking-wider">Classes</span>
                <span className="text-[11px] font-bold text-graphite-60 uppercase tracking-wider w-[110px]">Lessons</span>
                <span className="text-[11px] font-bold text-graphite-60 uppercase tracking-wider w-[110px]">Last active</span>
                <span className="text-[11px] font-bold text-graphite-60 uppercase tracking-wider w-[110px]">Status</span>
                <span className="text-[11px] font-bold text-graphite-60 uppercase tracking-wider w-[80px]">Actions</span>
            </div>

            {teachers.map((teacher) => (
                <div key={teacher.teacher_id} className="grid grid-cols-[1.2fr_1fr_auto_auto_auto_auto] items-center px-6 py-4 border-b border-[#F0EDE6] last:border-b-0 hover:bg-[#FDFBF9] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-[32px] h-[32px] rounded-full bg-[#EAE8F2] flex items-center justify-center text-[#3B3F6E] text-[10px] font-bold shrink-0 uppercase">
                            {teacher.initials}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-[#3B3F6E] truncate">{teacher.full_name}</p>
                            <p className="text-[11px] text-graphite-40 truncate">{teacher.email || 'No email provided'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                        {(teacher.visible_classes || []).map((classItem: any) => (
                            <span key={classItem.class_id} className="px-2 py-[3px] bg-[#EAE8F2] rounded text-[11px] font-medium text-[#3B3F6E] whitespace-nowrap">
                                {classItem.class_name}
                            </span>
                        ))}
                        {teacher.hidden_class_count > 0 ? (
                            <span className="px-2 py-[3px] bg-[#EAE8F2] rounded text-[11px] font-medium text-[#3B3F6E]">
                                +{teacher.hidden_class_count} more
                            </span>
                        ) : null}
                        {(teacher.visible_classes || []).length === 0 ? <span className="text-[12px] text-graphite-40">—</span> : null}
                    </div>

                    <span className="text-[13px] text-[#3B3F6E] font-medium w-[110px] text-center">{teacher.lessons_uploaded}</span>
                    <span className="text-[12px] text-graphite-60 w-[110px]">{teacher.last_active_label}</span>
                    <div className="w-[110px]">
                        <StatusBadge status={teacher.status} />
                    </div>
                    <button onClick={() => onViewTeacher(teacher)} className="text-[12px] font-medium text-[#3B3F6E] hover:underline cursor-pointer">
                        View
                    </button>
                </div>
            ))}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const key = status?.toLowerCase();
    const styles: Record<string, string> = {
        active: 'bg-[#E8F5E9] text-[#2E7D32]',
        invited: 'bg-[#EDE7F6] text-[#5E35B1]',
        unassigned: 'bg-[#FFF3E0] text-[#E65100]',
        inactive: 'bg-[#F4F4F4] text-[#666666]',
    };

    return (
        <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold ${styles[key] || 'bg-[#F4F4F4] text-[#666666]'}`}>
            {status}
        </span>
    );
}

function TeachersEmptyState({ title, description, cta, onInviteClick }: { title: string; description: string; cta: string; onInviteClick: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] w-full">
            <div className="w-[60px] h-[48px] bg-[#EAE8F2] rounded-lg flex items-center justify-center mb-5" />
            <p className="text-[15px] font-semibold text-[#3B3F6E] mb-2">{title}</p>
            <p className="text-[13px] text-graphite-60 font-medium mb-5">{description}</p>
            <button onClick={onInviteClick} className="px-5 py-[10px] bg-[#3B3F6E] text-white rounded-lg text-[13px] font-semibold cursor-pointer">
                {cta}
            </button>
        </div>
    );
}

function InviteTeacherModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => Promise<void> }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [formOptions, setFormOptions] = useState<any | null>(null);
    const [form, setForm] = useState({
        email: '',
        first_name: '',
        last_name: '',
        class_ids: [] as string[],
    });

    useEffect(() => {
        let mounted = true;
        void (async () => {
            const res = await getSchoolTeacherInviteForm();
            if (!mounted) return;
            if ('error' in res && res.error) {
                setError(res.error);
            } else {
                setFormOptions('data' in res ? res.data : null);
            }
            setLoading(false);
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const onEmailBlur = async () => {
        if (!form.email.includes('@')) return;
        const res = await checkSchoolTeacherInviteEmail(form.email);
        if ('error' in res && res.error) {
            setNotice(null);
            return;
        }
        const data = 'data' in res ? res.data : null;
        setNotice(data?.notice || null);
    };

    const canSave = form.email.trim() && form.first_name.trim() && form.last_name.trim();

    const handleInvite = async () => {
        if (!canSave) return;
        setSaving(true);
        setError(null);
        const res = await inviteSchoolTeacher(form);
        setSaving(false);
        if ('error' in res && res.error) {
            setError(res.error);
            return;
        }
        await onSuccess();
    };

    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-[500px] p-8 relative" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[18px] font-bold text-[#3B3F6E]">Invite a teacher</h2>
                    <button onClick={onClose} className="text-graphite-40 hover:text-[#3B3F6E] cursor-pointer">×</button>
                </div>

                {loading ? (
                    <p className="text-[13px] text-graphite-60">Loading invite options...</p>
                ) : (
                    <div className="flex flex-col gap-4">
                        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} onBlur={() => void onEmailBlur()} placeholder="Teacher email address" className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px]" />
                        <div className="grid grid-cols-2 gap-3">
                            <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="First name" className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px]" />
                            <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Last name" className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px]" />
                        </div>
                        <div className="border border-[#E9E7E2] rounded-xl p-4">
                            <p className="text-[12px] font-semibold text-[#3B3F6E] mb-3">Assign classes (optional)</p>
                            <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto">
                                {(formOptions?.classes || []).map((classItem: any) => {
                                    const checked = form.class_ids.includes(classItem.class_id);
                                    return (
                                        <label key={classItem.class_id} className="flex items-center gap-2 text-[13px] text-[#3B3F6E]">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() =>
                                                    setForm((current) => ({
                                                        ...current,
                                                        class_ids: checked
                                                            ? current.class_ids.filter((id) => id !== classItem.class_id)
                                                            : [...current.class_ids, classItem.class_id],
                                                    }))
                                                }
                                            />
                                            {classItem.class_name}
                                        </label>
                                    );
                                })}
                            </div>
                            {formOptions?.classes?.length === 0 ? (
                                <p className="text-[12px] text-graphite-60">{formOptions?.empty_classes_label || 'No classes yet.'}</p>
                            ) : null}
                        </div>
                        {notice ? <p className="text-[12px] text-graphite-60">{notice}</p> : null}
                        {error ? <p className="text-[12px] text-[#D4534A]">{error}</p> : null}
                        <button disabled={!canSave || saving} onClick={() => void handleInvite()} className={`w-full py-3 rounded-xl text-[14px] font-semibold ${canSave ? 'bg-[#3B3F6E] text-white cursor-pointer' : 'bg-[#B8B6C8] text-white cursor-not-allowed'}`}>
                            {saving ? 'Sending invite...' : 'Send invite'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function TeacherDetailView({ teacher, onBack }: { teacher: any; onBack: () => void }) {
    return (
        <div className="w-full flex flex-col gap-5">
            <button onClick={onBack} className="flex items-center gap-1 text-[13px] text-[#3B3F6E] font-medium hover:opacity-70 cursor-pointer self-start -mb-1">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 12L6 8L10 4" />
                </svg>
                Teachers
            </button>
            <div className="bg-white rounded-2xl border border-[#E9E7E2] p-6 max-w-[760px]">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-[56px] h-[56px] rounded-full bg-[#EAE8F2] flex items-center justify-center text-[#3B3F6E] text-[16px] font-bold uppercase">
                        {teacher.initials}
                    </div>
                    <div>
                        <h1 className="text-[20px] font-bold text-[#3B3F6E] tracking-tight">{teacher.full_name}</h1>
                        <p className="text-[13px] text-graphite-40">{teacher.email || 'No email provided'}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <DetailBlock label="Status" value={teacher.status} />
                    <DetailBlock label="Last active" value={teacher.last_active_label} />
                    <DetailBlock label="Lessons uploaded" value={String(teacher.lessons_uploaded)} />
                    <DetailBlock label="Assigned classes" value={String((teacher.classes || []).length)} />
                </div>
                <div className="mt-6">
                    <h2 className="text-[14px] font-bold text-[#3B3F6E] mb-3">Classes</h2>
                    <div className="flex flex-wrap gap-2">
                        {(teacher.classes || []).length > 0 ? (
                            teacher.classes.map((classItem: any) => (
                                <span key={classItem.class_id} className="px-3 py-1 bg-[#EAE8F2] rounded-full text-[12px] font-medium text-[#3B3F6E]">
                                    {classItem.class_name}
                                </span>
                            ))
                        ) : (
                            <p className="text-[12px] text-graphite-60">No classes assigned yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[12px] text-graphite-40">{label}</p>
            <p className="text-[13px] font-semibold text-[#3B3F6E]">{value}</p>
        </div>
    );
}
