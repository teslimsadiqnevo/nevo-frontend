'use client';

import { useEffect, useMemo, useState } from 'react';
import { StudentDetailView } from './StudentDetailView';
import { getSchoolSettings, getSchoolStudentsPage } from '../api/school';

type Signal = 'green' | 'amber' | 'violet';

interface StudentListItem {
    id: string;
    name: string;
    initials: string;
    classId: string | null;
    classLabel: string;
    teacherName: string;
    lastActive: string;
    signal: Signal;
    raw: any;
}

export function StudentsView() {
    const [students, setStudents] = useState<StudentListItem[]>([]);
    const [classOptions, setClassOptions] = useState<{ id: string | null; label: string }[]>([
        { id: null, label: 'All classes' },
    ]);
    const [schoolCode, setSchoolCode] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showClassFilter, setShowClassFilter] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [emptyState, setEmptyState] = useState<{ title?: string; description?: string; primary_action_label?: string } | null>(null);
    const [copiedCode, setCopiedCode] = useState(false);

    useEffect(() => {
        let mounted = true;

        void (async () => {
            const settingsRes = await getSchoolSettings();
            if (!mounted) return;
            const settings = 'data' in settingsRes ? settingsRes.data : null;
            setSchoolCode(settings?.school_code || '');
        })();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        let mounted = true;
        const timer = setTimeout(() => {
            void (async () => {
                setLoading(true);
                setError(null);

                const res = await getSchoolStudentsPage({
                    search: searchQuery.trim() || undefined,
                    classId: selectedClassId,
                });

                if (!mounted) return;

                if ('error' in res && res.error) {
                    setError(res.error);
                    setStudents([]);
                    setLoading(false);
                    return;
                }

                const data = 'data' in res ? res.data : null;
                const rows = Array.isArray(data?.students) ? data.students : [];
                const mapped: StudentListItem[] = rows.map((student: any) => ({
                    id: String(student.student_id || student.id),
                    name: student.full_name || 'Student',
                    initials: student.initials || 'ST',
                    classId: student.class_id ? String(student.class_id) : null,
                    classLabel: student.class_name || 'Unassigned class',
                    teacherName: student.teacher_name || 'No teacher assigned',
                    lastActive: student.last_active_label || 'No recent activity',
                    signal: mapStudentSignal(student.status),
                    raw: {
                        id: student.student_id,
                        name: student.full_name,
                        class_name: student.class_name,
                        teacher_name: student.teacher_name,
                        last_active: student.last_active_label,
                        lessons_completed: student.lessons_completed,
                        average_score: student.average_score,
                        nevo_id: student.nevo_id,
                        email: student.email,
                        status: student.status,
                        status_reason: student.status_reason,
                    },
                }));

                setStudents(mapped);
                setClassOptions([
                    { id: null, label: 'All classes' },
                    ...(Array.isArray(data?.class_options)
                        ? data.class_options.map((option: any) => ({
                              id: String(option.class_id),
                              label: option.class_name,
                          }))
                        : []),
                ]);
                setEmptyState(data?.empty_state || null);
                setLoading(false);
            })();
        }, 250);

        return () => {
            mounted = false;
            clearTimeout(timer);
        };
    }, [searchQuery, selectedClassId]);

    const selectedStudent = useMemo(
        () => students.find((student) => student.id === selectedStudentId) || null,
        [selectedStudentId, students],
    );

    if (selectedStudentId && selectedStudent) {
        return (
            <StudentDetailView
                studentId={selectedStudentId}
                studentData={selectedStudent.raw}
                onBack={() => setSelectedStudentId(null)}
            />
        );
    }

    return (
        <div className="w-full max-w-[900px]">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h1 className="text-[22px] font-bold text-indigo tracking-tight">Students</h1>
                    <p className="text-[13px] text-graphite-60 mt-1">Search by student name or filter by class.</p>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowClassFilter((value) => !value)}
                        className="flex items-center gap-2 px-4 py-[10px] border border-indigo rounded-xl text-[13px] font-medium text-indigo bg-transparent transition-colors cursor-pointer"
                    >
                        {classOptions.find((option) => option.id === selectedClassId)?.label || 'All classes'}
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`transition-transform ${showClassFilter ? 'rotate-180' : ''}`}>
                            <path d="M4 6L8 10L12 6" />
                        </svg>
                    </button>
                    {showClassFilter && (
                        <div className="absolute top-full right-0 mt-1 bg-white border border-[#E0D9CE] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] z-20 min-w-[220px] overflow-hidden">
                            {classOptions.map((option) => (
                                <button
                                    key={option.id || 'all'}
                                    onClick={() => {
                                        setSelectedClassId(option.id);
                                        setShowClassFilter(false);
                                    }}
                                    className="w-full px-4 py-3 text-left text-[13px] font-medium text-indigo hover:bg-parchment transition-colors cursor-pointer"
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="relative mb-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#3b3f6e" strokeWidth="1.5">
                        <circle cx="7.5" cy="7.5" r="5.5" />
                        <line x1="11.5" y1="11.5" x2="16" y2="16" strokeLinecap="round" />
                    </svg>
                </span>
                <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search students"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#E0D9CE] bg-transparent text-[13.5px] text-[#2b2b2f] placeholder-[#9B9B9B] outline-none focus:border-indigo transition-colors"
                />
            </div>

            {loading ? <StudentsSkeleton /> : null}

            {!loading && error ? (
                <div className="rounded-2xl border border-[#E0D9CE] bg-white px-6 py-8 text-center">
                    <p className="text-[14px] font-medium text-[#3B3F6E] mb-2">Couldn’t load students.</p>
                    <p className="text-[13px] text-graphite-60">{error}</p>
                </div>
            ) : null}

            {!loading && !error && students.length === 0 ? (
                <div className="min-h-[62vh] flex flex-col items-center justify-center rounded-2xl border border-[#E0D9CE] bg-white px-8 py-10 text-center">
                    <svg width="200" height="160" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4">
                        <path d="M0 16C0 7.16345 7.16344 0 16 0H184C192.837 0 200 7.16344 200 16V144C200 152.837 192.837 160 184 160H16C7.16344 160 0 152.837 0 144V16Z" fill="#9A9CCB" fillOpacity="0.15" />
                        <g clipPath="url(#students-empty-clip)">
                            <path d="M100 67C106.627 67 112 61.6274 112 55C112 48.3726 106.627 43 100 43C93.3726 43 88 48.3726 88 55C88 61.6274 93.3726 67 100 67Z" stroke="#3B3F6E" strokeWidth="2" />
                            <path d="M100 67V90" stroke="#3B3F6E" strokeWidth="2" />
                            <path d="M100 75L85 65" stroke="#3B3F6E" strokeWidth="2" />
                            <path d="M100 75L115 65" stroke="#3B3F6E" strokeWidth="2" />
                            <path d="M100 90L90 110" stroke="#3B3F6E" strokeWidth="2" />
                            <path d="M100 90L110 110" stroke="#3B3F6E" strokeWidth="2" />
                            <path d="M60 113C64.4183 113 68 109.418 68 105C68 100.582 64.4183 97 60 97C55.5817 97 52 100.582 52 105C52 109.418 55.5817 113 60 113Z" stroke="#3B3F6E" strokeWidth="2" />
                            <path d="M60 113V125" stroke="#3B3F6E" strokeWidth="1.5" />
                            <path d="M140 113C144.418 113 148 109.418 148 105C148 100.582 144.418 97 140 97C135.582 97 132 100.582 132 105C132 109.418 135.582 113 140 113Z" stroke="#3B3F6E" strokeWidth="2" />
                            <path d="M140 113V125" stroke="#3B3F6E" strokeWidth="1.5" />
                            <path d="M75 121C78.3137 121 81 118.314 81 115C81 111.686 78.3137 109 75 109C71.6863 109 69 111.686 69 115C69 118.314 71.6863 121 75 121Z" stroke="#3B3F6E" strokeWidth="2" />
                            <path d="M75 121V130" stroke="#3B3F6E" strokeWidth="1.5" />
                        </g>
                        <defs>
                            <clipPath id="students-empty-clip">
                                <rect width="160" height="120" fill="white" transform="translate(20 20)" />
                            </clipPath>
                        </defs>
                    </svg>
                    <p className="text-[18px] font-semibold text-[#3B3F6E] mb-2">
                        {emptyState?.title || 'No students connected yet.'}
                    </p>
                    <p className="text-sm text-graphite-40 mb-5 max-w-[420px]">
                        {emptyState?.description || 'Share your school code so learners can join and start appearing here.'}
                    </p>
                    <button
                        onClick={async () => {
                            if (!schoolCode) return;
                            try {
                                await navigator.clipboard.writeText(schoolCode);
                                setCopiedCode(true);
                                setTimeout(() => setCopiedCode(false), 1800);
                            } catch {
                                setCopiedCode(false);
                            }
                        }}
                        disabled={!schoolCode}
                        className="px-8 py-3 border border-indigo rounded-2xl text-indigo text-[15px] font-medium hover:bg-indigo-5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {emptyState?.primary_action_label || 'Share your school code'}
                    </button>
                    {copiedCode ? <p className="mt-3 text-sm text-graphite-60">School code copied.</p> : null}
                </div>
            ) : null}

            {!loading && !error && students.length > 0 ? (
                <div className="rounded-2xl overflow-hidden bg-transparent">
                    {students.map((student) => (
                        <button
                            key={student.id}
                            onClick={() => setSelectedStudentId(student.id)}
                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#F2EBDD] transition-colors cursor-pointer border-b border-[#DDD7CC]"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-indigo text-white text-[16px] font-semibold flex items-center justify-center shrink-0">
                                    {student.initials}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[15px] font-semibold text-[#2b2b2f] leading-tight truncate">{student.name}</p>
                                    <p className="text-[13px] text-graphite-40 leading-tight truncate">
                                        {student.classLabel} • {student.teacherName} • Last active: {student.lastActive}
                                    </p>
                                </div>
                            </div>
                            <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                    student.signal === 'green'
                                        ? 'bg-[#7AB87A]'
                                        : student.signal === 'amber'
                                            ? 'bg-[#E8A84A]'
                                            : 'bg-[#9A9CCB]'
                                }`}
                            />
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function mapStudentSignal(status: string | null | undefined): Signal {
    switch (status) {
        case 'needs_support':
        case 'awaiting_assessment':
            return 'amber';
        case 'inactive':
        case 'not_started':
            return 'violet';
        default:
            return 'green';
    }
}

function StudentsSkeleton() {
    return (
        <div className="rounded-2xl overflow-hidden bg-transparent">
            {Array.from({ length: 5 }).map((_, index) => (
                <div
                    key={index}
                    className={`w-full px-4 py-4 flex items-center gap-3 ${index < 4 ? 'border-b border-[#DDD7CC]' : ''}`}
                >
                    <div className="w-10 h-10 rounded-full bg-[#E8E2D4] animate-pulse shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="h-3.5 w-[130px] bg-[#E8E2D4] rounded-md animate-pulse mb-2" />
                        <div className="h-3 w-[210px] bg-[#E8E2D4] rounded-md animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
}
