'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardPath, useAuthGuard } from '@/shared/lib';
import {
  getTeacherInsightsOverview,
  getTeacherLessonInsights,
  getTeacherStudents,
  getTeacherTopicInsights,
} from '../api/teacher';

const VIOLET = '#9A9CCB';
const AMBER = '#F5A623';
const GREEN = '#28A745';

type SupportStudent = {
  id: string;
  name: string;
  initials: string;
  signals: string[];
};

type ConfusionLesson = {
  id: string;
  title: string;
  detail: string;
};

type BuildingTopic = {
  id: string;
  title: string;
  subject?: string | null;
  description: string;
};

type OverviewData = {
  supportStudents: SupportStudent[];
  confusionLessons: ConfusionLesson[];
  buildingTopics: BuildingTopic[];
};

type StudentLookup = Record<string, { id: string; name: string; initials: string; className?: string }>;

type LessonSection = {
  title: string;
  checkpoints: number;
  understood: number;
  total: number;
  studentStatuses: { studentId: string; name: string; initials: string; status: string }[];
  suggestion?: string | null;
};

type LessonDetail = {
  title: string;
  sections: LessonSection[];
};

type TopicStudent = {
  id: string;
  name: string;
  initials: string;
  status: 'on_track' | 'building' | 'may_need_support';
};

type TopicDetail = {
  title: string;
  bars: { label: string; value: number }[];
  summary: string;
  students: TopicStudent[];
};

type Drilldown =
  | { type: 'lesson'; id: string; title: string }
  | { type: 'topic'; id: string; title: string }
  | null;

function initialsFromName(name: string) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  return initials || 'ST';
}

function fullName(entry: any) {
  return (
    entry?.name ||
    `${entry?.first_name || ''} ${entry?.last_name || ''}`.trim() ||
    entry?.student_name ||
    'Student'
  );
}

function splitSignalText(text: string) {
  const normalized = text.trim();
  if (!normalized) return ['Support signal detected'];
  const parts = normalized
    .split(/(?<=\.)\s+/)
    .map((part) => part.replace(/\.$/, '').trim())
    .filter(Boolean);
  if (parts.length >= 2) return parts.slice(0, 2);
  if (normalized.length <= 34) return [normalized];
  return [normalized.slice(0, 34).trim(), normalized.slice(34, 70).trim()].filter(Boolean);
}

function buildStudentLookup(students: any[]): StudentLookup {
  return students.reduce<StudentLookup>((acc, student) => {
    const name = fullName(student);
    const initials = initialsFromName(name);
    const ids = [
      student?.student_uuid,
      student?.student_id,
      student?.uuid,
      student?.id,
      student?.nevo_id,
    ].filter((value) => value != null && String(value).trim());

    ids.forEach((value) => {
      acc[String(value)] = {
        id: String(value),
        name,
        initials,
        className: student?.class_name || student?.class || student?.group_name || undefined,
      };
    });
    return acc;
  }, {});
}

function normalizeOverview(payload: any): OverviewData {
  const supportStudents = Array.isArray(payload?.students_needing_support)
    ? payload.students_needing_support.map((student: any, index: number) => {
        const name = fullName(student);
        return {
          id: String(student?.student_id ?? student?.id ?? index),
          name,
          initials: student?.avatar_initials || initialsFromName(name),
          signals: splitSignalText(student?.description || student?.status || 'Support signal detected'),
        };
      })
    : [];

  const confusionLessons = Array.isArray(payload?.lessons_with_confusion_signals)
    ? payload.lessons_with_confusion_signals.map((lesson: any, index: number) => ({
        id: String(lesson?.lesson_id ?? lesson?.id ?? index),
        title: lesson?.lesson_title || lesson?.title || 'Lesson',
        detail:
          lesson?.section_or_summary ||
          `Section ${index + 1} - ${Number(lesson?.confusion_count ?? 0)} simplify requests`,
      }))
    : [];

  const buildingTopics = Array.isArray(payload?.topics_building_well)
    ? payload.topics_building_well.map((topic: any, index: number) => {
        const title = topic?.topic_name || topic?.subject || topic?.title || 'Topic';
        return {
          id: title,
          title,
          subject: topic?.subject,
          description:
            topic?.description ||
            `Understanding improving across ${topic?.subject || 'this class'}`,
        };
      })
    : [];

  return {
    supportStudents,
    confusionLessons,
    buildingTopics,
  };
}

