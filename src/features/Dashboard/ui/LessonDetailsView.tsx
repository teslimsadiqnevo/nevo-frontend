'use client';

import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthGuard } from '@/shared/lib';
import { DetailViewSkeleton } from './DashboardSkeletons';

interface LessonDetailResponse {
  id: string;
  title: string;
  description?: string | null;
  subject?: string | null;
  topic?: string | null;
  target_grade_level: number;
  estimated_duration_minutes: number;
  status: string;
  media_url?: string | null;
  teacher_id: string;
  teacher_name?: string | null;
  created_at?: string | null;
}

interface LessonReviewResponse {
  lesson_id: string;
  objectives: string[];
  key_concepts: string[];
  processed_at?: string | null;
}

interface LessonAssignmentRow {
  assignment_id: string;
  student_name: string;
  class_name?: string | null;
  status: string;
  assigned_at: string;
  completed_at?: string | null;
}

function buildErrorMessage(data: any, fallback: string) {
  if (typeof data?.detail === 'string') return data.detail;
  if (typeof data?.message === 'string') return data.message;
  if (typeof data?.error === 'string') return data.error;
  return fallback;
}

function normalizeStatus(status: string) {
  const lowered = status.toLowerCase();
  if (lowered === 'draft') return 'Draft';
  if (lowered === 'archived') return 'Archived';
  return 'Published';
}

function formatDate(value?: string | null) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function gradeLabel(grade: number) {
  if (grade <= 6) return `Primary ${grade}`;
  if (grade <= 12) return `Secondary ${grade - 6}`;
  return `Grade ${grade}`;
}

async function fetchLessonPayload(lessonId: string) {
  const [detailRes, reviewRes, assignmentsRes] = await Promise.all([
    fetch(`/api/teacher/lessons/${lessonId}`),
    fetch(`/api/teacher/lessons/${lessonId}/ai-review`, { method: 'POST' }),
    fetch(`/api/teacher/lessons/${lessonId}/assignments`),
  ]);

  const [detailData, reviewData, assignmentsData] = await Promise.all([
    detailRes.json().catch(() => ({})),
    reviewRes.json().catch(() => ({})),
    assignmentsRes.json().catch(() => ({})),
  ]);

  if (!detailRes.ok) {
    return {
      error: buildErrorMessage(detailData, 'Could not load lesson details.'),
      authExpired: detailRes.status === 401 || detailRes.status === 403,
    };
  }

  if (!reviewRes.ok) {
    return {
      error: buildErrorMessage(reviewData, 'Could not load lesson review.'),
      authExpired: reviewRes.status === 401 || reviewRes.status === 403,
    };
  }

  if (!assignmentsRes.ok) {
    return {
      error: buildErrorMessage(assignmentsData, 'Could not load lesson assignments.'),
      authExpired: assignmentsRes.status === 401 || assignmentsRes.status === 403,
    };
  }

  return {
    data: {
      detail: detailData as LessonDetailResponse,
      review: reviewData as LessonReviewResponse,
      assignments: Array.isArray(assignmentsData?.assignments) ? assignmentsData.assignments as LessonAssignmentRow[] : [],
    },
  };
}

