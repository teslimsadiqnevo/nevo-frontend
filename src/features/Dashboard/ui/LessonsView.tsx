'use client';

import { useState, useMemo, useEffect } from 'react';
import { AddLessonWizard } from './AddLessonWizard';
import { AssignLessonWizard } from './AssignLessonWizard';
import { LessonDetailsView } from './LessonDetailsView';
import {
    archiveTeacherLesson,
    duplicateTeacherLesson,
    getTeacherLessons,
} from '../api/teacher';

type LessonStatus = 'Published' | 'Draft';

interface Lesson {
    id: number | string;
    title: string;
    subject: string;
    level: string;
    duration: number;
    status: LessonStatus;
    lastUpdated: string;
    signal?: { type: 'warning' | 'success'; text: string };
}

interface BackendLessonItem {
    id: string;
    title: string;
    subject?: string | null;
    topic?: string | null;
    status: string;
    target_grade_level: number;
    education_level: string;
    estimated_duration_minutes: number;
    created_at: string;
    published_at?: string | null;
    last_updated: string;
    assignment_count: number;
    completion_count: number;
    confusion_signal_count: number;
}

type TabFilter = 'All' | 'Published' | 'Drafts';

export function LessonsView() {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [activeTab, setActiveTab] = useState<TabFilter>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    const [showWizard, setShowWizard] = useState(false);
    const [showAssignWizard, setShowAssignWizard] = useState(false);
    const [viewingLesson, setViewingLesson] = useState<Lesson | null>(null);
    const [selectedMenuLesson, setSelectedMenuLesson] = useState<Lesson | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setIsLoading(true);
            setLoadError(null);

            const res = await getTeacherLessons({ page: 1, page_size: 100, sort_by: 'created_at', sort_order: 'desc' });
            if (!mounted) return;
            if (!('data' in res)) {
                setLoadError(res.error || 'Could not load lessons.');
                setLessons([]);
                setIsLoading(false);
                return;
            }

            const payload = res.data || {};
            const rawLessons: BackendLessonItem[] = Array.isArray(payload?.lessons) ? payload.lessons : [];

            const mapped: Lesson[] = rawLessons.map((l: BackendLessonItem) => {
                const rawStatus = String(l?.status || 'published').toLowerCase();
                const status: LessonStatus = rawStatus === 'draft' ? 'Draft' : 'Published';
                const updatedRaw = l?.last_updated || l?.published_at || l?.created_at;
                const lastUpdated = updatedRaw ? `Last updated ${new Date(updatedRaw).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Last updated recently';
                const confusionCount = Number(l?.confusion_signal_count || 0);
                const completionCount = Number(l?.completion_count || 0);

                return {
                    id: l.id,
                    title: l.title || 'Untitled lesson',
                    subject: l.subject || l.topic || 'General',
                    level: l.education_level || 'Secondary',
                    duration: Number(l.estimated_duration_minutes || 0),
                    status,
                    lastUpdated,
                    signal:
                        confusionCount > 0
                            ? { type: 'warning', text: `Confusion signals from ${confusionCount} ${confusionCount === 1 ? 'student' : 'students'}` }
                            : completionCount > 0
                                ? { type: 'success', text: `${completionCount} ${completionCount === 1 ? 'student' : 'students'} completed` }
                                : undefined,
                };
            });

            setLessons(mapped);
            setIsLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, [reloadKey]);

    const subjects = useMemo(() => Array.from(new Set(lessons.map((l) => l.subject))).filter(Boolean), [lessons]);
    const levels = useMemo(() => Array.from(new Set(lessons.map((l) => l.level))).filter(Boolean), [lessons]);

    const counts = useMemo(() => ({
        all: lessons.length,
        published: lessons.filter(l => l.status === 'Published').length,
        drafts: lessons.filter(l => l.status === 'Draft').length,
    }), [lessons]);

    const filtered = useMemo(() => {
        return lessons.filter(lesson => {
            // Tab filter
            if (activeTab === 'Published' && lesson.status !== 'Published') return false;
            if (activeTab === 'Drafts' && lesson.status !== 'Draft') return false;

            // Search filter
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!lesson.title.toLowerCase().includes(q) && !lesson.subject.toLowerCase().includes(q)) return false;
            }

            // Subject filter
            if (selectedSubjects.length > 0 && !selectedSubjects.includes(lesson.subject)) return false;

            // Level filter
            if (selectedLevels.length > 0 && !selectedLevels.includes(lesson.level)) return false;

            return true;
        });
    }, [activeTab, searchQuery, selectedSubjects, selectedLevels]);

    const toggleSubject = (s: string) => {
        setSelectedSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    };

    const toggleLevel = (l: string) => {
        setSelectedLevels(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);
    };

    const clearFilters = () => {
        setSelectedSubjects([]);
        setSelectedLevels([]);
    };

    const applyFilters = () => {
        setShowFilter(false);
    };

    const tabs: { label: string; value: TabFilter; count: number }[] = [
        { label: 'All', value: 'All', count: counts.all },
        { label: 'Published', value: 'Published', count: counts.published },
        { label: 'Drafts', value: 'Drafts', count: counts.drafts },
    ];

    const handleReload = () => setReloadKey((value) => value + 1);

    const handleDuplicateLesson = async (lesson: Lesson) => {
        const res = await duplicateTeacherLesson(String(lesson.id));
        if ('data' in res) {
            setSelectedMenuLesson(null);
            handleReload();
        }
    };

    const handleArchiveLesson = async (lesson: Lesson) => {
        const res = await archiveTeacherLesson(String(lesson.id));
        if ('data' in res) {
            setSelectedMenuLesson(null);
            handleReload();
        }
    };

    if (showWizard) {
        return <AddLessonWizard onClose={() => { setShowWizard(false); handleReload(); }} onAssign={() => { setShowWizard(false); setShowAssignWizard(true); }} />;
    }

    if (showAssignWizard) {
        return <AssignLessonWizard onClose={() => setShowAssignWizard(false)} />;
    }

    if (viewingLesson) {
        return <LessonDetailsView lesson={viewingLesson} onBack={() => setViewingLesson(null)} />;
    }

        return (
        <div className="flex flex-col h-full w-full max-w-225">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-[#3B3F6E] leading-tight">Lessons</h2>
                <div className="flex gap-2">
                    {/* <button
                        onClick={() => setShowAssignWizard(true)}
                        className="bg-white text-[#3B3F6E] border border-[#3B3F6E] px-5 py-2.5 rounded-full font-semibold text-[13px] hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2"
                    >
                        Assign lesson
                    </button> */}
                    <button
                        onClick={() => setShowWizard(true)}
                        className="bg-[#3B3F6E] text-white px-5 py-2.5 rounded-full font-semibold text-[13px] hover:bg-[#2E3259] transition-colors cursor-pointer flex items-center gap-2"
                    >
                        <UploadIcon />
                        Upload lesson
                    </button>
                </div>
            </div>

            {loadError && (
                <div className="mb-4 rounded-xl border border-[#E0D9CE] bg-white px-4 py-3 text-[13px] text-[#C04A3A]">
                    {loadError}
                </div>
            )}

            {/* Search + Filter */}
            <div className="flex gap-3 mb-5">
                <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        <SearchIcon />
                    </span>
                    <input
                        type="text"
                        placeholder="Search lessons..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-[#E0DDD8] bg-white text-[13.5px] outline-none focus:border-[#3B3F6E] text-[#111111] font-medium placeholder-graphite-40 transition-colors"
                    />
                </div>
                <button
                    onClick={() => setShowFilter(true)}
                    className="flex cursor-pointer items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E0DDD8] bg-white text-[13.5px] font-semibold text-[#3B3F6E] hover:bg-gray-50 transition-colors"
                >
                    <FilterIcon />
                    Filter
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-5">
                {tabs.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
                            activeTab === tab.value
                                ? 'bg-[#3B3F6E] text-white'
                                : 'bg-transparent text-graphite-60 hover:bg-graphite-5'
                        }`}
                    >
                        {tab.label}
                                <span
                            className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center ${
                                activeTab === tab.value
                                    ? 'bg-white/20 text-white'
                                    : 'bg-graphite-10 text-graphite-60'
                            }`}
                        >
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Lesson List */}
            <div className="flex flex-col gap-3 pb-12">
                {isLoading && (
                    <div className="rounded-2xl border border-[#E0DDD8] bg-white px-6 py-10 text-[13px] text-graphite-40">
                        Loading lessons…
                    </div>
                )}
                {!isLoading && filtered.map((lesson) => (
                    <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        onClick={() => setViewingLesson(lesson)}
                        onMenuClick={() => setSelectedMenuLesson(lesson)}
                    />
                ))}
                {!isLoading && filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-graphite-40 text-[14px]">
                        No lessons found.
                    </div>
                )}
            </div>

            {/* Filter Bottom Sheet */}
            {showFilter && (
                <FilterSheet
                    subjects={subjects}
                    levels={levels}
                    selectedSubjects={selectedSubjects}
                    selectedLevels={selectedLevels}
                    onToggleSubject={toggleSubject}
                    onToggleLevel={toggleLevel}
                    onApply={applyFilters}
                    onClear={clearFilters}
                    onClose={() => setShowFilter(false)}
                />
            )}

            {selectedMenuLesson && (
                <LessonActionSheet
                    lesson={selectedMenuLesson}
                    onView={() => {
                        setViewingLesson(selectedMenuLesson);
                        setSelectedMenuLesson(null);
                    }}
                    onEdit={() => {
                        setViewingLesson(selectedMenuLesson);
                        setSelectedMenuLesson(null);
                    }}
                    onDuplicate={() => handleDuplicateLesson(selectedMenuLesson)}
                    onArchive={() => handleArchiveLesson(selectedMenuLesson)}
                    onClose={() => setSelectedMenuLesson(null)}
                />
            )}
        </div>
    );
}

function LessonRow({ lesson, onClick, onMenuClick }: { lesson: Lesson; onClick: () => void; onMenuClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="relative w-185 h-27.5 bg-white border border-[#E0D9CE] rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow cursor-pointer flex flex-col"
        >
            {/* Top row: Title + Status Badge + 3-dot Menu (y: 17px) */}
            <div className="absolute left-4.25 top-4.25 w-176.5 h-6 flex items-center justify-between">
                {/* Title */}
                <h3 className="text-[15px] font-semibold text-[#2B2B2F] grow truncate mr-4">
                    {lesson.title}
                </h3>

                {/* Status Badge + Menu */}
                <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={lesson.status} />
                    <button
                        onClick={(event) => { event.stopPropagation(); onMenuClick(); }}
                        className="w-5 h-5 flex items-center justify-center text-[#2B2B2F] opacity-40 hover:opacity-60 transition-opacity cursor-pointer"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <circle cx="8" cy="3" r="1.2" />
                            <circle cx="8" cy="8" r="1.2" />
                            <circle cx="8" cy="13" r="1.2" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Bottom row: Subject Pill + Level Pill + Duration + Last Updated (y: 49px) */}
            <div className="absolute left-4.25 top-12.25 w-176.5 h-6 flex items-center gap-2">
                {/* Subject Pill */}
                <Pill label={lesson.subject} />

                {/* Level Pill */}
                <Pill label={lesson.level} />

                {/* Duration (Clock icon + text with 45% opacity) */}
                <div className="flex items-center gap-1 text-[12px] text-[#2B2B2F] opacity-45">
                    <ClockIcon />
                    <span>{lesson.duration} min</span>
                </div>

                {/* Last Updated (right-aligned with 40% opacity) */}
                <div className="grow" />
                <span className="text-[12px] text-[#2B2B2F] opacity-40 whitespace-nowrap">
                    {lesson.lastUpdated}
                </span>
            </div>

            {/* Optional Signal row (y: 77px) */}
            {lesson.signal && (
                <div className="absolute left-4.25 top-19.25 w-176.5 h-4 flex items-center gap-2">
                    <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                            lesson.signal.type === 'warning' ? 'bg-[#C47D0E]' : 'bg-[#7AB87A]'
                        }`}
                    />
                    <span
                        className={`text-[12px] font-normal ${
                            lesson.signal.type === 'warning' ? 'text-[#C47D0E]' : 'text-[#7AB87A]'
                        }`}
                    >
                        {lesson.signal.text}
                    </span>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: LessonStatus }) {
    const styles = status === 'Published'
        ? 'bg-[rgba(122,184,122,0.25)] text-[#7AB87A]'
        : 'bg-[rgba(154,156,203,0.2)] text-[#3B3F6E]';

    return (
        <span className={`w-[71.55px] h-6 flex items-center justify-center rounded-lg text-[12px] font-semibold ${styles}`}>
            {status}
        </span>
    );
}

