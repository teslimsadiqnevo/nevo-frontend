'use client';

import { useEffect, useState } from 'react';
import { useAuthGuard } from '@/shared/lib';
import { getSchoolTeachersPage } from '../api/school';
import { InviteTeacherModal } from './InviteTeacherModal';
import { DashboardViewSkeleton } from './DashboardSkeletons';

export function TeachersView() {
    const guardAuth = useAuthGuard('school');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [teachersPage, setTeachersPage] = useState<any | null>(null);
    const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);

    const loadTeachers = async () => {
        setLoading(true);
        const res = await getSchoolTeachersPage();
        if (guardAuth(res)) return;

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
        return <TeacherDetailView teacher={selectedTeacher} onBack={() => setSelectedTeacher(null)} />;
    }

    return (
        <>
            <div className="mx-auto flex w-full max-w-[1136px] flex-col gap-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-[22px] font-bold text-[#3B3F6E]">Teachers</h1>
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex h-[44px] items-center gap-2 rounded-[12px] bg-[#3B3F6E] px-4 text-[13px] font-semibold text-[#F7F1E6]"
                    >
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                            <path d="M3 5.75C3 5.05964 3.55964 4.5 4.25 4.5H15.75C16.4404 4.5 17 5.05964 17 5.75V14.25C17 14.9404 16.4404 15.5 15.75 15.5H4.25C3.55964 15.5 3 14.9404 3 14.25V5.75Z" stroke="#F7F1E6" strokeWidth="1.4" />
                            <path d="M5 7L10 11L15 7" stroke="#F7F1E6" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Invite teacher
                    </button>
                </div>

                {loading ? (
                    <DashboardViewSkeleton titleWidth="w-36" cardCount={0} rowCount={6} />
                ) : error ? (
                    <div className="text-[14px] text-[#D4534A]">{error}</div>
                ) : teachersPage?.show_empty_state ? (
                    <TeachersEmptyState
                        title={teachersPage?.empty_state?.title || 'No teachers yet.'}
                        description={teachersPage?.empty_state?.description || 'Invite your first teacher.'}
                        cta={teachersPage?.empty_state?.primary_action_label || 'Invite teacher'}
                        onInviteClick={() => setShowInviteModal(true)}
                    />
                ) : (
                    <TeachersTable teachers={teachersPage?.teachers || []} onViewTeacher={(teacher) => setSelectedTeacher(teacher)} />
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
        <div className="overflow-hidden rounded-[12px] border border-[#E0D9CE] bg-white">
            <div className="overflow-x-auto">
            <div className="min-w-[760px]">
            <div className="grid grid-cols-[1.35fr_1.25fr_100px_120px_100px_60px] items-center border-b border-[#E0D9CE] bg-[#FCFCFC] px-5 py-4 text-[11px] uppercase tracking-[0.08em] text-[#3B3F6E]/65">
                <span>Name</span>
                <span>Classes</span>
                <span>Lessons uploaded</span>
                <span>Last active</span>
                <span>Status</span>
                <span>Actions</span>
            </div>

            {teachers.map((teacher) => (
                <div
                    key={teacher.teacher_id}
                    className="grid grid-cols-[1.35fr_1.25fr_100px_120px_100px_60px] items-center border-b border-[#E8E0D2] px-5 py-3 last:border-b-0"
                >
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E7E7F4] text-[10px] font-semibold uppercase text-[#3B3F6E]">
                            {teacher.initials}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-[14px] font-medium text-[#2B2B2F]">{teacher.full_name}</p>
                            <p className="truncate text-[11px] text-[#2B2B2F]/45">{teacher.email || 'No email provided'}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        {(teacher.visible_classes || []).map((classItem: any) => (
                            <span key={classItem.class_id} className="rounded-[6px] bg-[#EAE8F2] px-2 py-[3px] text-[11px] text-[#3B3F6E]">
                                {classItem.class_name}
                            </span>
                        ))}
                        {teacher.hidden_class_count > 0 ? (
                            <span className="rounded-[6px] bg-[#EAE8F2] px-2 py-[3px] text-[11px] text-[#3B3F6E]">
                                +{teacher.hidden_class_count} more
                            </span>
                        ) : null}
                        {(teacher.visible_classes || []).length === 0 ? (
                            <span className="text-[12px] text-[#2B2B2F]/35">—</span>
                        ) : null}
                    </div>

                    <span className="text-[13px] text-[#2B2B2F]">{teacher.lessons_uploaded}</span>
                    <span className="text-[12px] text-[#2B2B2F]/55">{teacher.last_active_label}</span>
                    <div>
                        <StatusBadge status={teacher.status} />
                    </div>
                    <button onClick={() => onViewTeacher(teacher)} className="text-[12px] font-medium text-[#3B3F6E]">
                        View
                    </button>
                </div>
            ))}
            </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const key = status?.toLowerCase();
    const styles: Record<string, string> = {
        active: 'bg-[#93D18B] text-white',
        invited: 'bg-[#9A9CCB] text-white',
        unassigned: 'bg-[#E8A84A] text-white',
        inactive: 'bg-[#B8B8B8] text-white',
    };

    return (
        <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${styles[key] || 'bg-[#B8B8B8] text-white'}`}>
            {status}
        </span>
    );
}

function TeachersEmptyState({
    title,
    description,
    cta,
    onInviteClick,
}: {
    title: string;
    description: string;
    cta: string;
    onInviteClick: () => void;
}) {
    return (
        <div className="flex min-h-[680px] flex-col items-center justify-center">
            <div className="flex h-[92px] w-[92px] items-center justify-center rounded-full bg-[rgba(154,156,203,0.12)]">
                <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
                    <rect x="7" y="10" width="28" height="22" rx="4" stroke="#CFC9E5" strokeWidth="2" />
                    <path d="M10 13L21 23L32 13" stroke="#CFC9E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <p className="mt-6 text-[15px] font-medium text-[#2B2B2F]/65">{title}</p>
            <p className="mt-2 text-[14px] text-[#2B2B2F]/55">{description}</p>
            <button
                onClick={onInviteClick}
                className="mt-5 flex h-[44px] items-center gap-2 rounded-[12px] bg-[#3B3F6E] px-4 text-[13px] font-semibold text-[#F7F1E6]"
            >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                    <path d="M3 5.75C3 5.05964 3.55964 4.5 4.25 4.5H15.75C16.4404 4.5 17 5.05964 17 5.75V14.25C17 14.9404 16.4404 15.5 15.75 15.5H4.25C3.55964 15.5 3 14.9404 3 14.25V5.75Z" stroke="#F7F1E6" strokeWidth="1.4" />
                    <path d="M5 7L10 11L15 7" stroke="#F7F1E6" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {cta}
            </button>
        </div>
    );
}

function TeacherDetailView({ teacher, onBack }: { teacher: any; onBack: () => void }) {
    return (
        <div className="mx-auto flex w-full max-w-[1136px] flex-col gap-5">
            <button onClick={onBack} className="flex items-center gap-1 self-start text-[13px] font-medium text-[#3B3F6E]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 12L6 8L10 4" />
                </svg>
                Teachers
            </button>

            <div className="max-w-[760px] rounded-[12px] border border-[#E0D9CE] bg-white p-6">
                <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E7E7F4] text-[16px] font-bold uppercase text-[#3B3F6E]">
                        {teacher.initials}
                    </div>
                    <div>
                        <h1 className="text-[20px] font-bold text-[#3B3F6E]">{teacher.full_name}</h1>
                        <p className="text-[13px] text-[#2B2B2F]/45">{teacher.email || 'No email provided'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <DetailBlock label="Status" value={teacher.status} />
                    <DetailBlock label="Last active" value={teacher.last_active_label} />
                    <DetailBlock label="Lessons uploaded" value={String(teacher.lessons_uploaded)} />
                    <DetailBlock label="Assigned classes" value={String((teacher.classes || []).length)} />
                </div>

                <div className="mt-6">
                    <h2 className="mb-3 text-[14px] font-semibold text-[#3B3F6E]">Classes</h2>
                    <div className="flex flex-wrap gap-2">
                        {(teacher.classes || []).length > 0 ? (
                            teacher.classes.map((classItem: any) => (
                                <span key={classItem.class_id} className="rounded-full bg-[#EAE8F2] px-3 py-1 text-[12px] text-[#3B3F6E]">
                                    {classItem.class_name}
                                </span>
                            ))
                        ) : (
                            <p className="text-[12px] text-[#2B2B2F]/55">No classes assigned yet.</p>
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
            <p className="text-[12px] text-[#2B2B2F]/40">{label}</p>
            <p className="text-[13px] font-semibold text-[#3B3F6E]">{value}</p>
        </div>
    );
}
