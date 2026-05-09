'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AddLessonWizard } from './AddLessonWizard';
import { AssignLessonWizard } from './AssignLessonWizard';
import { LessonDetailsView } from './LessonDetailsView';
import { useAuthGuard } from '@/shared/lib';

type LessonStatus = 'Published' | 'Draft' | 'Archived';

export interface TeacherLessonListItem {
  id: string;
  title: string;
  subject: string;
  topic: string;
  level: string;
  targetGradeLevel: number;
  duration: number;
  status: LessonStatus;
  assignmentCount: number;
  completionCount: number;
  confusionSignalCount: number;
  lastUpdatedLabel: string;
}

type TabFilter = 'All' | 'Published' | 'Drafts' | 'Archived';

function buildErrorMessage(data: any, fallback: string) {
  if (typeof data?.detail === 'string') return data.detail;
  if (typeof data?.message === 'string') return data.message;
  if (typeof data?.error === 'string') return data.error;
  return fallback;
}

function formatUpdatedDate(value?: string | null) {
  if (!value) return 'Update date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Update date unavailable';
  return `Updated ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function normalizeStatus(raw: string): LessonStatus {
  const value = raw.toLowerCase();
  if (value === 'draft') return 'Draft';
  if (value === 'archived') return 'Archived';
  return 'Published';
}

function mapLesson(lesson: any): TeacherLessonListItem {
  return {
    id: String(lesson.id),
    title: lesson.title || 'Untitled lesson',
    subject: lesson.subject || 'Not set',
    topic: lesson.topic || '',
    level: lesson.education_level || 'Not set',
    targetGradeLevel: Number(lesson.target_grade_level || 0),
    duration: Number(lesson.estimated_duration_minutes || 0),
    status: normalizeStatus(String(lesson.status || 'published')),
    assignmentCount: Number(lesson.assignment_count || 0),
    completionCount: Number(lesson.completion_count || 0),
    confusionSignalCount: Number(lesson.confusion_signal_count || 0),
    lastUpdatedLabel: formatUpdatedDate(lesson.last_updated || lesson.created_at),
  };
}

export function LessonsView() {
  const guardAuth = useAuthGuard('teacher');
  const [lessons, setLessons] = useState<TeacherLessonListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [assignLessonId, setAssignLessonId] = useState<string | null>(null);
  const [viewingLessonId, setViewingLessonId] = useState<string | null>(null);

  const refreshLessons = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: '1',
        page_size: '100',
        sort_by: 'created_at',
        sort_order: 'desc',
      });
      const res = await fetch(`/api/teacher/lessons?${params.toString()}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const result = {
          error: buildErrorMessage(data, 'Could not load lessons.'),
          authExpired: res.status === 401 || res.status === 403,
        };
        if (guardAuth(result as any)) return;
        setLessons([]);
        setError(result.error);
        setLoading(false);
        return;
      }

      const nextLessons = Array.isArray(data?.lessons) ? data.lessons.map(mapLesson) : [];
      setLessons(nextLessons);
      setError(null);
      setLoading(false);
    } catch (caughtError) {
      setLessons([]);
      setError(caughtError instanceof Error ? caughtError.message : 'Could not load lessons.');
      setLoading(false);
    }
  }, [guardAuth]);

  useEffect(() => {
    void refreshLessons();
  }, [refreshLessons]);

  const counts = useMemo(
    () => ({
      all: lessons.length,
      published: lessons.filter((lesson) => lesson.status === 'Published').length,
      drafts: lessons.filter((lesson) => lesson.status === 'Draft').length,
      archived: lessons.filter((lesson) => lesson.status === 'Archived').length,
    }),
    [lessons],
  );

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      if (activeTab === 'Published' && lesson.status !== 'Published') return false;
      if (activeTab === 'Drafts' && lesson.status !== 'Draft') return false;
      if (activeTab === 'Archived' && lesson.status !== 'Archived') return false;
      if (!searchQuery) return true;

      const haystack = `${lesson.title} ${lesson.subject} ${lesson.topic} ${lesson.level}`.toLowerCase();
      return haystack.includes(searchQuery.toLowerCase());
    });
  }, [activeTab, lessons, searchQuery]);

  if (showWizard) {
    return (
      <AddLessonWizard
        onClose={() => setShowWizard(false)}
        onCreated={() => {
          void refreshLessons();
        }}
        onViewLesson={(lessonId) => {
          setShowWizard(false);
          void refreshLessons();
          setViewingLessonId(lessonId);
        }}
        onAssign={(lessonId) => {
          setShowWizard(false);
          void refreshLessons();
          setAssignLessonId(lessonId);
        }}
      />
    );
  }

  if (assignLessonId) {
    return (
      <AssignLessonWizard
        initialLessonId={assignLessonId}
        onClose={() => setAssignLessonId(null)}
      />
    );
  }

  if (viewingLessonId) {
    return (
      <LessonDetailsView
        lessonId={viewingLessonId}
        onBack={() => setViewingLessonId(null)}
        onAssign={(lessonId) => setAssignLessonId(lessonId)}
        onChanged={() => void refreshLessons()}
      />
    );
  }

  const tabs: { label: string; value: TabFilter; count: number }[] = [
    { label: 'All', value: 'All', count: counts.all },
    { label: 'Published', value: 'Published', count: counts.published },
    { label: 'Drafts', value: 'Drafts', count: counts.drafts },
    { label: 'Archived', value: 'Archived', count: counts.archived },
  ];

  return (
    <div className="flex w-full max-w-[900px] flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold leading-tight text-[#3B3F6E]">Lessons</h2>
        <button
          type="button"
          onClick={() => setShowWizard(true)}
          className="flex cursor-pointer items-center gap-2 rounded-full bg-[#3B3F6E] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#2E3259]"
        >
          <UploadIcon />
          Upload lesson
        </button>
      </div>

      <div className="relative mb-5">
        <span className="absolute left-4 top-1/2 -translate-y-1/2">
          <SearchIcon />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search lessons"
          className="w-full rounded-xl border border-[#E0DDD8] bg-white py-2.5 pl-11 pr-4 text-[13.5px] font-medium text-[#111111] outline-none transition-colors placeholder-graphite-40 focus:border-[#3B3F6E]"
        />
      </div>

      <div className="mb-5 flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
              activeTab === tab.value
                ? 'bg-[#3B3F6E] text-white'
                : 'bg-transparent text-graphite-60 hover:bg-graphite-5'
            }`}
          >
            {tab.label}
            <span
              className={`min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold ${
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

      {loading ? (
        <LessonLibraryLoadingState />
      ) : error ? (
        <LessonLibraryErrorState error={error} />
      ) : filteredLessons.length === 0 ? (
        <LessonLibraryEmptyState
          title={searchQuery ? 'No lessons match this search.' : 'No lessons yet.'}
          body={searchQuery ? 'Try a different lesson title, subject, or topic.' : 'Upload your first lesson to start building your library.'}
          actionLabel={searchQuery ? 'Clear search' : 'Upload lesson'}
          onAction={() => {
            if (searchQuery) setSearchQuery('');
            else setShowWizard(true);
          }}
        />
      ) : (
        <div className="flex flex-col gap-3 pb-12">
          {filteredLessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              onClick={() => setViewingLessonId(lesson.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LessonRow({
  lesson,
  onClick,
}: {
  lesson: TeacherLessonListItem;
  onClick: () => void;
}) {
  const signal =
    lesson.confusionSignalCount > 0
      ? { type: 'warning' as const, text: `${lesson.confusionSignalCount} confusion signal${lesson.confusionSignalCount === 1 ? '' : 's'}` }
      : lesson.completionCount > 0
        ? { type: 'success' as const, text: `${lesson.completionCount} completed` }
        : lesson.assignmentCount > 0
          ? { type: 'neutral' as const, text: `${lesson.assignmentCount} assigned` }
          : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-2xl border border-[#E9E7E2] bg-white px-6 py-5 text-left transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
    >
      <div className="mb-2.5 flex items-start justify-between">
        <h3 className="text-[15px] font-semibold leading-snug text-[#2B2B2F]">{lesson.title}</h3>
        <div className="ml-4 flex shrink-0 items-center gap-2">
          <StatusBadge status={lesson.status} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag label={lesson.subject} />
          <Tag label={lesson.level} />
          <span className="ml-1 flex items-center gap-1 text-[12px] text-graphite-40">
            <ClockIcon />
            {lesson.duration} min
          </span>
        </div>
        <span className="text-[12px] text-graphite-40">{lesson.lastUpdatedLabel}</span>
      </div>

      {signal ? (
        <div
          className={`mt-2.5 flex items-center gap-1.5 text-[12.5px] font-medium ${
            signal.type === 'warning'
              ? 'text-[#D97706]'
              : signal.type === 'success'
                ? 'text-[#16A34A]'
                : 'text-[#6E74AA]'
          }`}
        >
          <span
            className={`inline-block h-[7px] w-[7px] rounded-full ${
              signal.type === 'warning'
                ? 'bg-[#D97706]'
                : signal.type === 'success'
                  ? 'bg-[#16A34A]'
                  : 'bg-[#6E74AA]'
            }`}
          />
          {signal.text}
        </div>
      ) : null}
    </button>
  );
}

function LessonLibraryLoadingState() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-[#E9E7E2] bg-white px-6 py-5">
          <div className="mb-3 h-4 w-[220px] rounded bg-[#ECE6DA]" />
          <div className="mb-3 flex gap-2">
            <div className="h-6 w-[88px] rounded bg-[#ECE6DA]" />
            <div className="h-6 w-[74px] rounded bg-[#ECE6DA]" />
          </div>
          <div className="h-3 w-[180px] rounded bg-[#ECE6DA]" />
        </div>
      ))}
    </div>
  );
}

function LessonLibraryErrorState({ error }: { error: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-[#E9E7E2] bg-[#FAF6EE] px-8 py-14 text-center">
      <div className="mb-5 flex h-[88px] w-[88px] items-center justify-center rounded-[24px] bg-[#9A9CCB]/15">
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M26 16V27" />
          <path d="M26 35H26.02" />
          <path d="M26 7L46 44H6L26 7Z" />
        </svg>
      </div>
      <p className="mb-2 text-[16px] font-semibold text-[#3B3F6E]">Couldn&apos;t load lessons.</p>
      <p className="max-w-[480px] text-[14px] leading-5 text-[#1A1A1A]/60">{error}</p>
    </div>
  );
}

function LessonLibraryEmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-[#E9E7E2] bg-[#FAF6EE] px-8 py-14 text-center">
      <div className="mb-5 flex h-[160px] w-[200px] items-center justify-center rounded-[16px] bg-[#9A9CCB]/15">
        <svg width="160" height="120" viewBox="0 0 160 120" fill="none">
          <rect x="26" y="16" width="108" height="80" rx="14" stroke="#3B3F6E" strokeWidth="2" />
          <path d="M49 39H111" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round" />
          <path d="M49 58H96" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round" />
          <path d="M49 77H89" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round" />
          <path d="M113 70L126 83" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round" />
          <path d="M126 70L113 83" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <p className="mb-2 text-[16px] font-semibold text-[#3B3F6E]">{title}</p>
      <p className="mb-6 max-w-[420px] text-[14px] leading-5 text-[#1A1A1A]/60">{body}</p>
      <button
        type="button"
        onClick={onAction}
        className="cursor-pointer rounded-xl border border-[#3B3F6E] px-6 py-3 text-[14px] font-semibold text-[#3B3F6E] transition-colors hover:bg-indigo-5"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: LessonStatus }) {
  const styles =
    status === 'Published'
      ? 'bg-[#E8F5E9] text-[#2E7D32]'
      : status === 'Archived'
        ? 'bg-[#F5E6CA] text-[#A67C00]'
        : 'bg-[#F0F0F0] text-[#6B6B70]';

  return <span className={`rounded-md px-2.5 py-1 text-[11.5px] font-semibold ${styles}`}>{status}</span>;
}

function Tag({ label }: { label: string }) {
  return <span className="rounded-md bg-[#F0EDE8] px-2.5 py-1 text-[11.5px] font-medium text-[#4A4A4A]">{label}</span>;
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#9B9B9B" strokeWidth="1.5">
      <circle cx="7.5" cy="7.5" r="5.5" />
      <line x1="11.5" y1="11.5" x2="16" y2="16" strokeLinecap="round" />
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