function Pill({ label }: { label: string }) {
    return (
        <span className="px-2 h-6 flex items-center bg-[rgba(154,156,203,0.15)] text-[#3B3F6E] text-[12px] font-normal rounded-lg whitespace-nowrap">
            {label}
        </span>
    );
}

function FilterSheet({
    subjects,
    levels,
    selectedSubjects,
    selectedLevels,
    onToggleSubject,
    onToggleLevel,
    onApply,
    onClear,
    onClose,
}: {
    subjects: string[];
    levels: string[];
    selectedSubjects: string[];
    selectedLevels: string[];
    onToggleSubject: (s: string) => void;
    onToggleLevel: (l: string) => void;
    onApply: () => void;
    onClear: () => void;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="relative w-full max-w-175 bg-[#F7F1E6] rounded-t-3xl px-8 pt-4 pb-8 animate-slide-up">
                {/* Drag handle */}
                <div className="flex justify-center mb-5">
                    <div className="w-10 h-1 rounded-full bg-graphite-40/40" />
                </div>

                <h3 className="text-17px font-semibold text-[#3B3F6E] mb-6">Filter lessons</h3>

                {/* Subject */}
                <div className="mb-6">
                    <p className="text-[11px] font-bold text-[#3B3F6E] tracking-wider uppercase mb-3">Subject</p>
                    <div className="flex flex-wrap gap-2">
                        {subjects.map((s) => (
                            <button
                                key={s}
                                onClick={() => onToggleSubject(s)}
                                className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-all cursor-pointer ${
                                    selectedSubjects.includes(s)
                                        ? 'bg-[#3B3F6E] text-white border-[#3B3F6E]'
                                        : 'bg-white border-[#D4D0CA] text-[#4A4A4A] hover:border-[#3B3F6E]'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Level */}
                <div className="mb-8">
                    <p className="text-[11px] font-bold text-[#3B3F6E] tracking-wider uppercase mb-3">Level</p>
                    <div className="flex flex-wrap gap-2">
                        {levels.map((l) => (
                            <button
                                key={l}
                                onClick={() => onToggleLevel(l)}
                                className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-all cursor-pointer ${
                                    selectedLevels.includes(l)
                                        ? 'bg-[#3B3F6E] text-white border-[#3B3F6E]'
                                        : 'bg-white border-[#D4D0CA] text-[#4A4A4A] hover:border-[#3B3F6E]'
                                }`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <button
                    onClick={onApply}
                    className="w-full bg-[#3B3F6E] text-white py-4 rounded-2xl font-semibold text-[14px] hover:bg-[#2E3259] transition-colors cursor-pointer mb-3"
                >
                    Apply filters
                </button>
                <button
                    onClick={() => { onClear(); onClose(); }}
                    className="w-full text-graphite-60 text-[13px] font-medium py-2 hover:text-graphite transition-colors cursor-pointer"
                >
                    Clear all
                </button>
            </div>
        </div>
    );
}

function LessonActionSheet({
    lesson,
    onView,
    onEdit,
    onDuplicate,
    onArchive,
    onClose,
}: {
    lesson: Lesson;
    onView: () => void;
    onEdit: () => void;
    onDuplicate: () => void;
    onArchive: () => void;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-60 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative w-full max-w-175 bg-[#F7F1E6] rounded-t-3xl px-8 pt-4 pb-8">
                <div className="flex justify-center mb-5">
                    <div className="w-10 h-1 rounded-full bg-graphite-40/40" />
                </div>
                <h3 className="text-17px font-semibold text-[#3B3F6E] mb-2">Lesson actions</h3>
                <p className="text-[13px] text-graphite-60 mb-6">{lesson.title}</p>
                <div className="grid gap-3">
                    <button onClick={onView} className="w-full h-12 rounded-2xl bg-[#3B3F6E] text-white font-semibold text-[14px]">View</button>
                    <button onClick={onEdit} className="w-full h-12 rounded-2xl border border-[#3B3F6E] text-[#3B3F6E] font-semibold text-[14px]">Edit</button>
                    <button onClick={onDuplicate} className="w-full h-12 rounded-2xl border border-[#E0D9CE] bg-white text-[#2B2B2F] font-semibold text-[14px]">Duplicate</button>
                    <button onClick={onArchive} className="w-full h-12 rounded-2xl border border-[#E0D9CE] bg-white text-[#2B2B2F] font-semibold text-[14px]">Archive</button>
                </div>
            </div>
        </div>
    );
}

/* ─── Inline SVG Icons ─── */

function SearchIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#9B9B9B" strokeWidth="1.5">
            <circle cx="7.5" cy="7.5" r="5.5" />
            <line x1="11.5" y1="11.5" x2="16" y2="16" strokeLinecap="round" />
        </svg>
    );
}

function FilterIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#3B3F6E" strokeWidth="1.5">
            <line x1="2" y1="4" x2="14" y2="4" strokeLinecap="round" />
            <line x1="4" y1="8" x2="12" y2="8" strokeLinecap="round" />
            <line x1="6" y1="12" x2="10" y2="12" strokeLinecap="round" />
        </svg>
    );
}

function UploadIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5">
            <path d="M8 12V3" strokeLinecap="round" />
            <path d="M4.5 6L8 2.5L11.5 6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 13.5H13" strokeLinecap="round" />
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#9B9B9B" strokeWidth="1.3">
            <circle cx="7" cy="7" r="5.5" />
            <polyline points="7,4.5 7,7 9,8.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