export function LessonDetailsView({
  lessonId,
  onBack,
  onAssign,
  onChanged,
}: {
  lessonId: string;
  onBack: () => void;
  onAssign: (lessonId: string) => void;
  onChanged?: () => void;
}) {
  const guardAuth = useAuthGuard('teacher');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lesson, setLesson] = useState<LessonDetailResponse | null>(null);
  const [review, setReview] = useState<LessonReviewResponse | null>(null);
  const [assignments, setAssignments] = useState<LessonAssignmentRow[]>([]);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [actionError, setActionError] = useState<string | null>(null);
  const [workingAction, setWorkingAction] = useState<'duplicate' | 'archive' | 'delete' | null>(null);

  const loadLesson = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await fetchLessonPayload(lessonId);
    if (guardAuth(result as any)) return;
    if ('error' in result) {
      setError(result.error);
      setLesson(null);
      setReview(null);
      setAssignments([]);
      setLoading(false);
      return;
    }

    setLesson(result.data.detail);
    setReview(result.data.review);
    setAssignments(result.data.assignments);
    setError(null);
    setLoading(false);
  }, [guardAuth, lessonId]);

  useEffect(() => {
    void loadLesson();
  }, [loadLesson]);

  const summary = useMemo(() => {
    if (!lesson) return null;
    return {
      status: normalizeStatus(lesson.status),
      subject: lesson.subject || 'Not set',
      topic: lesson.topic || lesson.title,
      level: gradeLabel(Number(lesson.target_grade_level || 0)),
      duration: Number(lesson.estimated_duration_minutes || 0),
    };
  }, [lesson]);

  const executeAction = async (action: 'duplicate' | 'archive' | 'delete') => {
    if (!lesson) return;
    setActionError(null);
    setWorkingAction(action);

    const config =
      action === 'duplicate'
        ? { url: `/api/teacher/lessons/${lesson.id}/duplicate`, method: 'POST' }
        : action === 'archive'
          ? { url: `/api/teacher/lessons/${lesson.id}/archive`, method: 'PUT' }
          : { url: `/api/teacher/lessons/${lesson.id}`, method: 'DELETE' };

    const res = await fetch(config.url, { method: config.method });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const result = {
        error: buildErrorMessage(data, `Could not ${action} lesson.`),
        authExpired: res.status === 401 || res.status === 403,
      };
      if (guardAuth(result as any)) {
        setWorkingAction(null);
        return;
      }
      setActionError(result.error);
      setWorkingAction(null);
      return;
    }

    onChanged?.();
    setWorkingAction(null);

    if (action === 'delete') {
      onBack();
      return;
    }

    await loadLesson();
  };

  if (loading) return <DetailViewSkeleton backLabel="Lessons" />;

  if (error || !lesson || !review || !summary) {
    return (
      <div className="flex min-h-[calc(100vh-100px)] w-full max-w-[900px] flex-col items-center justify-center rounded-3xl border border-[#E9E7E2] bg-[#FDFBF9] px-8 text-center">
        <p className="mb-2 text-[16px] font-semibold text-[#3B3F6E]">Couldn&apos;t load this lesson.</p>
        <p className="mb-6 max-w-[440px] text-[14px] leading-5 text-[#1A1A1A]/60">{error || 'Please try again.'}</p>
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer rounded-xl border border-[#3B3F6E] px-6 py-3 text-[14px] font-semibold text-[#3B3F6E]"
        >
          Back to lessons
        </button>
      </div>
    );
  }

  if (mode === 'edit') {
    return (
      <LessonEditView
        lesson={lesson}
        review={review}
        onCancel={() => setMode('view')}
        onSaved={async () => {
          setMode('view');
          onChanged?.();
          await loadLesson();
        }}
      />
    );
  }

  return (
    <div className="relative flex min-h-[calc(100vh-100px)] w-full max-w-[900px] flex-col overflow-hidden rounded-3xl border border-[#E9E7E2] bg-[#FDFBF9] shadow-sm">
      <div className="flex items-center px-8 pb-4 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-[14px] font-medium text-[#3B3F6E] transition-colors hover:text-[#2B2B2F]"
        >
          <BackArrow />
          Lessons
        </button>
      </div>

      <div className="flex items-center justify-between bg-[#3B3F6E] px-8 py-6 text-white">
        <div className="pr-6">
          <h1 className="text-xl font-semibold leading-tight">{lesson.title}</h1>
          <p className="mt-2 text-[13px] text-white/75">
            {summary.topic} · Created {formatDate(lesson.created_at)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest">{summary.subject}</span>
          <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${
            summary.status === 'Published'
              ? 'bg-[#81C784] text-[#1B5E20]'
              : summary.status === 'Archived'
                ? 'bg-[#F5E6CA] text-[#A67C00]'
                : 'bg-[#C5C0DF] text-[#3B3F6E]'
          }`}>
            {summary.status}
          </span>
        </div>
      </div>

      <div className="flex-1 px-8 pb-28 pt-6">
        <div className="mb-8 flex items-center gap-3">
          <Pill>{summary.level}</Pill>
          <Pill>{summary.duration} min</Pill>
          <Pill>{assignments.length} assignment{assignments.length === 1 ? '' : 's'}</Pill>
        </div>

        <Section title="Description">
          <p className="text-[14px] leading-6 text-[#2B2B2F]">
            {lesson.description || 'No description added yet.'}
          </p>
        </Section>

        <Section title="Objectives">
          {review.objectives.length > 0 ? (
            <ul className="space-y-3">
              {review.objectives.map((objective) => (
                <li key={objective} className="flex gap-2.5 text-[14px] text-[#2B2B2F]">
                  <span className="mt-[3px] text-lg leading-4 text-[#3B3F6E]">•</span>
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-graphite-40">No objectives saved yet.</p>
          )}
        </Section>

        <Section title="Key concepts">
          {review.key_concepts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {review.key_concepts.map((concept) => (
                <span key={concept} className="rounded-md bg-[#E8E6F5] px-3 py-1 text-[12px] font-medium text-[#3B3F6E]">
                  {concept}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[14px] text-graphite-40">No key concepts saved yet.</p>
          )}
        </Section>

        <Section title={`Assignments${assignments.length ? ` (${assignments.length})` : ''}`}>
          {assignments.length === 0 ? (
            <p className="text-[14px] text-graphite-40">This lesson has not been assigned yet.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {assignments.map((assignment) => (
                <div key={assignment.assignment_id} className="flex items-center justify-between border-b border-[#E9E7E2] py-4 last:border-none">
                  <div>
                    <p className="mb-1 text-[14px] font-bold text-[#2B2B2F]">{assignment.student_name}</p>
                    <p className="text-[12.5px] text-graphite-60">
                      {assignment.class_name || 'Class not specified'} · {formatAssignmentStatus(assignment.status)} · Assigned {formatDate(assignment.assigned_at)}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusChipClass(assignment.status)}`}>
                    {formatAssignmentStatus(assignment.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {actionError ? (
          <div className="rounded-xl border border-[#F1C5BF] bg-[#FFF6F4] px-4 py-3 text-[13px] text-[#B54708]">
            {actionError}
          </div>
        ) : null}
      </div>

      <div className="absolute bottom-0 left-0 flex w-full justify-between border-t border-[#E9E7E2] bg-[#FDFBF9] px-8 py-4">
        <ActionIconButton label="Assign" onClick={() => onAssign(lesson.id)}>
          <AssignIcon />
        </ActionIconButton>
        <ActionIconButton label="Edit" onClick={() => setMode('edit')}>
          <EditIcon />
        </ActionIconButton>
        <ActionIconButton label={workingAction === 'duplicate' ? 'Duplicating...' : 'Duplicate'} onClick={() => void executeAction('duplicate')}>
          <DuplicateIcon />
        </ActionIconButton>
        <ActionIconButton label={workingAction === 'archive' ? 'Archiving...' : 'Archive'} onClick={() => void executeAction('archive')}>
          <ArchiveIcon />
        </ActionIconButton>
        <ActionIconButton
          label={workingAction === 'delete' ? 'Deleting...' : 'Delete'}
          onClick={() => void executeAction('delete')}
          danger
        >
          <DeleteIcon />
        </ActionIconButton>
      </div>
    </div>
  );
}

function LessonEditView({
  lesson,
  review,
  onCancel,
  onSaved,
}: {
  lesson: LessonDetailResponse;
  review: LessonReviewResponse;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const guardAuth = useAuthGuard('teacher');
  const [title, setTitle] = useState(lesson.title);
  const [description, setDescription] = useState(lesson.description || '');
  const [subject, setSubject] = useState(lesson.subject || '');
  const [topic, setTopic] = useState(lesson.topic || '');
  const [duration, setDuration] = useState(String(lesson.estimated_duration_minutes || 20));
  const [objectives, setObjectives] = useState(review.objectives.join('\n'));
  const [keyConcepts, setKeyConcepts] = useState(review.key_concepts.join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const detailRes = await fetch(`/api/teacher/lessons/${lesson.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        subject: subject.trim(),
        topic: topic.trim(),
        target_grade_level: lesson.target_grade_level,
        estimated_duration_minutes: Number(duration) || lesson.estimated_duration_minutes,
      }),
    });
    const detailData = await detailRes.json().catch(() => ({}));

    if (!detailRes.ok) {
      const result = {
        error: buildErrorMessage(detailData, 'Could not update lesson.'),
        authExpired: detailRes.status === 401 || detailRes.status === 403,
      };
      if (guardAuth(result as any)) {
        setSaving(false);
        return;
      }
      setError(result.error);
      setSaving(false);
      return;
    }

    const objectivesRes = await fetch(`/api/teacher/lessons/${lesson.id}/objectives`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        objectives: objectives.split('\n').map((item) => item.trim()).filter(Boolean),
        key_concepts: keyConcepts.split(',').map((item) => item.trim()).filter(Boolean),
      }),
    });
    const objectivesData = await objectivesRes.json().catch(() => ({}));

    if (!objectivesRes.ok) {
      const result = {
        error: buildErrorMessage(objectivesData, 'Could not update lesson review.'),
        authExpired: objectivesRes.status === 401 || objectivesRes.status === 403,
      };
      if (guardAuth(result as any)) {
        setSaving(false);
        return;
      }
      setError(result.error);
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved();
  };

  return (
    <div className="relative flex min-h-[calc(100vh-100px)] w-full max-w-[900px] flex-col overflow-hidden rounded-3xl border border-[#E9E7E2] bg-[#FDFBF9] shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E9E7E2] px-8 pb-6 pt-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-lg p-1 text-[#3B3F6E] transition-colors hover:bg-black/5"
          >
            <BackArrow />
          </button>
          <span className="text-lg font-semibold text-[#3B3F6E]">Edit lesson</span>
        </div>
      </div>

      <div className="flex-1 space-y-6 px-8 pb-28 pt-8">
        <EditField label="Title">
          <input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClassName} />
        </EditField>

        <EditField label="Description">
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} className={`${inputClassName} min-h-[100px] resize-none py-4`} />
        </EditField>

        <div className="grid grid-cols-2 gap-4">
          <EditField label="Subject">
            <input value={subject} onChange={(event) => setSubject(event.target.value)} className={inputClassName} />
          </EditField>
          <EditField label="Topic">
            <input value={topic} onChange={(event) => setTopic(event.target.value)} className={inputClassName} />
          </EditField>
        </div>

        <EditField label="Estimated duration (minutes)">
          <input value={duration} onChange={(event) => setDuration(event.target.value)} className={inputClassName} type="number" min="1" />
        </EditField>

        <EditField label="Learning objectives">
          <textarea value={objectives} onChange={(event) => setObjectives(event.target.value)} className={`${inputClassName} min-h-[130px] resize-none py-4`} />
        </EditField>

        <EditField label="Key concepts">
          <input
            value={keyConcepts}
            onChange={(event) => setKeyConcepts(event.target.value)}
            className={inputClassName}
            placeholder="Separate concepts with commas"
          />
        </EditField>

        {error ? (
          <div className="rounded-xl border border-[#F1C5BF] bg-[#FFF6F4] px-4 py-3 text-[13px] text-[#B54708]">
            {error}
          </div>
        ) : null}
      </div>

      <div className="absolute bottom-0 left-0 flex w-full justify-between gap-4 border-t border-[#E9E7E2] bg-[#FDFBF9] px-8 py-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 cursor-pointer rounded-xl border border-[#3B3F6E] bg-transparent py-3.5 text-[14px] font-semibold text-[#3B3F6E] transition-colors hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="flex-1 cursor-pointer rounded-xl bg-[#3B3F6E] py-3.5 text-[14px] font-semibold text-white transition-all hover:bg-[#2E3259] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="mb-4 text-[12.5px] font-bold uppercase tracking-wider text-[#6E74AA]">{title}</h3>
      {children}
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-[#E8E6F5] px-3 py-1.5 text-[13px] font-medium text-[#3B3F6E]">{children}</span>;
}

function EditField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-[12px] font-semibold uppercase tracking-wider text-[#6E74AA]">{label}</label>
      {children}
    </div>
  );
}

function ActionIconButton({
  children,
  label,
  onClick,
  danger = false,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col items-center gap-1.5 transition-colors ${
        danger ? 'text-[#6E74AA] hover:text-[#DF3848]' : 'text-[#6E74AA] hover:text-[#3B3F6E]'
      }`}
    >
      {children}
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

function formatAssignmentStatus(status: string) {
  const lowered = status.toLowerCase();
  if (lowered === 'completed') return 'Completed';
  if (lowered === 'in_progress') return 'In progress';
  return 'Assigned';
}

function statusChipClass(status: string) {
  const lowered = status.toLowerCase();
  if (lowered === 'completed') return 'bg-[#E8F5E9] text-[#2E7D32]';
  if (lowered === 'in_progress') return 'bg-[#E8E6F5] text-[#3B3F6E]';
  return 'bg-[#F5E6CA] text-[#A67C00]';
}

const inputClassName =
  'w-full rounded-xl border border-[#E0DDD8] bg-white px-4 py-3.5 text-[14.5px] text-[#2B2B2F] outline-none transition-colors focus:border-[#3B3F6E]';

function BackArrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 4L6 10L12 16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AssignIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function DuplicateIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
