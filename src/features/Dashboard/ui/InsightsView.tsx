'use client';

import { useState, useEffect, useMemo } from 'react';
import { getTeacherDashboard, getTeacherStudents } from '../api/teacher';
import { useAuthGuard } from '@/shared/lib';

/* ─── Types ─── */
interface SupportStudent {
    id: string;
    initials: string;
    avatarBg: string;
    name: string;
    issues: string[];
}

interface ConfusionLesson {
    id: string;
    title: string;
    detail: string;
}

interface TopicProgress {
    id: string;
    title: string;
    description: string;
    bars?: { label: string; value: number }[];
    students?: TopicStudent[];
}

interface SectionDetail {
    title: string;
    checkpoints: number;
    understood: number;
    total: number;
    students?: { initials: string; avatarBg: string; name: string; tag: string; tagColor: string }[];
    suggestion?: string;
}

/* ─── Mock Data ─── */
const supportStudents: SupportStudent[] = [
    { id: 'ec', initials: 'EC', avatarBg: '#6A7DB5', name: 'Emma Chen', issues: ['Missed 3 assignments', 'Low participation'] },
    { id: 'lt', initials: 'LT', avatarBg: '#5B8A6E', name: 'Liam Torres', issues: ['Struggling with fractions', 'Requested 4 hints'] },
    { id: 'aj', initials: 'AJ', avatarBg: '#7B6DAA', name: 'Ava Johnson', issues: ['Below grade level', 'Needs extra support'] },
    { id: 'nk', initials: 'NK', avatarBg: '#4A8B9D', name: 'Noah Kim', issues: ['Missed 2 lessons', 'Low engagement'] },
];

const confusionLessons: ConfusionLesson[] = [
    { id: 'solving-linear', title: 'Solving Linear Equations', detail: 'Section 3 — 8 simplify requests' },
    { id: 'multiplying-fractions', title: 'Multiplying Fractions', detail: 'Section 2 — 12 hint requests' },
    { id: 'area-perimeter', title: 'Area and Perimeter', detail: 'Section 4 — 6 simplify requests' },
];

const topicsBuilding: TopicProgress[] = [
    { id: 'fractions-decimals', title: 'Fractions and Decimals', description: 'Understanding improving across Grade 6' },
    { id: 'number-sense', title: 'Number Sense', description: 'Strong progress in all sections' },
];

interface TopicStudent {
    initials: string;
    avatarBg: string;
    name: string;
    status: 'on-track' | 'building' | 'may-need-support';
}

interface TopicDetail {
    title: string;
    lessonBars: { label: string; value: number }[]; // value 0–100
    summary: string;
    students: TopicStudent[];
}