function normalizeLessonDetail(payload: any, lookup: StudentLookup): LessonDetail {
  const sections = Array.isArray(payload?.sections)
    ? payload.sections.map((section: any, index: number) => ({
        title: section?.section_name || `Section ${index + 1}`,
        checkpoints: Number(section?.checkpoint_count ?? 0),
        understood: Number(section?.students_understood ?? 0),
        total: Number(section?.total_students ?? 0),
        studentStatuses: Array.isArray(section?.student_statuses)
          ? section.student_statuses.slice(0, 5).map((item: any) => {
              const id = String(item?.student_id ?? item?.id ?? '');
              const student = lookup[id];
              const name = student?.name || (id ? `Student ${id.slice(0, 4)}` : 'Student');
              return {
                studentId: id,
                name,
                initials: student?.initials || initialsFromName(name),
                status: item?.status || 'not_started',
              };
            })
          : [],
        suggestion: section?.suggestion || null,
      }))
    : [];

  return {
    title: payload?.lesson_title || 'Lesson insights',
    sections,
  };
}

function normalizeTopicDetail(payload: any): TopicDetail {
  const bars = Object.entries(payload?.class_performance_data || {}).map(([label, value]) => ({
    label,
    value: Number(value ?? 0),
  }));

  return {
    title: payload?.topic_name || 'Topic insights',
    bars,
    summary: payload?.performance_summary || 'Understanding has improved across this topic.',
    students: Array.isArray(payload?.students)
      ? payload.students.map((student: any, index: number) => {
          const name = fullName(student);
          const rawStatus = String(student?.mastery_status || 'building') as TopicStudent['status'];
          return {
            id: String(student?.student_id ?? index),
            name,
            initials: student?.avatar_initials || initialsFromName(name),
            status: rawStatus === 'on_track' || rawStatus === 'may_need_support' ? rawStatus : 'building',
          };
        })
      : [],
  };
}

function extractGrade(option: string) {
  const match = option.match(/grade\s*(\d+)/i);
  return match ? Number(match[1]) : undefined;
}

