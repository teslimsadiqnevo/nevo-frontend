'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardPath, useAuthGuard } from '@/shared/lib';
import {
  getTeacherStudentProfile,
  getTeacherStudentProgress,
  getTeacherStudentSessions,
  getTeacherStudents,
} from '../api/teacher';

type TeacherStudentRow = {
  id: string;
  nevoId?: string | null;
  name: string;
  initials: string;
  className: string;
  subject: string;
  lastActiveLabel: string;
  signal: 'green' | 'amber' | 'violet';
};

export function TeacherStudentsView() {
  const router = useRouter();
  const guardAuth = useAuthGuard('teacher');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All classes');
  const [showClassFilter, setShowClassFilter] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await getTeacherStudents();
      if (guardAuth(res) || !mounted) return;
      if ('error' in res && res.error) {
        setError(res.error);
        setStudents([]);
        setLoading(false);
        return;
      }
      const payload = 'data' in res ? res.data : null;
      setStudents(Array.isArray(payload) ? payload : Array.isArray(payload?.students) ? payload.students : []);
      setError(null);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [guardAuth]);

  const normalized = useMemo<TeacherStudentRow[]>(
    () =>
      students
        .map((student: any) => {
          const name = student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student';
          const id = String(student.student_uuid || student.student_id || student.uuid || student.id || '');
          if (!id) return null;
          const score = Number(student.average_score ?? student.progress_average_score ?? 0);
          return {
            id,
            nevoId: student.id || student.nevo_id || null,
            name,
            initials: getNameInitials(name),
            className: student.class_name || student.class || student.group_name || 'Unassigned class',
            subject: student.subject || '',
            lastActiveLabel: formatTeacherLastActive(student.last_activity_at || student.last_active || student.last_seen || null),
            signal: score >= 75 ? 'green' : score >= 50 ? 'amber' : 'violet',
          };
        })
        .filter(Boolean) as TeacherStudentRow[],
    [students],
  );

  const classOptions = useMemo(() => {
    const uniqueClasses = new Set<string>();
    normalized.forEach((student) => uniqueClasses.add(student.className));
    return ['All classes', ...Array.from(uniqueClasses)];
  }, [normalized]);

  const filtered = useMemo(() => {
    return normalized.filter((student) => {
      if (classFilter !== 'All classes' && student.className !== classFilter) return false;
      if (search && !`${student.name} ${student.className} ${student.subject}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [normalized, classFilter, search]);

  if (selectedStudentId) {
    return <TeacherStudentDetailView studentId={selectedStudentId} onBack={() => setSelectedStudentId(null)} />;
  }

  return (
    <div className="flex h-[900px] w-[804px] min-w-[804px] flex-col bg-[#F7F1E6]">
      <div className="flex h-[60px] items-center justify-between px-6">
        <h1 className="text-left font-sans text-[20px] font-bold leading-7 text-[#3B3F6E]">Students</h1>
        <div className="relative">
          <button
            onClick={() => setShowClassFilter((current) => !current)}
            className="flex h-[36px] min-w-[128px] items-center gap-2 rounded-[8px] border border-[#3B3F6E] bg-transparent px-[17px] text-[14px] font-medium leading-5 text-[#3B3F6E] cursor-pointer"
          >
            <span>{classFilter}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 6L8 10L12 6" />
            </svg>
          </button>
          {showClassFilter ? (
            <div className="absolute right-0 top-full z-20 mt-2 min-w-[176px] overflow-hidden rounded-[12px] border border-[#E0D9CE] bg-[#F7F1E6] shadow-[0_12px_32px_rgba(31,37,71,0.08)]">
              {classOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setClassFilter(option);
                    setShowClassFilter(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-[14px] text-[#3B3F6E] hover:bg-[#EFE7D9] cursor-pointer"
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="px-6 pb-4">
        <div className="relative h-[44px] w-[736px]">
          <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#3B3F6E]/40">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.25">
              <circle cx="8.25" cy="8.25" r="5.75" />
              <line x1="12.8" y1="12.8" x2="17" y2="17" strokeLinecap="round" />
            </svg>
          </span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search students"
            className="h-[44px] w-[736px] rounded-[12px] border border-[#E0D9CE] bg-[#F7F1E6] pl-11 pr-4 text-[15px] font-normal text-[#1A1A1A] outline-none placeholder:text-[#1A1A1A]/40 focus:border-[#3B3F6E]"
          />
        </div>
      </div>

      {loading ? (
        <TeacherStudentsLoadingState />
      ) : error ? (
        <TeacherStudentsErrorState error={error} />
      ) : filtered.length === 0 ? (
        <TeacherStudentsEmptyState onShareCode={() => router.push(getDashboardPath('teacher', 'connect'))} />
      ) : (
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {filtered.map((student, index) => (
            <button
              key={student.id}
              onClick={() => setSelectedStudentId(student.id)}
              className={`flex h-[72px] w-[736px] items-center gap-3 px-4 text-left transition-colors hover:bg-[#F2EADB] cursor-pointer ${index < filtered.length - 1 ? 'border-b border-[#E0D9CE]' : ''}`}
            >
              <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#3B3F6E] text-[16px] font-semibold text-[#F7F1E6]">
                {student.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold leading-[22px] text-[#1A1A1A]">{student.name}</p>
                <p className="truncate text-[13px] font-normal leading-5 text-[#1A1A1A]/50">
                  {student.className}
                  {student.subject ? ` · ${student.subject}` : ''}
                  {` · Last active: ${student.lastActiveLabel}`}
                </p>
              </div>
              <span
                className={`h-[8px] w-[8px] rounded-full ${
                  student.signal === 'green' ? 'bg-[#7AB87A]' : student.signal === 'amber' ? 'bg-[#E8A84A]' : 'bg-[#9A9CCB]'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TeacherStudentsLoadingState() {
  return (
    <div className="px-6">
      <div className="flex w-[736px] flex-col">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={`flex h-[72px] items-center gap-3 px-4 ${index < 4 ? 'border-b border-[#E0D9CE]' : ''}`}
          >
            <div className="h-[40px] w-[40px] rounded-full bg-[#E8E2D4]" />
            <div className="flex flex-col gap-1">
              <div className="h-[16px] w-[180px] rounded-[4px] bg-[#E8E2D4]" />
              <div className="h-[12px] w-[240px] rounded-[4px] bg-[#E8E2D4]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeacherStudentsErrorState({ error }: { error: string }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 pb-6">
      <div className="flex w-[736px] flex-col items-center rounded-[16px] border border-[#E0D9CE] bg-[#FAF6EE] px-8 py-14 text-center">
        <div className="mb-5 flex h-[88px] w-[88px] items-center justify-center rounded-[24px] bg-[#9A9CCB]/15">
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M26 16V27" />
            <path d="M26 35H26.02" />
            <path d="M26 7L46 44H6L26 7Z" />
          </svg>
        </div>
        <p className="mb-2 text-[16px] font-semibold leading-6 text-[#3B3F6E]">Couldn&apos;t load students.</p>
        <p className="max-w-[480px] text-[14px] leading-5 text-[#1A1A1A]/60">{error}</p>
      </div>
    </div>
  );
}

function TeacherStudentsEmptyState({ onShareCode }: { onShareCode: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 pb-6">
      <div className="flex w-[736px] flex-col items-center justify-center py-12">
        <div className="mb-4 flex h-[160px] w-[200px] items-center justify-center rounded-[16px] bg-[#9A9CCB]/15">
          <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="80" cy="22" r="12" stroke="#3B3F6E" strokeWidth="2" />
            <path d="M80 34V60" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round" />
            <path d="M68 46L80 60L92 46" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="32" cy="74" r="8.5" stroke="#3B3F6E" strokeWidth="2" />
            <path d="M32 82.5V96" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round" />
            <circle cx="128" cy="74" r="8.5" stroke="#3B3F6E" strokeWidth="2" />
            <path d="M128 82.5V96" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round" />
            <circle cx="58" cy="89" r="7" stroke="#3B3F6E" strokeWidth="2" />
            <path d="M58 96V107" stroke="#3B3F6E" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="mb-6 text-[14px] font-normal leading-5 text-[#1A1A1A]/60">No students connected yet.</p>
        <button
          onClick={onShareCode}
          className="h-[48px] rounded-[12px] border border-[#3B3F6E] px-8 text-[15px] font-medium text-[#3B3F6E] cursor-pointer"
        >
          Share your school code
        </button>
      </div>
    </div>
  );
}

function TeacherStudentDetailView({ studentId, onBack }: { studentId: string; onBack: () => void }) {
  const guardAuth = useAuthGuard('teacher');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const [profileRes, progressRes, sessionsRes] = await Promise.all([
        getTeacherStudentProfile(studentId),
        getTeacherStudentProgress(studentId),
        getTeacherStudentSessions(studentId),
      ]);

      if (!mounted || guardAuth(profileRes) || guardAuth(progressRes) || guardAuth(sessionsRes)) return;

      const nextError =
        ('error' in profileRes && profileRes.error) ||
        ('error' in progressRes && progressRes.error) ||
        ('error' in sessionsRes && sessionsRes.error) ||
        null;

      if (nextError) {
        setError(nextError);
        setProfile(null);
        setProgress(null);
        setSessions([]);
        setLoading(false);
        return;
      }

      setProfile('data' in profileRes ? profileRes.data : null);
      setProgress('data' in progressRes ? progressRes.data : null);
      const sessionPayload = 'data' in sessionsRes ? sessionsRes.data : [];
      setSessions(Array.isArray(sessionPayload) ? sessionPayload : Array.isArray(sessionPayload?.sessions) ? sessionPayload.sessions : []);
      setError(null);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [guardAuth, studentId]);

  const studentName =
    profile?.name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() ||
    'Student';
  const className = profile?.class_name || profile?.class?.name || 'Unassigned class';
  const lastActive = formatTeacherLastActive(profile?.last_activity_at || profile?.last_seen_at || profile?.updated_at || null);
  const averageScoreValue = Number(progress?.average_score ?? 0);
  const supportSignal = averageScoreValue >= 75 ? 'On track' : averageScoreValue >= 50 ? 'Some signals' : 'Needs attention';

  const summaryStats = [
    { label: 'Lessons completed', value: humanizeValue(progress?.completed_lessons ?? profile?.completed_lessons ?? 0) },
    { label: 'Average score', value: progress?.average_score != null ? `${Math.round(Number(progress.average_score))}%` : 'N/A' },
    { label: 'Current streak', value: humanizeValue(progress?.current_streak_days ?? profile?.current_streak_days ?? 0) },
    { label: 'Learning preference', value: profile?.preferred_learning_style || profile?.learning_style || 'Not set' },
  ];

  if (loading) {
    return (
      <div className="flex h-[900px] w-[804px] min-w-[804px] flex-col bg-[#F7F1E6] px-6 py-6">
        <button onClick={onBack} className="mb-4 flex items-center gap-2 text-[14px] font-medium text-[#3B3F6E] cursor-pointer">
          <BackArrowIcon />
          Back to students
        </button>
        <div className="flex w-[736px] flex-col gap-4">
          <div className="h-[120px] rounded-[20px] bg-[#EFE7D9]" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[96px] rounded-[16px] bg-[#EFE7D9]" />
            ))}
          </div>
          <div className="h-[220px] rounded-[20px] bg-[#EFE7D9]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[900px] w-[804px] min-w-[804px] flex-col bg-[#F7F1E6] px-6 py-6">
        <button onClick={onBack} className="mb-4 flex items-center gap-2 text-[14px] font-medium text-[#3B3F6E] cursor-pointer">
          <BackArrowIcon />
          Back to students
        </button>
        <TeacherStudentsErrorState error={error} />
      </div>
    );
  }

  return (
    <div className="flex h-[900px] w-[804px] min-w-[804px] flex-col bg-[#F7F1E6]">
      <div className="px-6 pt-6">
        <button onClick={onBack} className="mb-5 flex items-center gap-2 text-[14px] font-medium text-[#3B3F6E] cursor-pointer">
          <BackArrowIcon />
          Back to students
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="flex w-[736px] flex-col gap-4">
          <div className="rounded-[20px] border border-[#E0D9CE] bg-[#FAF6EE] px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[#3B3F6E] text-[20px] font-semibold text-[#F7F1E6]">
                  {getNameInitials(studentName)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-[22px] font-bold leading-[30px] text-[#3B3F6E]">{studentName}</h2>
                  <p className="text-[14px] leading-5 text-[#1A1A1A]/60">
                    {className}
                    {profile?.nevo_id ? ` · ${profile.nevo_id}` : ''}
                    {` · Last active: ${lastActive}`}
                  </p>
                </div>
              </div>
              <div className="mt-1 flex items-center gap-2 rounded-full border border-[#E0D9CE] bg-[#F7F1E6] px-3 py-1.5">
                <span
                  className={`h-[8px] w-[8px] rounded-full ${
                    averageScoreValue >= 75 ? 'bg-[#7AB87A]' : averageScoreValue >= 50 ? 'bg-[#E8A84A]' : 'bg-[#9A9CCB]'
                  }`}
                />
                <span className="text-[12px] font-medium leading-4 text-[#3B3F6E]">{supportSignal}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {summaryStats.map((item) => (
              <TeacherStudentMetricCard key={item.label} label={item.label} value={item.value} />
            ))}
          </div>

          <div className="grid grid-cols-[1.15fr_0.85fr] gap-4">
            <TeacherStudentPanel title="Student profile">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <TeacherStudentDetailRow label="Class" value={className} />
                <TeacherStudentDetailRow label="Age" value={humanizeValue(profile?.age)} />
                <TeacherStudentDetailRow label="School" value={humanizeValue(profile?.school_name)} />
                <TeacherStudentDetailRow label="Guardian" value={humanizeValue(profile?.parent_name || profile?.guardian_name)} />
                <TeacherStudentDetailRow label="Strength signal" value={humanizeValue(profile?.strength_signal || profile?.strengths)} />
                <TeacherStudentDetailRow label="Support signal" value={humanizeValue(profile?.support_signal || profile?.support_needs)} />
              </div>
            </TeacherStudentPanel>

            <TeacherStudentPanel title="Learning snapshot">
              <div className="flex flex-col gap-3">
                <TeacherStudentSnapshotRow label="Preferred style" value={humanizeValue(profile?.preferred_learning_style || profile?.learning_style || 'Not set')} />
                <TeacherStudentSnapshotRow label="Subjects" value={humanizeValue(profile?.subjects)} />
                <TeacherStudentSnapshotRow label="Last session" value={lastActive} />
                <TeacherStudentSnapshotRow label="Current focus" value={humanizeValue(progress?.current_topic || profile?.current_topic || 'No active topic')} />
              </div>
            </TeacherStudentPanel>
          </div>

          <TeacherStudentPanel title="Recent lesson progress">
            {Array.isArray(progress?.recent_lessons) && progress.recent_lessons.length > 0 ? (
              <div className="flex flex-col divide-y divide-[#E0D9CE]">
                {progress.recent_lessons.slice(0, 6).map((lesson: any, index: number) => (
                  <div key={lesson.id || index} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-[15px] font-semibold leading-[22px] text-[#1A1A1A]">
                        {lesson.title || lesson.lesson_title || 'Lesson'}
                      </p>
                      <p className="text-[13px] leading-5 text-[#1A1A1A]/55">{humanizeValue(lesson.subject || lesson.topic)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-medium leading-5 text-[#3B3F6E]">
                        {lesson.score != null ? `${Math.round(Number(lesson.score))}%` : humanizeValue(lesson.status || 'In progress')}
                      </p>
                      <p className="text-[12px] leading-4 text-[#1A1A1A]/45">
                        {formatSessionDate(lesson.completed_at || lesson.updated_at || lesson.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[14px] leading-5 text-[#1A1A1A]/60">No lesson progress yet.</p>
            )}
          </TeacherStudentPanel>

          <TeacherStudentPanel title="Session history">
            {sessions.length > 0 ? (
              <div className="flex flex-col divide-y divide-[#E0D9CE]">
                {sessions.slice(0, 8).map((session: any, index: number) => (
                  <div key={session.id || index} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-[15px] font-semibold leading-[22px] text-[#1A1A1A]">
                        {session.lesson_title || session.title || 'Learning session'}
                      </p>
                      <p className="text-[13px] leading-5 text-[#1A1A1A]/55">
                        {formatSessionDate(session.started_at || session.created_at || session.completed_at)}
                      </p>
                    </div>
                    <p className="text-[13px] font-medium leading-5 text-[#3B3F6E]">
                      {session.duration_minutes != null ? `${session.duration_minutes} min` : humanizeValue(session.status || 'Completed')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[14px] leading-5 text-[#1A1A1A]/60">No sessions recorded yet.</p>
            )}
          </TeacherStudentPanel>
        </div>
      </div>
    </div>
  );
}

function TeacherStudentMetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-[#E0D9CE] bg-[#FAF6EE] px-5 py-4">
      <p className="mb-1 text-[13px] font-medium leading-5 text-[#1A1A1A]/55">{label}</p>
      <p className="text-[20px] font-bold leading-7 text-[#3B3F6E]">{value}</p>
    </div>
  );
}

function TeacherStudentPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[20px] border border-[#E0D9CE] bg-[#FAF6EE] px-6 py-5">
      <h3 className="mb-4 text-[16px] font-semibold leading-6 text-[#3B3F6E]">{title}</h3>
      {children}
    </section>
  );
}

function TeacherStudentDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-[#1A1A1A]/45">{label}</p>
      <p className="mt-1 text-[14px] leading-5 text-[#1A1A1A]">{value}</p>
    </div>
  );
}

function TeacherStudentSnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] bg-[#F7F1E6] px-4 py-3">
      <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-[#1A1A1A]/45">{label}</p>
      <p className="mt-1 text-[14px] leading-5 text-[#1A1A1A]">{value}</p>
    </div>
  );
}

function BackArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.25 4.5L6.75 9L11.25 13.5" />
    </svg>
  );
}

function getNameInitials(name: string) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
  return initials || 'ST';
}

function formatTeacherLastActive(value: string | null) {
  if (!value) return 'Recently';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

function humanizeValue(value: unknown) {
  if (value == null || value === '') return 'N/A';
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'N/A';
  return String(value);
}

function formatSessionDate(value: string | null | undefined) {
  if (!value) return 'Recently';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