/* ─── Main Component ─── */
export function InsightsView() {
    const guardAuth = useAuthGuard('teacher');
    const [isLoading, setIsLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [studentsData, setStudentsData] = useState<any[]>([]);
    const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [selectedGrade, setSelectedGrade] = useState('All classes');

    useEffect(() => {
        let mounted = true;
        (async () => {
            const [dashboardRes, studentsRes] = await Promise.all([getTeacherDashboard(), getTeacherStudents()]);
            if (!mounted) return;
            if (guardAuth([dashboardRes as any, studentsRes as any])) return;
            setDashboardData('data' in dashboardRes ? dashboardRes.data || null : null);
            const studentPayload = 'data' in studentsRes ? studentsRes.data : null;
            setStudentsData(Array.isArray(studentPayload) ? studentPayload : Array.isArray(studentPayload?.students) ? studentPayload.students : []);
            setIsLoading(false);
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const filteredStudentsData = useMemo(() => {
        if (selectedGrade === 'All classes') return studentsData;
        return studentsData.filter((s: any) => (s.class_name || s.class) === selectedGrade);
    }, [studentsData, selectedGrade]);

    const supportStudents = useMemo<SupportStudent[]>(() => {
        return filteredStudentsData
            .filter((s: any) => Number(s.signal_score ?? s.attention_score ?? 0) > 0 || Array.isArray(s.issues))
            .slice(0, 4)
            .map((s: any, idx: number) => {
                const name = s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Student';
                const initials = name
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p: string) => p[0]?.toUpperCase() || '')
                    .join('') || 'ST';
                const issues = Array.isArray(s.issues)
                    ? s.issues
                    : [s.signal_reason || s.support_note || 'May need additional support'].filter(Boolean);
                const colors = ['#6A7DB5', '#5B8A6E', '#7B6DAA', '#4A8B9D'];
                return { id: String(s.id ?? idx), initials, avatarBg: colors[idx % colors.length], name, issues };
            });
    }, [filteredStudentsData]);

    const confusionLessons = useMemo<ConfusionLesson[]>(() => {
        const lessons = Array.isArray(dashboardData?.lessons) ? dashboardData.lessons : [];
        return lessons
            .filter((l: any) => Number(l.confusion_signals ?? l.confusion_count ?? 0) > 0)
            .map((l: any, idx: number) => ({
                id: String(l.id ?? `lesson-${idx}`),
                title: l.title || l.name || 'Lesson',
                detail: l.confusion_detail || l.detail || `Confusion signals: ${Number(l.confusion_signals ?? l.confusion_count ?? 0)}`,
            }))
            .slice(0, 6);
    }, [dashboardData]);

    const topicsBuilding = useMemo<TopicProgress[]>(() => {
        const topics = Array.isArray(dashboardData?.topics_building) ? dashboardData.topics_building : [];
        return topics.map((t: any, idx: number) => ({
            id: String(t.id ?? `topic-${idx}`),
            title: t.title || t.topic || 'Topic',
            description: t.description || t.summary || 'Understanding is improving.',
            bars: Array.isArray(t.lesson_bars) ? t.lesson_bars.map((b: any, i: number) => ({ label: b.label || `Lesson ${i + 1}`, value: Number(b.value ?? 0) })) : [],
            students: Array.isArray(t.students)
                ? t.students.map((s: any) => {
                      const n = s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Student';
                      const initials = n
                          .split(' ')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((p: string) => p[0]?.toUpperCase() || '')
                          .join('') || 'ST';
                      return {
                          initials,
                          avatarBg: '#6A7DB5',
                          name: n,
                          status: (s.status === 'on-track' || s.status === 'building' || s.status === 'may-need-support') ? s.status : 'building',
                      } as TopicStudent;
                  })
                : [],
        }));
    }, [dashboardData]);

    const lessonSections = useMemo<Record<string, { title: string; sections: SectionDetail[] }>>(() => {
        const lessons = Array.isArray(dashboardData?.lessons) ? dashboardData.lessons : [];
        const mapped: Record<string, { title: string; sections: SectionDetail[] }> = {};
        lessons.forEach((lesson: any, idx: number) => {
            const id = String(lesson.id ?? `lesson-${idx}`);
            const sections = Array.isArray(lesson.sections)
                ? lesson.sections.map((sec: any, i: number) => ({
                      title: sec.title || `Section ${i + 1}`,
                      checkpoints: Number(sec.checkpoints ?? 0),
                      understood: Number(sec.understood ?? 0),
                      total: Number(sec.total ?? 0),
                      suggestion: sec.suggestion || undefined,
                  }))
                : [];
            mapped[id] = { title: lesson.title || lesson.name || 'Lesson', sections };
        });
        return mapped;
    }, [dashboardData]);

    const topicDetails = useMemo<Record<string, TopicDetail>>(() => {
        const map: Record<string, TopicDetail> = {};
        topicsBuilding.forEach((topic) => {
            map[topic.id] = {
                title: topic.title,
                lessonBars: topic.bars && topic.bars.length > 0 ? topic.bars : [{ label: 'Lesson 1', value: 0 }],
                summary: topic.description,
                students: topic.students && topic.students.length > 0 ? topic.students : [],
            };
        });
        return map;
    }, [topicsBuilding]);

    const hasData = supportStudents.length > 0 || confusionLessons.length > 0 || topicsBuilding.length > 0;
    const gradeOptions = useMemo(() => {
        const classes = studentsData.map((s: any) => s.class_name || s.class).filter(Boolean);
        return ['All classes', ...Array.from(new Set(classes))];
    }, [studentsData]);

    if (selectedLesson) {
        const data = lessonSections[selectedLesson];
        if (data) {
            return <LessonInsightDetail title={data.title} sections={data.sections} onBack={() => setSelectedLesson(null)} />;
        }
    }

    if (selectedTopic) {
        const data = topicDetails[selectedTopic];
        if (data) {
            return <TopicDetailView topic={data} onBack={() => setSelectedTopic(null)} />;
        }
    }

    if (isLoading) return <InsightsSkeleton />;
    if (!hasData) return <InsightsEmpty />;

    return (
        <div className="flex flex-col h-full w-full max-w-[900px] pb-12">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-semibold text-[#3B3F6E] leading-tight">Insights</h2>
                <div className="flex gap-3">
                    <FilterDropdown label={selectedGrade} options={gradeOptions} onSelect={setSelectedGrade} />
                    <button className="flex items-center gap-2 px-4 py-2 border border-[#D4D0CA] rounded-xl text-[13px] font-semibold text-[#3B3F6E] bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                        <CalendarIcon />
                        Last 7 days
                    </button>
                </div>
            </div>

            {/* Students who may need support */}
            <section className="mb-8">
                <h3 className="text-[15px] font-semibold text-[#3B3F6E] mb-4">Students who may need support</h3>
                <div className="grid grid-cols-4 gap-3">
                    {supportStudents.map((student) => (
                        <div key={student.name} className="bg-white rounded-2xl border border-[#E9E7E2] p-5 flex flex-col">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-bold mb-3"
                                style={{ backgroundColor: student.avatarBg }}
                            >
                                {student.initials}
                            </div>
                            <p className="text-[14px] font-semibold text-[#2B2B2F] mb-1.5">{student.name}</p>
                            <div className="flex flex-col gap-0.5 mb-3 flex-1">
                                {student.issues.map((issue) => (
                                    <p key={issue} className="text-[12px] text-graphite-40 leading-snug">{issue}</p>
                                ))}
                            </div>
                            <button className="text-[12.5px] font-semibold text-[#3B3F6E] hover:underline cursor-pointer text-left w-fit">
                                View student
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Lessons with confusion signals */}
            <section className="mb-8">
                <h3 className="text-[15px] font-semibold text-[#3B3F6E] mb-4">Lessons with confusion signals</h3>
                <div className="flex flex-col gap-3">
                    {confusionLessons.map((lesson) => (
                        <div key={lesson.id} className="bg-white rounded-2xl border border-[#E9E7E2] px-6 py-5 flex items-center justify-between">
                            <div>
                                <p className="text-[14px] font-semibold text-[#2B2B2F] mb-0.5">{lesson.title}</p>
                                <p className="text-[12px] text-graphite-40">{lesson.detail}</p>
                            </div>
                            <button
                                onClick={() => setSelectedLesson(lesson.id)}
                                className="text-[12.5px] font-semibold text-[#3B3F6E] hover:underline cursor-pointer shrink-0 flex items-center gap-1"
                            >
                                View lesson <span>→</span>
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Topics building well */}
            <section>
                <h3 className="text-[15px] font-semibold text-[#3B3F6E] mb-4">Topics building well</h3>
                <div className="flex flex-col gap-3">
                    {topicsBuilding.map((topic) => (
                        <div key={topic.id} className="bg-white rounded-2xl border border-[#E9E7E2] px-6 py-5 flex items-center justify-between">
                            <div>
                                <p className="text-[14px] font-semibold text-[#2B2B2F] mb-0.5">{topic.title}</p>
                                <p className="text-[12px] text-graphite-40">{topic.description}</p>
                            </div>
                            <button
                                onClick={() => setSelectedTopic(topic.id)}
                                className="text-[12.5px] font-semibold text-[#3B3F6E] hover:underline cursor-pointer shrink-0 flex items-center gap-1"
                            >
                                View progress <span>→</span>
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

/* ─── Lesson Insight Detail ─── */
function LessonInsightDetail({
    title,
    sections,
    onBack,
}: {
    title: string;
    sections: SectionDetail[];
    onBack: () => void;
}) {
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

    return (
        <div className="flex flex-col h-full w-full max-w-[900px] pb-12">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-[14px] text-graphite-60 font-medium mb-4 hover:text-[#3B3F6E] transition-colors cursor-pointer w-fit"
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M10 3L5 8L10 13" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Insights
            </button>

            <h2 className="text-[20px] font-semibold text-[#3B3F6E] text-center mb-6">{title}</h2>

            <div className="flex flex-col gap-3">
                {sections.map((section, idx) => {
                    const isExpanded = expandedIdx === idx;
                    const progressPct = (section.understood / section.total) * 100;

                    return (
                        <div key={section.title}>
                            <button
                                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                                className="w-full bg-white rounded-2xl border border-[#E9E7E2] px-6 py-5 flex items-center justify-between cursor-pointer hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow text-left"
                            >
                                <div>
                                    <p className="text-[14px] font-semibold text-[#2B2B2F] mb-0.5">{section.title}</p>
                                    <p className="text-[12px] text-graphite-40">{section.checkpoints} checkpoints</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="w-[60px] h-[6px] bg-[#EEECEA] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#3B3F6E] rounded-full"
                                            style={{ width: `${progressPct}%` }}
                                        />
                                    </div>
                                    <span className="text-[12px] text-graphite-40 min-w-[110px] text-right">
                                        {section.understood} of {section.total} understood
                                    </span>
                                </div>
                            </button>

                            {/* Expanded content */}
                            {isExpanded && section.students && (
                                <div className="bg-white border-x border-b border-[#E9E7E2] rounded-b-2xl -mt-2 pt-4 px-6 pb-5">
                                    <div className="flex flex-col gap-3 mb-4">
                                        {section.students.map((s) => (
                                            <div key={s.name} className="flex items-center gap-3">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                                                    style={{ backgroundColor: s.avatarBg }}
                                                >
                                                    {s.initials}
                                                </div>
                                                <span className="text-[13px] font-medium text-[#2B2B2F] min-w-[120px]">{s.name}</span>
                                                <span
                                                    className="text-[11px] font-medium px-2.5 py-1 rounded-md"
                                                    style={{ backgroundColor: s.tagColor, color: s.tagColor === '#FEEFC3' ? '#92400E' : '#4A4A4A' }}
                                                >
                                                    {s.tag}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <button className="text-[12.5px] font-semibold text-[#3B3F6E] hover:underline cursor-pointer flex items-center gap-1 mb-4">
                                        View all 8 students <span>→</span>
                                    </button>

                                    {section.suggestion && (
                                        <div className="bg-[#FEF9EE] border border-[#F5E6C8] rounded-xl px-5 py-4">
                                            <p className="text-[10px] font-bold text-[#92400E] tracking-wider uppercase mb-1.5">Suggestion</p>
                                            <div className="flex items-start justify-between gap-4">
                                                <p className="text-[13px] text-[#2B2B2F] leading-relaxed">{section.suggestion}</p>
                                                <button className="shrink-0 px-4 py-2 border border-[#3B3F6E] text-[#3B3F6E] rounded-xl text-[12px] font-semibold hover:bg-indigo-5 transition-colors cursor-pointer">
                                                    Revise section
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── Topic Detail View ─── */
const STATUS_CONFIG: Record<TopicStudent['status'], { label: string; bg: string; color: string }> = {
    'on-track': { label: 'On track', bg: '#D1FAE5', color: '#065F46' },
    'building': { label: 'Building', bg: '#E0DDD8', color: '#4A4A4A' },
    'may-need-support': { label: 'May need support', bg: '#FEEFC3', color: '#92400E' },
};

function TopicDetailView({ topic, onBack }: { topic: TopicDetail; onBack: () => void }) {
    const maxBar = Math.max(...topic.lessonBars.map(b => b.value));

    return (
        <div className="flex flex-col h-full w-full max-w-[900px] pb-12">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-[14px] text-graphite-60 font-medium mb-4 hover:text-[#3B3F6E] transition-colors cursor-pointer w-fit"
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M10 3L5 8L10 13" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Insights
            </button>

            <h2 className="text-[20px] font-semibold text-[#3B3F6E] text-center mb-6">{topic.title}</h2>

            {/* Class performance chart */}
            <section className="mb-6">
                <p className="text-[13px] text-graphite-60 font-medium mb-4">Class performance on this topic</p>
                <div className="bg-white rounded-2xl border border-[#E9E7E2] px-8 py-6">
                    <div className="flex items-end justify-center gap-6 h-[120px]">
                        {topic.lessonBars.map((bar) => (
                            <div key={bar.label} className="flex flex-col items-center gap-2">
                                <div
                                    className="w-[50px] rounded-md bg-[#3B3F6E] transition-all"
                                    style={{ height: `${(bar.value / maxBar) * 100}px` }}
                                />
                                <span className="text-[11px] text-graphite-40 font-medium">{bar.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <p className="text-[12px] text-graphite-40 mb-6">{topic.summary}</p>

            {/* Students list */}
            <section>
                <h3 className="text-[15px] font-semibold text-[#3B3F6E] mb-4">Students</h3>
                <div className="flex flex-col">
                    {topic.students.map((student, i) => {
                        const cfg = STATUS_CONFIG[student.status];
                        return (
                            <div
                                key={`${student.initials}-${i}`}
                                className={`flex items-center gap-3 py-3 px-1 ${i < topic.students.length - 1 ? 'border-b border-[#EEECEA]' : ''}`}
                            >
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                                    style={{ backgroundColor: student.avatarBg }}
                                >
                                    {student.initials}
                                </div>
                                <span className="text-[13px] font-medium text-[#2B2B2F] min-w-[160px]">{student.name}</span>
                                <span
                                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md"
                                    style={{ backgroundColor: cfg.bg, color: cfg.color }}
                                >
                                    {cfg.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}

/* ─── Empty State ─── */
function InsightsEmpty() {
    return (
        <div className="flex flex-col items-center justify-center flex-1 py-20">
            <div className="w-[180px] h-[130px] bg-[#E8E4DC] rounded-2xl flex items-center justify-center mb-5 overflow-hidden">
                <svg width="100" height="70" viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Simplified classroom illustration */}
                    <rect x="10" y="5" width="80" height="45" rx="3" stroke="#3B3F6E" strokeWidth="1.2" fill="#F5ECD8"/>
                    <rect x="30" y="10" width="40" height="25" rx="2" stroke="#3B3F6E" strokeWidth="1" fill="white"/>
                    {/* Desks */}
                    <rect x="15" y="55" width="15" height="8" rx="1" stroke="#3B3F6E" strokeWidth="0.8" fill="#E8DCC8"/>
                    <rect x="35" y="55" width="15" height="8" rx="1" stroke="#3B3F6E" strokeWidth="0.8" fill="#E8DCC8"/>
                    <rect x="55" y="55" width="15" height="8" rx="1" stroke="#3B3F6E" strokeWidth="0.8" fill="#E8DCC8"/>
                    <rect x="75" y="55" width="15" height="8" rx="1" stroke="#3B3F6E" strokeWidth="0.8" fill="#E8DCC8"/>
                </svg>
            </div>
            <p className="text-[15px] font-semibold text-[#3B3F6E] mb-1.5">No signals to review right now</p>
            <p className="text-[13px] text-graphite-40">Check back as students progress through their lessons.</p>
        </div>
    );
}

/* ─── Skeleton Loader ─── */
function InsightsSkeleton() {
    return (
        <div className="flex flex-col h-full w-full max-w-[900px] pb-12">
            <div className="flex justify-between items-center mb-8">
                <div className="h-6 w-[72px] bg-[#E8E2D4] rounded-md animate-pulse" />
                <div className="flex gap-3">
                    <div className="h-9 w-[128px] bg-[#E8E2D4] rounded-xl animate-pulse" />
                    <div className="h-9 w-[128px] bg-[#E8E2D4] rounded-xl animate-pulse" />
                </div>
            </div>

            <div className="h-4 w-[160px] bg-[#E8E2D4] rounded-md animate-pulse mb-4" />

            <div className="grid grid-cols-4 gap-3 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-[#E8E2D4] rounded-2xl h-[96px] animate-pulse" />
                ))}
            </div>

            <div className="h-4 w-[180px] bg-[#E8E2D4] rounded-md animate-pulse mb-4" />
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-[#E8E2D4] rounded-2xl h-[68px] animate-pulse mb-3" />
            ))}

            <div className="h-4 w-[130px] bg-[#E8E2D4] rounded-md animate-pulse mb-4 mt-5" />
            {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-[#E8E2D4] rounded-2xl h-[68px] animate-pulse mb-3" />
            ))}
        </div>
    );
}

/* ─── Filter Dropdown ─── */
function FilterDropdown({
    label,
    options,
    onSelect,
}: {
    label: string;
    options: string[];
    onSelect: (value: string) => void;
}) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 px-4 py-2 border border-[#D4D0CA] rounded-xl text-[13px] font-semibold text-[#3B3F6E] bg-white hover:bg-gray-50 transition-colors cursor-pointer"
            >
                {label}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#3B3F6E" strokeWidth="1.5" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
                    <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-[#E0DDD8] rounded-xl shadow-lg py-1 min-w-[160px] z-10">
                    {options.map((opt) => (
                        <button
                            key={opt}
                            onClick={() => {
                                onSelect(opt);
                                setOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-[13px] font-medium transition-colors cursor-pointer ${
                                opt === label ? 'text-[#3B3F6E] bg-indigo-5' : 'text-graphite-60 hover:bg-gray-50'
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── Icons ─── */
function CalendarIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#3B3F6E" strokeWidth="1.3">
            <rect x="2" y="3" width="12" height="11" rx="2" />
            <line x1="2" y1="7" x2="14" y2="7" />
            <line x1="5" y1="1" x2="5" y2="4" strokeLinecap="round" />
            <line x1="11" y1="1" x2="11" y2="4" strokeLinecap="round" />
        </svg>
    );
}
