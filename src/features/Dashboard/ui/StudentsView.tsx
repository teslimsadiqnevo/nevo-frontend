'use client';

import { useEffect, useMemo, useState } from 'react';
import { StudentDetailView } from './StudentDetailView';
import { getTeacherStudents } from '../api/teacher';

type Signal = 'green' | 'amber' | 'violet';

interface StudentListItem {
    id: number | string;
    name: string;
    initials: string;
    classLabel: string;
    className: string;
    subject: string;
    lastActive: string;
    signal: Signal;
    raw: any;
}

export function StudentsView() {
    const [students, setStudents] = useState<StudentListItem[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<number | string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [classFilter, setClassFilter] = useState('All classes');
    const [showClassFilter, setShowClassFilter] = useState(false);
    const [loading, setLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            const res = await getTeacherStudents();
            if (!mounted) return;
            const d = 'data' in res ? res.data : null;
            const rawStudents = Array.isArray(d) ? d : Array.isArray(d?.students) ? d.students : [];
            const mapped: StudentListItem[] = rawStudents.map((s: any, i: number) => {
                const name = s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Student';
                const initials = name
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part: string) => part[0]?.toUpperCase() || '')
                    .join('') || 'ST';
                const className = s.class_name || s.className || s.class || 'Class';
                const subject = s.subject || s.primary_subject || '';
                const classLabel = `${className}${subject ? ` ${subject}` : ''}`;
                const signalScore = Number(s.signal_score ?? s.attention_score ?? s.warning_score ?? -1);
                const signal: Signal = signalScore >= 67 ? 'violet' : signalScore >= 34 ? 'amber' : 'green';
                return {
                    id: s.id ?? `student-${i}`,
                    name,
                    initials,
                    classLabel,
                    className,
                    subject,
                    lastActive: s.last_active || s.last_seen || 'Recently',
                    signal,
                    raw: s,
                };
            });
            setStudents(mapped);
            setLoading(false);
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const classOptions = useMemo(() => {
        const unique = Array.from(new Set(students.map((s) => s.classLabel).filter(Boolean)));
        return ['All classes', ...unique];
    }, [students]);

    const filtered = students.filter((student) => {
        const classMatch = classFilter === 'All classes' || student.classLabel === classFilter;
        const query = searchQuery.trim().toLowerCase();
        const textMatch = query.length === 0 || `${student.name} ${student.classLabel}`.toLowerCase().includes(query);
        return classMatch && textMatch;
    });

    if (selectedStudentId !== null) {
        const selected = students.find((s) => String(s.id) === String(selectedStudentId));
        return <StudentDetailView studentId={selectedStudentId} studentData={selected?.raw} onBack={() => setSelectedStudentId(null)} />;
    }

    return (
        <div className="w-full max-w-[900px]">
            <div className="flex items-center justify-between mb-3">
                <h1 className="text-[22px] font-bold text-indigo tracking-tight">Students</h1>
                <div className="relative">
                    <button
                        onClick={() => setShowClassFilter((v) => !v)}
                        className="flex items-center gap-2 px-4 py-[10px] border border-indigo rounded-xl text-[13px] font-medium text-indigo bg-transparent transition-colors cursor-pointer"
                    >
                        {classFilter}
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`transition-transform ${showClassFilter ? 'rotate-180' : ''}`}>
                            <path d="M4 6L8 10L12 6" />
                        </svg>
                    </button>
                    {showClassFilter && (
                        <div className="absolute top-full right-0 mt-1 bg-white border border-[#E0D9CE] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] z-20 min-w-[220px] overflow-hidden">
                            {classOptions.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => {
                                        setClassFilter(option);
                                        setShowClassFilter(false);
                                    }}
                                    className="w-full px-4 py-3 text-left text-[13px] font-medium text-indigo hover:bg-parchment transition-colors cursor-pointer"
                                >
                                    {option}
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
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search students"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#E0D9CE] bg-transparent text-[13.5px] text-[#2b2b2f] placeholder-[#9B9B9B] outline-none focus:border-indigo transition-colors"
                />
            </div>

            {loading ? (
                <StudentsSkeleton />
            ) : students.length === 0 ? (
                <div className="min-h-[68vh] flex flex-col items-center justify-center">
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
                    <p className="text-sm text-graphite-40 mb-5">No students connected yet.</p>
                    <button
                        onClick={async () => {
                            try {
                                await navigator.clipboard.writeText('LAGOS-ACADEMY-24');
                                setCopiedCode(true);
                                setTimeout(() => setCopiedCode(false), 1800);
                            } catch {
                                setCopiedCode(false);
                            }
                        }}
                        className="px-8 py-3 border border-indigo rounded-2xl text-indigo text-[15px] font-medium hover:bg-indigo-5 transition-colors cursor-pointer"
                    >
                        Share your school code
                    </button>
                    {copiedCode && <p className="mt-3 text-sm text-graphite-60">School code copied.</p>}
                </div>
            ) : (
                <div className="rounded-2xl overflow-hidden bg-transparent">
                    {filtered.map((student, idx) => (
                        <button
                            key={student.id}
                            onClick={() => setSelectedStudentId(student.id)}
                            className={`w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#F2EBDD] transition-colors cursor-pointer border-b border-[#DDD7CC]`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-indigo text-white text-[16px] font-semibold flex items-center justify-center shrink-0">
                                    {student.initials}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[15px] font-semibold text-[#2b2b2f] leading-tight truncate">{student.name}</p>
                                    <p className="text-[13px] text-graphite-40 leading-tight truncate">
                                        {student.classLabel} · Last active: {student.lastActive}
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
                    {filtered.length === 0 && (
                        <div className="px-6 py-12 text-center text-sm text-graphite-40">
                            No students match this filter.
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}

function StudentsSkeleton() {
    return (
        <div className="rounded-2xl overflow-hidden bg-transparent">
            {Array.from({ length: 5 }).map((_, idx) => (
                <div
                    key={idx}
                    className={`w-full px-4 py-4 flex items-center gap-3 ${idx < 4 ? 'border-b border-[#DDD7CC]' : ''}`}
                >
                    <div className="w-10 h-10 rounded-full bg-[#E8E2D4] animate-pulse shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="h-3.5 w-[130px] bg-[#E8E2D4] rounded-md animate-pulse mb-2" />
                        <div className="h-3 w-[170px] bg-[#E8E2D4] rounded-md animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
}