export function InsightsView() {
  const guardAuth = useAuthGuard('teacher');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [studentLookup, setStudentLookup] = useState<StudentLookup>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState('All classes');
  const [showClassFilter, setShowClassFilter] = useState(false);
  const [drilldown, setDrilldown] = useState<Drilldown>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const [insightsRes, studentsRes] = await Promise.all([
        getTeacherInsightsOverview({ grade: extractGrade(classFilter), daysBack: 7 }),
        getTeacherStudents(),
      ]);

      if (guardAuth([insightsRes as any, studentsRes as any]) || !mounted) return;

      if ('error' in insightsRes && insightsRes.error) {
        setError(insightsRes.error);
        setOverview(null);
        setLoading(false);
        return;
      }

      const studentPayload = 'data' in studentsRes ? studentsRes.data : null;
      const students = Array.isArray(studentPayload)
        ? studentPayload
        : Array.isArray(studentPayload?.students)
          ? studentPayload.students
          : [];

      setStudentLookup(buildStudentLookup(students));
      setOverview(normalizeOverview('data' in insightsRes ? insightsRes.data : null));
      setError(null);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [classFilter, guardAuth]);

  const classOptions = useMemo(() => {
    const values = Object.values(studentLookup)
      .map((student: any) => student.className)
      .filter(Boolean);
    return ['All classes', ...Array.from(new Set(values))];
  }, [studentLookup]);

  if (drilldown?.type === 'lesson') {
    return (
      <LessonInsightDetail
        lessonId={drilldown.id}
        fallbackTitle={drilldown.title}
        studentLookup={studentLookup}
        onBack={() => setDrilldown(null)}
      />
    );
  }

  if (drilldown?.type === 'topic') {
    return (
      <TopicInsightDetail
        topicName={drilldown.id}
        fallbackTitle={drilldown.title}
        onBack={() => setDrilldown(null)}
      />
    );
  }

  if (loading) return <InsightsSkeleton />;

  if (error) {
    return (
      <TabletFrame>
        <div className="flex h-full items-center justify-center px-8 text-center">
          <div className="max-w-[420px] rounded-[16px] border border-[#E0D9CE] bg-[#FAF6EE] px-8 py-10">
            <p className="mb-2 text-[16px] font-semibold text-[#3B3F6E]">Could not load insights</p>
            <p className="text-[14px] leading-5 text-[#2B2B2F]/60">{error}</p>
          </div>
        </div>
      </TabletFrame>
    );
  }

  const currentOverview = overview;
  const hasData =
    currentOverview !== null &&
    (currentOverview.supportStudents.length > 0 ||
      currentOverview.confusionLessons.length > 0 ||
      currentOverview.buildingTopics.length > 0);

  if (!hasData) return <InsightsEmpty />;

  return (
    <TabletFrame>
      <div className="flex h-full w-[804px] flex-col gap-8 bg-[#F7F1E6] p-8">
        <div className="flex h-9 w-[740px] items-center justify-between">
          <h1 className="text-[20px] font-bold leading-7 text-[#3B3F6E]">Insights</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowClassFilter((value) => !value)}
                className="flex h-9 min-w-[142px] items-center justify-center gap-2 rounded-[8px] border border-[#3B3F6E] bg-[#F7F1E6] px-[17px] text-[13px] font-medium text-[#3B3F6E]"
              >
                <span>{classFilter}</span>
                <ChevronDown />
              </button>
              {showClassFilter ? (
                <div className="absolute right-0 top-full z-20 mt-2 min-w-[180px] overflow-hidden rounded-[12px] border border-[#E0D9CE] bg-[#F7F1E6] shadow-[0_12px_32px_rgba(31,37,71,0.08)]">
                  {classOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setClassFilter(option);
                        setShowClassFilter(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-[#3B3F6E] hover:bg-[#EFE7D9]"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="flex h-9 min-w-[128px] items-center justify-center gap-2 rounded-[8px] border border-[#3B3F6E] bg-[#F7F1E6] px-[17px] text-[13px] font-medium text-[#3B3F6E]"
            >
              <CalendarIcon />
              Last 7 days
            </button>
          </div>
        </div>

        <section className="flex w-[740px] flex-col gap-4">
          <h2 className="text-[15px] font-semibold leading-[22px] text-[#3B3F6E]">Students who may need support</h2>
              {currentOverview!.supportStudents.length > 0 ? (
            <div className="flex w-[740px] gap-3 overflow-x-auto pb-1">
              {currentOverview!.supportStudents.slice(0, 10).map((student) => (
                <article
                  key={student.id}
                  className="flex h-[120px] w-[160px] shrink-0 flex-col rounded-[12px] border border-l-4 border-[#E0D9CE] border-l-[#F5A623] bg-[#F7F1E6] px-4 py-3"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Avatar initials={student.initials} size={36} />
                    <p className="min-w-0 truncate text-[14px] font-semibold leading-5 text-[#3B3F6E]">{student.name}</p>
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5">
                    {student.signals.slice(0, 2).map((signal) => (
                      <p key={signal} className="truncate text-[12px] font-normal leading-4 text-[#2B2B2F]/60">
                        {signal}
                      </p>
                    ))}
                  </div>
                  <button className="mt-1 text-left text-[13px] font-medium leading-5 text-[#9A9CCB]">
                    View student
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex h-[120px] w-[740px] items-center justify-center text-[14px] text-[#2B2B2F]/60">
              All students appear to be on track this week.
            </div>
          )}
        </section>

        <section className="flex w-[740px] flex-col gap-4">
          <h2 className="text-[15px] font-semibold leading-[22px] text-[#3B3F6E]">Lessons with confusion signals</h2>
          <div className="flex flex-col gap-3">
            {currentOverview!.confusionLessons.map((lesson) => (
              <SignalRow
                key={lesson.id}
                title={lesson.title}
                detail={lesson.detail}
                actionLabel="View lesson"
                stripColor={VIOLET}
                onClick={() => setDrilldown({ type: 'lesson', id: lesson.id, title: lesson.title })}
              />
            ))}
          </div>
        </section>

        <section className="flex w-[740px] flex-col gap-4">
          <h2 className="text-[15px] font-semibold leading-[22px] text-[#3B3F6E]">Topics building well</h2>
          <div className="flex flex-col gap-3">
            {currentOverview!.buildingTopics.map((topic) => (
              <SignalRow
                key={topic.id}
                title={topic.title}
                detail={topic.description}
                actionLabel="View progress"
                stripColor={GREEN}
                onClick={() => setDrilldown({ type: 'topic', id: topic.id, title: topic.title })}
              />
            ))}
          </div>
        </section>
      </div>
    </TabletFrame>
  );
}

function TabletFrame({ children }: { children: ReactNode }) {
  return <div className="h-full min-h-[900px] w-[804px] bg-[#F7F1E6]">{children}</div>;
}

function SignalRow({
  title,
  detail,
  actionLabel,
  stripColor,
  onClick,
}: {
  title: string;
  detail: string;
  actionLabel: string;
  stripColor: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-20 w-[740px] items-center justify-between rounded-[12px] border border-l-4 border-[#E0D9CE] bg-[#F7F1E6] px-[21px] py-[17px] text-left"
      style={{ borderLeftColor: stripColor }}
    >
      <span className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-[15px] font-medium leading-[22px] text-[#3B3F6E]">{title}</span>
        <span className="truncate text-[13px] font-normal leading-5 text-[#2B2B2F]/60">{detail}</span>
      </span>
      <span className="shrink-0 text-[13px] font-medium leading-5 text-[#9A9CCB]">
        {actionLabel} <span aria-hidden="true">-&gt;</span>
      </span>
    </button>
  );
}

function LessonInsightDetail({
  lessonId,
  fallbackTitle,
  studentLookup,
  onBack,
}: {
  lessonId: string;
  fallbackTitle: string;
  studentLookup: StudentLookup;
  onBack: () => void;
}) {
  const guardAuth = useAuthGuard('teacher');
  const [detail, setDetail] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const res = await getTeacherLessonInsights(lessonId);
      if (guardAuth(res as any) || !mounted) return;
      setDetail('data' in res ? normalizeLessonDetail(res.data, studentLookup) : null);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [guardAuth, lessonId, studentLookup]);

  if (loading) return <InsightsSkeleton backLabel="Insights" />;

  const data = detail ?? { title: fallbackTitle, sections: [] };

  return (
    <TabletFrame>
      <div className="relative h-full min-h-[900px] w-[804px] bg-[#F7F1E6] px-8 pt-8">
        <BackButton label="Insights" onBack={onBack} />
        <h1 className="mt-7 w-[740px] text-center text-[17px] font-semibold leading-[26px] text-[#3B3F6E]">
          {data.title}
        </h1>
        <div className="mt-10 flex w-[740px] flex-col gap-3">
          {data.sections.map((section, index) => {
            const expanded = expandedIndex === index;
            const pct = section.total > 0 ? Math.min(100, (section.understood / section.total) * 100) : 0;
            return (
              <article
                key={`${section.title}-${index}`}
                className="w-[740px] rounded-[12px] border border-[#E0D9CE] bg-[#F7F1E6]"
              >
                <button
                  type="button"
                  onClick={() => setExpandedIndex(expanded ? null : index)}
                  className="flex min-h-[76px] w-full items-center justify-between px-[21px] py-[17px] text-left"
                >
                  <span className="flex flex-col gap-1">
                    <span className="text-[15px] font-medium leading-[22px] text-[#3B3F6E]">{section.title}</span>
                    <span className="text-[12px] font-normal leading-4 text-[#3B3F6E]/55">
                      {section.checkpoints} checkpoints
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    <span className="relative block h-1.5 w-20 rounded-full bg-[#E8E2D4]">
                      <span className="absolute left-0 top-0 h-1.5 rounded-full bg-[#3B3F6E]" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="text-[12px] font-normal leading-4 text-[#3B3F6E]/55">
                      {section.understood} of {section.total} understood
                    </span>
                  </span>
                </button>
                {expanded ? (
                  <div className="border-t border-[#E0D9CE] px-[21px] pb-5 pt-4">
                    <div className="flex flex-col gap-3">
                      {section.studentStatuses.map((student) => (
                        <div key={`${student.studentId}-${student.status}`} className="flex h-8 items-center gap-3">
                          <Avatar initials={student.initials} size={28} />
                          <span className="min-w-[120px] text-[13px] font-normal leading-5 text-[#3B3F6E]">{student.name}</span>
                          <StatusTag status={student.status} />
                        </div>
                      ))}
                    </div>
                    {section.studentStatuses.length > 0 ? (
                      <button className="mt-4 w-full text-right text-[13px] font-medium text-[#9A9CCB]">
                        View all {section.total} students -&gt;
                      </button>
                    ) : null}
                    {section.suggestion ? (
                      <div className="mt-6 rounded-[12px] bg-[#9A9CCB]/10 p-5">
                        <p className="mb-3 text-[12px] font-normal uppercase tracking-[0.3px] text-[#9A9CCB]">Suggestion</p>
                        <div className="flex items-center justify-between gap-6">
                          <p className="text-[14px] font-normal leading-5 text-[#2B2B2F]">{section.suggestion}</p>
                          <button className="h-8 shrink-0 rounded-[8px] border border-[#3B3F6E] px-4 text-[13px] font-medium text-[#3B3F6E]">
                            Revise section
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </TabletFrame>
  );
}

function TopicInsightDetail({
  topicName,
  fallbackTitle,
  onBack,
}: {
  topicName: string;
  fallbackTitle: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const guardAuth = useAuthGuard('teacher');
  const [detail, setDetail] = useState<TopicDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const res = await getTeacherTopicInsights(topicName);
      if (guardAuth(res as any) || !mounted) return;
      setDetail('data' in res ? normalizeTopicDetail(res.data) : null);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [guardAuth, topicName]);

  if (loading) return <InsightsSkeleton backLabel="Insights" />;

  const data = detail ?? { title: fallbackTitle, bars: [], summary: '', students: [] };
  const maxBar = Math.max(100, ...data.bars.map((bar) => bar.value));

  return (
    <TabletFrame>
      <div className="relative min-h-[900px] w-[804px] bg-[#F7F1E6] px-8 pt-8">
        <BackButton label="Insights" onBack={onBack} />
        <h1 className="mt-7 w-[740px] text-center text-[17px] font-semibold leading-[26px] text-[#3B3F6E]">
          {data.title}
        </h1>

        <section className="mt-10 flex w-[740px] flex-col gap-4">
          <h2 className="text-[15px] font-medium leading-[22px] text-[#3B3F6E]">Class performance on this topic</h2>
          <div className="flex h-60 w-[740px] items-end justify-center rounded-[12px] bg-[#FAF9F6] px-6 py-6">
            {data.bars.length > 0 ? (
              <div className="flex h-[192px] items-end justify-center gap-6">
                {data.bars.map((bar, index) => (
                  <div key={`${bar.label}-${index}`} className="flex w-[52px] flex-col items-center gap-3">
                    <div className="flex h-40 w-10 items-end">
                      <div
                        className="w-10 rounded-t-[8px] bg-[#3B3F6E]"
                        style={{ height: `${Math.max(28, (bar.value / maxBar) * 160)}px` }}
                      />
                    </div>
                    <span className="max-w-[68px] truncate text-center text-[12px] font-normal leading-4 text-[#3B3F6E]/60">
                      {bar.label || `Lesson ${index + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-[#3B3F6E]/60">No completed lesson data is available yet for this topic.</p>
            )}
          </div>
          <p className="text-[13px] font-normal leading-5 text-[#3B3F6E]/60">
            {data.summary || 'Understanding has improved across 3 lessons on this topic.'}
          </p>
        </section>

        <section className="mt-9 flex w-[740px] flex-col gap-4 pb-10">
          <h2 className="text-[15px] font-medium leading-[22px] text-[#3B3F6E]">Students</h2>
          <div className="flex flex-col gap-2">
            {data.students.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => router.push(`${getDashboardPath('teacher', 'students')}?student=${encodeURIComponent(student.id)}`)}
                className="flex h-14 w-[740px] items-center gap-3 rounded-[8px] px-3 text-left hover:bg-[#F2EADB]"
              >
                <Avatar initials={student.initials} size={32} />
                <span className="min-w-[140px] text-[14px] font-medium leading-5 text-[#3B3F6E]">{student.name}</span>
                <TopicStatus status={student.status} />
              </button>
            ))}
          </div>
        </section>
      </div>
    </TabletFrame>
  );
}

function InsightsEmpty() {
  return (
    <TabletFrame>
      <div className="flex h-[900px] w-[804px] items-center justify-center bg-[#F7F1E6]">
        <div className="flex w-[380px] flex-col items-center">
          <ClassroomIllustration />
          <h2 className="mt-6 text-center text-[16px] font-semibold leading-6 text-[#3B3F6E]">
            No signals to review right now
          </h2>
          <p className="mt-2 text-center text-[14px] font-normal leading-5 text-[#2B2B2F]/60">
            Check back as students progress through their lessons.
          </p>
        </div>
      </div>
    </TabletFrame>
  );
}

function InsightsSkeleton({ backLabel }: { backLabel?: string }) {
  return (
    <TabletFrame>
      <div className="flex h-[900px] w-[804px] flex-col gap-8 bg-[#F7F1E6] p-8">
        {backLabel ? <div className="h-5 w-[96px] rounded-[6px] bg-[#E8E2D4]" /> : null}
        <div className="flex h-9 w-[740px] items-center justify-between">
          <div className="h-[18px] w-[100px] rounded-[8px] bg-[#E8E2D4]" />
          <div className="flex gap-3">
            <div className="h-9 w-[120px] rounded-[8px] bg-[#E8E2D4]" />
            <div className="h-9 w-[120px] rounded-[8px] bg-[#E8E2D4]" />
          </div>
        </div>
        <div className="flex w-[740px] flex-col gap-4">
          <div className="h-[18px] w-[220px] rounded-[6px] bg-[#E8E2D4]" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[120px] w-[160px] rounded-[12px] bg-[#E8E2D4]" />
            ))}
          </div>
        </div>
        <div className="flex w-[740px] flex-col gap-4">
          <div className="h-[18px] w-[240px] rounded-[6px] bg-[#E8E2D4]" />
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-[72px] w-[740px] rounded-[12px] bg-[#E8E2D4]" />
          ))}
        </div>
        <div className="flex w-[740px] flex-col gap-4">
          <div className="h-[18px] w-[180px] rounded-[6px] bg-[#E8E2D4]" />
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-[72px] w-[740px] rounded-[12px] bg-[#E8E2D4]" />
          ))}
        </div>
      </div>
    </TabletFrame>
  );
}

function BackButton({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <button type="button" onClick={onBack} className="flex h-5 items-center gap-2 text-[14px] font-normal leading-5 text-[#3B3F6E]">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.875" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11.5 5L6.5 10L11.5 15" />
      </svg>
      {label}
    </button>
  );
}

function Avatar({ initials, size }: { initials: string; size: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-[#E0D9CE] text-[12px] font-semibold text-[#3B3F6E]"
      style={{ width: size, height: size }}
    >
      {initials}
    </span>
  );
}

function StatusTag({ status }: { status: string }) {
  const label =
    status === 'understood'
      ? 'Understood'
      : status === 'not_understood'
        ? 'Asked for help'
        : 'Not started';
  const isSupport = status === 'not_understood';
  return (
    <span
      className="rounded-[6px] px-2 py-1 text-[11px] font-normal leading-4"
      style={{
        backgroundColor: isSupport ? 'rgba(245, 166, 35, 0.15)' : 'rgba(154, 156, 203, 0.15)',
        color: isSupport ? AMBER : VIOLET,
      }}
    >
      {label}
    </span>
  );
}

function TopicStatus({ status }: { status: TopicStudent['status'] }) {
  const config =
    status === 'on_track'
      ? { label: 'On track', bg: '#D4EDDA', color: GREEN }
      : status === 'may_need_support'
        ? { label: 'May need support', bg: '#FFF3CD', color: AMBER }
        : { label: 'Building', bg: '#E8E7F5', color: VIOLET };

  return (
    <span className="rounded-full px-3 py-2 text-[12px] font-normal leading-4" style={{ backgroundColor: config.bg, color: config.color }}>
      {config.label}
    </span>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#3B3F6E" strokeWidth="1">
      <rect x="1.5" y="2.5" width="13" height="12" rx="2" />
      <path d="M4 1.5V4" strokeLinecap="round" />
      <path d="M12 1.5V4" strokeLinecap="round" />
      <path d="M1.5 6H14.5" />
      <path d="M6 9H6.1M9 9H9.1M12 9H12.1M4 12H4.1M7 12H7.1M10 12H10.1" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#3B3F6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6L8 10L12 6" />
    </svg>
  );
}

function ClassroomIllustration() {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-[12px] opacity-80">
      <rect width="200" height="200" rx="12" fill="#F7E7C7" />
      <path d="M0 140H200V200H0V140Z" fill="#EBD6B4" />
      <path d="M25 28H175V142H25V28Z" fill="#FFF7E7" />
      <path d="M25 28H175L152 142H48L25 28Z" fill="#FBEFD9" />
      <rect x="70" y="54" width="60" height="38" rx="2" fill="#FFFDF8" stroke="#D7B98A" strokeWidth="2" />
      <path d="M44 45H62V130H44V45Z" fill="#FFE7B6" />
      <path d="M138 45H156V130H138V45Z" fill="#FFE7B6" />
      <path d="M45 68H62M45 92H62M45 116H62M139 68H156M139 92H156M139 116H156" stroke="#E0BE85" strokeWidth="2" />
      <g fill="#D88D3D">
        <rect x="26" y="146" width="34" height="13" rx="2" />
        <rect x="83" y="146" width="34" height="13" rx="2" />
        <rect x="140" y="146" width="34" height="13" rx="2" />
        <rect x="52" y="168" width="34" height="13" rx="2" />
        <rect x="112" y="168" width="34" height="13" rx="2" />
      </g>
      <g stroke="#A96424" strokeWidth="2" strokeLinecap="round">
        <path d="M31 159V181M55 159V181M88 159V181M112 159V181M145 159V181M169 159V181" />
        <path d="M57 181V193M81 181V193M117 181V193M141 181V193" />
      </g>
      <path d="M134 30C146 50 157 83 160 122" stroke="#FFEBC1" strokeWidth="8" strokeLinecap="round" />
      <path d="M64 32C54 56 46 88 43 124" stroke="#FFEBC1" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}
