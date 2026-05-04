'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthGuard } from '@/shared/lib';
import { StudentDetailView } from './StudentDetailView';
import { enrollSchoolStudent, getSchoolStudentsPage } from '../api/school';

const PAGE_SIZE = 10;

interface StudentRow {
    id: string;
    name: string;
    initials: string;
    classId: string | null;
    className: string;
    nevoId: string;
    lastActive: string;
    raw: any;
}

interface ClassOption {
    id: string | null;
    label: string;
}

export function StudentsView() {
    const guardAuth = useAuthGuard('school');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [classOptions, setClassOptions] = useState<ClassOption[]>([{ id: null, label: 'All classes' }]);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [selectedStudentAction, setSelectedStudentAction] = useState<'view' | 'move-class'>('view');
    const [showClassFilter, setShowClassFilter] = useState(false);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        totalCount: 0,
        totalPages: 1,
        start: 0,
        end: 0,
        usesServerPagination: false,
    });
    const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        void (async () => {
            setLoading(true);
            setError(null);

            const res = await getSchoolStudentsPage({
                classId: selectedClassId,
                page,
                pageSize: PAGE_SIZE,
            });

            if (!mounted) return;
            if (guardAuth(res)) return;

            if ('error' in res && res.error) {
                setError(res.error);
                setStudents([]);
                setPagination({
                    totalCount: 0,
                    totalPages: 1,
                    start: 0,
                    end: 0,
                    usesServerPagination: false,
                });
                setLoading(false);
                return;
            }

            const data = 'data' in res ? res.data : null;
            const rows: any[] = Array.isArray(data?.students) ? data.students : [];
            const mappedRows: StudentRow[] = rows.map((student: any) => mapStudentRow(student));
            const filteredRows = selectedClassId
                ? mappedRows.filter((student: StudentRow) => student.classId === selectedClassId)
                : mappedRows;
            const normalizedClassOptions = normalizeClassOptions(data?.class_options);
            const serverPagination = extractPagination(data, page, PAGE_SIZE);

            let visibleRows = filteredRows;
            let totalCount = filteredRows.length;
            let totalPages = Math.max(1, Math.ceil(Math.max(totalCount, 1) / PAGE_SIZE));
            let start = filteredRows.length ? (page - 1) * PAGE_SIZE + 1 : 0;
            let end = Math.min(page * PAGE_SIZE, totalCount);

            if (serverPagination) {
                totalCount = serverPagination.totalCount;
                totalPages = serverPagination.totalPages;
                start = serverPagination.start;
                end = serverPagination.end;
            } else {
                const sliceStart = (page - 1) * PAGE_SIZE;
                visibleRows = filteredRows.slice(sliceStart, sliceStart + PAGE_SIZE);
                start = visibleRows.length ? sliceStart + 1 : 0;
                end = visibleRows.length ? sliceStart + visibleRows.length : 0;
            }

            setStudents(visibleRows);
            setClassOptions(normalizedClassOptions);
            setPagination({
                totalCount,
                totalPages,
                start,
                end,
                usesServerPagination: Boolean(serverPagination),
            });
            setLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, [page, selectedClassId]);

    const selectedStudent = useMemo(
        () => students.find((student) => student.id === selectedStudentId) || null,
        [selectedStudentId, students],
    );

    if (selectedStudentId) {
        return (
            <StudentDetailView
                studentId={selectedStudentId}
                studentData={selectedStudent?.raw}
                initialAction={selectedStudentAction}
                onBack={() => setSelectedStudentId(null)}
                onStudentUpdated={async () => {
                    const res = await getSchoolStudentsPage({
                        classId: selectedClassId,
                        page,
                        pageSize: PAGE_SIZE,
                    });

                    if (guardAuth(res)) return;

                    if ('error' in res && res.error) {
                        setError(res.error);
                        return;
                    }

                    const data = 'data' in res ? res.data : null;
                    const rows: any[] = Array.isArray(data?.students) ? data.students : [];
                    const mappedRows: StudentRow[] = rows.map((student: any) => mapStudentRow(student));
                    const filteredRows = selectedClassId
                        ? mappedRows.filter((student: StudentRow) => student.classId === selectedClassId)
                        : mappedRows;
                    const serverPagination = extractPagination(data, page, PAGE_SIZE);

                    setStudents(serverPagination ? filteredRows : filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
                    setPagination({
                        totalCount: serverPagination?.totalCount ?? filteredRows.length,
                        totalPages:
                            serverPagination?.totalPages ??
                            Math.max(1, Math.ceil(Math.max(filteredRows.length, 1) / PAGE_SIZE)),
                        start: serverPagination?.start ?? (filteredRows.length ? (page - 1) * PAGE_SIZE + 1 : 0),
                        end:
                            serverPagination?.end ??
                            (filteredRows.length
                                ? Math.min(filteredRows.length, page * PAGE_SIZE)
                                : 0),
                        usesServerPagination: Boolean(serverPagination),
                    });
                }}
            />
        );
    }

    const activeClassLabel =
        classOptions.find((option) => option.id === selectedClassId)?.label || 'All classes';

    return (
        <>
            <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6">
                <div className="flex items-center justify-between pt-1">
                    <h1 className="text-[22px] font-bold leading-[33px] text-[#3B3F6E]">Students</h1>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowClassFilter((current) => !current)}
                                className="flex h-[44px] items-center gap-2 rounded-[12px] border border-[#3B3F6E] bg-[#FCFCFC] px-5 text-[14px] font-medium text-[#3B3F6E]"
                            >
                                <span>{activeClassLabel}</span>
                                <ChevronDownIcon />
                            </button>
                            {showClassFilter ? (
                                <div className="absolute right-0 top-[52px] z-20 min-w-[220px] overflow-hidden rounded-[12px] border border-[#E0D9CE] bg-white shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
                                    {classOptions.map((option) => (
                                        <button
                                            key={option.id || 'all'}
                                            type="button"
                                            onClick={() => {
                                                setSelectedClassId(option.id);
                                                setPage(1);
                                                setShowClassFilter(false);
                                            }}
                                            className={`flex w-full items-center px-4 py-3 text-left text-[14px] ${
                                                option.id === selectedClassId
                                                    ? 'bg-[rgba(59,63,110,0.06)] text-[#3B3F6E]'
                                                    : 'text-[#2B2B2F] hover:bg-[#F7F1E6]'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        <button
                            type="button"
                            className="flex h-[44px] items-center rounded-[12px] border border-[#3B3F6E] bg-[#FCFCFC] px-6 text-[14px] font-medium text-[#3B3F6E]"
                        >
                            Bulk import
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowEnrollModal(true)}
                            className="flex h-[44px] items-center rounded-[12px] bg-[#3B3F6E] px-6 text-[14px] font-semibold text-[#F7F1E6]"
                        >
                            Enroll student
                        </button>
                    </div>
                </div>

                {loading ? <StudentsTableSkeleton /> : null}

                {!loading && error ? (
                    <div className="rounded-[12px] border border-[#E0D9CE] bg-white px-6 py-8 text-center">
                        <p className="text-[15px] font-medium text-[#3B3F6E]">Couldn&apos;t load students.</p>
                        <p className="mt-2 text-[14px] text-[#2B2B2F]/60">{error}</p>
                    </div>
                ) : null}

                {!loading && !error && students.length === 0 ? (
                    <StudentsEmptyState onEnroll={() => setShowEnrollModal(true)} />
                ) : null}

                {!loading && !error && students.length > 0 ? (
                    <div className="overflow-hidden rounded-[12px] border border-[#E0D9CE] bg-[#FCFCFC] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        <div className="grid grid-cols-[2.1fr_0.9fr_1.15fr_1fr_0.9fr] items-center border-b border-[#E0D9CE] px-5 py-4 text-[13px] font-semibold uppercase tracking-[0.05em] text-[#3B3F6E]/60">
                            <span>Name</span>
                            <span>Class</span>
                            <span>Nevo ID</span>
                            <span>Last active</span>
                            <span className="text-right">Actions</span>
                        </div>

                        {students.map((student) => (
                            <div
                                key={student.id}
                                className="group grid min-h-[60px] grid-cols-[2.1fr_0.9fr_1.15fr_1fr_0.9fr] items-center border-b border-[#E0D9CE] bg-white px-5 py-[13px] last:border-b-0"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(59,63,110,0.2)] text-[13px] font-semibold text-[#3B3F6E]">
                                        {student.initials}
                                    </div>
                                    <p className="truncate text-[15px] font-medium text-[#3B3F6E]">{student.name}</p>
                                </div>

                                <p className="truncate text-[14px] text-[#2B2B2F]/65">{student.className}</p>

                                <div className="flex items-center gap-2">
                                    <span className="text-[13px] text-[#2B2B2F]/50">{student.nevoId}</span>
                                    <button
                                        type="button"
                                        onClick={() => void copyStudentId(student.id, student.nevoId, setCopiedStudentId)}
                                        className={`transition-opacity ${
                                            copiedStudentId === student.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                        }`}
                                        title="Copy Nevo ID"
                                    >
                                        <CopyIcon />
                                    </button>
                                </div>

                                <p className="text-[14px] text-[#2B2B2F]/55">{student.lastActive}</p>

                                <div className="relative flex items-center justify-end text-[13px] text-[#3B3F6E]">
                                    <button
                                        type="button"
                                        onClick={() => setOpenActionMenuId((current) => (current === student.id ? null : student.id))}
                                        className="rounded-full p-2 opacity-90"
                                        aria-label="More actions"
                                    >
                                        <DotsIcon />
                                    </button>

                                    {openActionMenuId === student.id ? (
                                        <div className="absolute right-0 top-[38px] z-20 w-[148px] overflow-hidden rounded-[12px] border border-[#E0D9CE] bg-white shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedStudentAction('view');
                                                    setSelectedStudentId(student.id);
                                                    setOpenActionMenuId(null);
                                                }}
                                                className="flex w-full items-center px-4 py-3 text-left text-[14px] text-[#3B3F6E] hover:bg-[#F7F1E6]"
                                            >
                                                View
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedStudentAction('move-class');
                                                    setSelectedStudentId(student.id);
                                                    setOpenActionMenuId(null);
                                                }}
                                                className="flex w-full items-center px-4 py-3 text-left text-[14px] text-[#3B3F6E] hover:bg-[#F7F1E6]"
                                            >
                                                Move class
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ))}

                        <div className="grid grid-cols-[120px_1fr_120px] items-center px-5 py-4 text-[13px] text-[#2B2B2F]/55">
                            <div>
                                {pagination.totalPages > 1 ? (
                                    <button
                                        type="button"
                                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                                        disabled={page === 1}
                                        className="rounded-[10px] border border-[#E0D9CE] px-3 py-2 text-[#3B3F6E] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Prev
                                    </button>
                                ) : null}
                            </div>
                            <p className="text-center">
                                Showing {pagination.start}-{pagination.end} of {pagination.totalCount} students
                            </p>
                            <div className="flex justify-end">
                                {pagination.totalPages > 1 ? (
                                    <button
                                        type="button"
                                        onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                                        disabled={page >= pagination.totalPages}
                                        className="rounded-[10px] border border-[#E0D9CE] px-3 py-2 text-[#3B3F6E] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            {showEnrollModal ? (
                <EnrollStudentModal
                    classOptions={classOptions.filter((option) => option.id)}
                    onClose={() => setShowEnrollModal(false)}
                    onEnrolled={async () => {
                        setPage(1);
                        setShowEnrollModal(false);
                        const res = await getSchoolStudentsPage({
                            classId: selectedClassId,
                            page: 1,
                            pageSize: PAGE_SIZE,
                        });

                        if (guardAuth(res)) return;

                        if ('error' in res && res.error) {
                            setError(res.error);
                            return;
                        }

                        const data = 'data' in res ? res.data : null;
                        const rows: any[] = Array.isArray(data?.students) ? data.students : [];
                        const mappedRows: StudentRow[] = rows.map((student: any) => mapStudentRow(student));
                        const filteredRows = selectedClassId
                            ? mappedRows.filter((student: StudentRow) => student.classId === selectedClassId)
                            : mappedRows;
                        const serverPagination = extractPagination(data, 1, PAGE_SIZE);

                        setStudents(serverPagination ? filteredRows : filteredRows.slice(0, PAGE_SIZE));
                        setPagination({
                            totalCount: serverPagination?.totalCount ?? filteredRows.length,
                            totalPages:
                                serverPagination?.totalPages ??
                                Math.max(1, Math.ceil(Math.max(filteredRows.length, 1) / PAGE_SIZE)),
                            start: filteredRows.length ? 1 : 0,
                            end: filteredRows.length ? Math.min(filteredRows.length, PAGE_SIZE) : 0,
                            usesServerPagination: Boolean(serverPagination),
                        });
                    }}
                />
            ) : null}
        </>
    );
}

function StudentsEmptyState({ onEnroll }: { onEnroll: () => void }) {
    return (
        <div className="flex min-h-[780px] items-center justify-center bg-[#F7F1E6]">
            <div className="flex w-full max-w-[420px] flex-col items-center text-center">
                <StudentsEmptyIcon />
                <h2 className="mt-8 text-[18px] font-semibold leading-[28px] text-[#3B3F6E]">No students enrolled yet</h2>
                <p className="mt-2 text-[15px] leading-[22px] text-[#2B2B2F]/60">
                    Add your first student or share your school code with learners.
                </p>
                <button
                    type="button"
                    onClick={onEnroll}
                    className="mt-8 flex h-[44px] items-center rounded-[12px] bg-[#3B3F6E] px-8 text-[14px] font-semibold text-[#F7F1E6]"
                >
                    Enroll student
                </button>
            </div>
        </div>
    );
}

function EnrollStudentModal({
    classOptions,
    onClose,
    onEnrolled,
}: {
    classOptions: ClassOption[];
    onClose: () => void;
    onEnrolled: () => Promise<void>;
}) {
    const [firstName, setFirstName] = useState('');
    const [age, setAge] = useState('');
    const [classId, setClassId] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdStudent, setCreatedStudent] = useState<{ nevoId: string; className: string } | null>(null);

    const canSubmit = Boolean(firstName.trim() && age.trim() && classId);

    const handleSubmit = async () => {
        if (!canSubmit) return;

        setSaving(true);
        setError(null);

        const res = await enrollSchoolStudent({
            firstName: firstName.trim(),
            age: Number(age),
            classId,
        });

        setSaving(false);

        if ('error' in res && res.error) {
            setError(res.error);
            return;
        }

        const data = 'data' in res ? res.data : null;
        if (!data?.nevo_id) {
            setError('Student created, but no Nevo ID was returned.');
            return;
        }

        setCreatedStudent({
            nevoId: data.nevo_id,
            className:
                classOptions.find((option) => option.id === classId)?.label ||
                data.class_name ||
                'Assigned class',
        });
    };

    const handleDone = async () => {
        await onEnrolled();
    };

    const handlePrint = () => {
        if (!createdStudent?.nevoId) return;

        const printWindow = window.open('', '_blank', 'width=420,height=320');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Student ID</title>
                    <style>
                        body { font-family: Inter, Arial, sans-serif; margin: 0; padding: 24px; }
                        .card {
                            border: 2px solid #3B3F6E;
                            border-radius: 16px;
                            background: #F7F1E6;
                            padding: 28px;
                            color: #3B3F6E;
                            font-weight: 700;
                            font-size: 28px;
                            letter-spacing: 4px;
                            line-height: 1.35;
                        }
                        .sub {
                            margin-top: 12px;
                            color: #3B3F6E;
                            font-size: 14px;
                            font-weight: 500;
                            letter-spacing: 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="card">Student ID:<br/>${createdStudent.nevoId}<div class="sub">${createdStudent.className}</div></div>
                    <script>window.onload = () => window.print();</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6" onClick={onClose}>
            <div
                className="w-full max-w-[480px] rounded-[16px] bg-white p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
                onClick={(event) => event.stopPropagation()}
            >
                {createdStudent ? (
                    <div className="flex flex-col gap-6">
                        <div className="rounded-[12px] border-2 border-[#3B3F6E] bg-[#F7F1E6] px-[26px] py-[22px] text-center">
                            <p className="text-[24px] font-bold uppercase leading-[32px] tracking-[4px] text-[#3B3F6E]">
                                Student ID:
                                <br />
                                {createdStudent.nevoId}
                            </p>
                            <p className="mt-3 text-[14px] text-[#2B2B2F]/60">{createdStudent.className}</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="flex h-[44px] items-center justify-center rounded-[12px] border border-[#3B3F6E] text-[14px] font-medium text-[#3B3F6E]"
                            >
                                Print ID card
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setCreatedStudent(null);
                                    setFirstName('');
                                    setAge('');
                                    setClassId('');
                                    setError(null);
                                }}
                                className="flex h-[44px] items-center justify-center rounded-[12px] border border-[#3B3F6E] text-[14px] font-medium text-[#3B3F6E]"
                            >
                                Enroll another
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleDone()}
                                className="flex h-[52px] items-center justify-center rounded-[12px] bg-[#3B3F6E] text-[15px] font-semibold text-[#F7F1E6]"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between">
                            <h2 className="text-[20px] font-bold leading-[30px] text-[#3B3F6E]">Enroll a student</h2>
                            <button type="button" onClick={onClose} className="p-2 text-[#3B3F6E]/60" aria-label="Close">
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="mt-7 flex flex-col gap-5">
                            <input
                                value={firstName}
                                onChange={(event) => setFirstName(event.target.value)}
                                placeholder="Student's first name"
                                className="h-[52px] rounded-[12px] border border-[rgba(59,63,110,0.4)] bg-[#F7F1E6] px-4 text-[15px] text-[#2B2B2F] outline-none placeholder:text-[#3B3F6E]/30"
                            />

                            <input
                                value={age}
                                onChange={(event) => setAge(event.target.value.replace(/[^\d]/g, ''))}
                                placeholder="Age"
                                className="h-[52px] rounded-[12px] border border-[rgba(59,63,110,0.4)] bg-[#F7F1E6] px-4 text-[15px] text-[#2B2B2F] outline-none placeholder:text-[#3B3F6E]/30"
                            />

                            <div className="relative">
                                <select
                                    value={classId}
                                    onChange={(event) => setClassId(event.target.value)}
                                    className="h-[52px] w-full appearance-none rounded-[12px] border border-[rgba(59,63,110,0.4)] bg-[#F7F1E6] px-4 text-[15px] text-[#2B2B2F] outline-none"
                                >
                                    <option value="">Select a class</option>
                                    {classOptions.map((option) => (
                                        <option key={option.id || 'empty'} value={option.id || ''}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#3B3F6E]">
                                    <ChevronDownIcon />
                                </span>
                            </div>

                            {error ? <p className="text-[13px] text-[#C0392B]">{error}</p> : null}

                            <button
                                type="button"
                                onClick={() => void handleSubmit()}
                                disabled={!canSubmit || saving}
                                className={`flex h-[52px] items-center justify-center rounded-[12px] text-[15px] font-semibold text-[#F7F1E6] ${
                                    !canSubmit || saving ? 'bg-[rgba(59,63,110,0.4)]' : 'bg-[#3B3F6E]'
                                }`}
                            >
                                {saving ? 'Creating student account...' : 'Create student account'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function StudentsTableSkeleton() {
    return (
        <div className="overflow-hidden rounded-[12px] border border-[#E0D9CE] bg-[#FCFCFC] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="grid grid-cols-[2.1fr_0.9fr_1.15fr_1fr_0.9fr] items-center border-b border-[#E0D9CE] px-5 py-4">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="h-4 w-20 animate-pulse rounded bg-[#E7E1D7]" />
                ))}
            </div>
            {Array.from({ length: 6 }).map((_, rowIndex) => (
                <div
                    key={rowIndex}
                    className="grid min-h-[60px] grid-cols-[2.1fr_0.9fr_1.15fr_1fr_0.9fr] items-center border-b border-[#E0D9CE] bg-white px-5 py-[13px] last:border-b-0"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 animate-pulse rounded-full bg-[#E7E1D7]" />
                        <div className="h-4 w-32 animate-pulse rounded bg-[#E7E1D7]" />
                    </div>
                    <div className="h-4 w-20 animate-pulse rounded bg-[#E7E1D7]" />
                    <div className="h-4 w-24 animate-pulse rounded bg-[#E7E1D7]" />
                    <div className="h-4 w-20 animate-pulse rounded bg-[#E7E1D7]" />
                    <div className="ml-auto h-4 w-24 animate-pulse rounded bg-[#E7E1D7]" />
                </div>
            ))}
        </div>
    );
}

function mapStudentRow(student: any): StudentRow {
    const id = String(student.student_id || student.id || student.nevo_id || '');
    const name =
        student.full_name ||
        [student.first_name, student.last_name].filter(Boolean).join(' ').trim() ||
        'Student';
    const nevoId = String(student.nevo_id || student.student_id || '');

    return {
        id,
        name,
        initials: getInitials(name),
        classId: student.class_id ? String(student.class_id) : null,
        className: student.class_name || 'Unassigned',
        nevoId,
        lastActive: student.last_active_label || student.last_active || 'No activity yet',
        raw: {
            ...student,
            name,
            class_name: student.class_name || 'Unassigned',
            nevo_id: nevoId,
            last_active: student.last_active_label || student.last_active || 'No activity yet',
        },
    };
}

function normalizeClassOptions(classOptions: any): ClassOption[] {
    const options = Array.isArray(classOptions) ? classOptions : [];
    return [
        { id: null, label: 'All classes' },
        ...options
            .map((option: any) => ({
                id: option.class_id ? String(option.class_id) : option.id ? String(option.id) : null,
                label: option.class_name || option.name || 'Class',
            }))
            .filter((option: ClassOption) => Boolean(option.id)),
    ];
}

function extractPagination(data: any, currentPage: number, pageSize: number) {
    const meta = data?.pagination || data?.meta || null;
    const totalCount =
        Number(meta?.total_count ?? meta?.total ?? data?.total_students ?? data?.total_count ?? 0) || 0;
    const current =
        Number(meta?.page ?? meta?.current_page ?? data?.page ?? currentPage) || currentPage;
    const size =
        Number(meta?.page_size ?? meta?.per_page ?? data?.page_size ?? pageSize) || pageSize;
    const totalPages =
        Number(meta?.total_pages ?? meta?.last_page ?? (totalCount ? Math.ceil(totalCount / size) : 1)) || 1;

    if (!totalCount) return null;

    const start = (current - 1) * size + 1;
    const end = Math.min(current * size, totalCount);

    return {
        totalCount,
        totalPages,
        start,
        end,
    };
}

function getInitials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('') || 'ST';
}

async function copyStudentId(
    studentId: string,
    nevoId: string,
    setCopiedStudentId: (value: string | null) => void,
) {
    try {
        await navigator.clipboard.writeText(nevoId);
        setCopiedStudentId(studentId);
        setTimeout(() => setCopiedStudentId(null), 1400);
    } catch {
        setCopiedStudentId(null);
    }
}

function ChevronDownIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M7 7L17 17M17 7L7 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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

function DotsIcon() {
    return (
        <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
            <circle cx="3.5" cy="8.5" r="1.2" fill="#3B3F6E" />
            <circle cx="8.5" cy="8.5" r="1.2" fill="#3B3F6E" />
            <circle cx="13.5" cy="8.5" r="1.2" fill="#3B3F6E" />
        </svg>
    );
}

function StudentsEmptyIcon() {
    return (
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 1C61.5391 1 79 18.4609 79 40C79 61.5391 61.5391 79 40 79C18.4609 79 1 61.5391 1 40C1 18.4609 18.4609 1 40 1Z" stroke="#3B3F6E" strokeWidth="2" />
            <g clipPath="url(#clip0_767_25280)">
                <path d="M22.5 35L40 25L57.5 35L40 45L22.5 35Z" stroke="#3B3F6E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M28.75 38.75V48.75L40 55M40 55L51.25 48.75V38.75M40 55V45M57.5 48.75V35" stroke="#3B3F6E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <defs>
                <clipPath id="clip0_767_25280">
                    <rect width="40" height="40" fill="white" transform="translate(20 20)" />
                </clipPath>
            </defs>
        </svg>
    );
}
