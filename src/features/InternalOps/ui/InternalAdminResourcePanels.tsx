"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type {
  InternalAdminLessonDetail,
  InternalAdminLessonSummary,
  InternalAdminStudentDetail,
  InternalAdminStudentSummary,
  InternalAdminTeacherDetail,
  InternalAdminTeacherSummary,
} from "../api/types";
import {
  InternalEmptyState,
  InternalPageHeader,
  InternalSearchInput,
  InternalStatCard,
} from "./InternalOpsPrimitives";
import { InternalRefreshPill, internalTheme } from "./internalOpsTheme";

type CacheEntry<T> = { items: T[]; updatedAt: number };

const teacherListCache = new Map<string, CacheEntry<InternalAdminTeacherSummary>>();
const teacherDetailCache = new Map<string, InternalAdminTeacherDetail>();
const studentListCache = new Map<string, CacheEntry<InternalAdminStudentSummary>>();
const studentDetailCache = new Map<string, InternalAdminStudentDetail>();
const lessonListCache = new Map<string, CacheEntry<InternalAdminLessonSummary>>();
const lessonDetailCache = new Map<string, InternalAdminLessonDetail>();

type ResourceConfig<TSummary, TDetail> = {
  basePath: string;
  description: string;
  detailCache: Map<string, TDetail>;
  emptyDescription: string;
  emptyTitle: string;
  getId: (item: TSummary) => string;
  getTitle: (item: TSummary) => string;
  listCache: Map<string, CacheEntry<TSummary>>;
  listKey: string;
  renderCardMeta: (item: TSummary) => string;
  renderDetail: (props: DetailRenderProps<TDetail>) => ReactNode;
  searchPlaceholder: string;
  stats: (items: TSummary[]) => Array<{ label: string; value: number | string }>;
  title: string;
};

type DetailRenderProps<TDetail> = {
  detail: TDetail;
  patch: (payload: Record<string, unknown>) => Promise<void>;
  saving: boolean;
};

function statusDot(status: string) {
  if (status === "ok") return "bg-[#7ab87a]";
  if (status.includes("failed")) return "bg-[#c0392b]";
  return "bg-[#e8a84a]";
}

function labelStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function textValue(value: unknown, fallback = "Not set") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

async function readJson<T>(response: Response, fallback: T): Promise<T> {
  if (!response.ok) return fallback;
  return (await response.json().catch(() => fallback)) as T;
}

function AdminResourcePanel<TSummary, TDetail>({
  config,
}: {
  config: ResourceConfig<TSummary, TDetail>;
}) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const cacheKey = deferredSearch.toLowerCase();
  const initialCache = config.listCache.get(cacheKey);
  const [items, setItems] = useState<TSummary[]>(initialCache?.items ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialCache?.items[0] ? config.getId(initialCache.items[0]) : null,
  );
  const [detail, setDetail] = useState<TDetail | null>(
    selectedId ? (config.detailCache.get(selectedId) ?? null) : null,
  );
  const [loading, setLoading] = useState(!initialCache);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;
    const cached = config.listCache.get(cacheKey);

    async function loadList() {
      if (cached) {
        setItems(cached.items);
        setLoading(false);
        setRefreshing(true);
        setError("");
      } else {
        setLoading(true);
        setRefreshing(false);
      }

      try {
        const query = new URLSearchParams({
          search: deferredSearch,
          status: "all",
          limit: "100",
        });
        const response = await fetch(`${config.basePath}?${query.toString()}`, {
          cache: "no-store",
        });
        const data = await readJson<Record<string, TSummary[]>>(response, {
          [config.listKey]: [],
        } as Record<string, TSummary[]>);
        if (!isActive) return;
        const nextItems = data[config.listKey] ?? [];
        config.listCache.set(cacheKey, {
          items: nextItems,
          updatedAt: Date.now(),
        });
        setItems(nextItems);
        setSelectedId((current) => {
          if (current && nextItems.some((item) => config.getId(item) === current)) {
            return current;
          }
          return nextItems[0] ? config.getId(nextItems[0]) : null;
        });
        setError(response.ok ? "" : `${config.title} could not be loaded.`);
      } catch {
        if (isActive && !cached) setError(`${config.title} could not be loaded.`);
      } finally {
        if (isActive) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadList();
    return () => {
      isActive = false;
    };
  }, [cacheKey, config, deferredSearch]);

  useEffect(() => {
    let isActive = true;
    if (!selectedId) {
      setDetail(null);
      return;
    }
    const detailId = selectedId;
    const cached = config.detailCache.get(detailId);
    if (cached) {
      setDetail(cached);
      setDetailLoading(false);
    } else {
      setDetail(null);
      setDetailLoading(true);
    }

    async function loadDetail() {
      try {
        const response = await fetch(`${config.basePath}/${detailId}`, {
          cache: "no-store",
        });
        const data = await readJson<TDetail | null>(response, null);
        if (!isActive || !data) return;
        config.detailCache.set(detailId, data);
        setDetail(data);
      } finally {
        if (isActive) setDetailLoading(false);
      }
    }

    loadDetail();
    return () => {
      isActive = false;
    };
  }, [config, selectedId]);

  const stats = useMemo(() => config.stats(items), [config, items]);

  async function patch(payload: Record<string, unknown>) {
    if (!selectedId) return;
    setSaving(true);
    try {
      const response = await fetch(`${config.basePath}/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await readJson<TDetail | null>(response, null);
      if (!response.ok || !data) {
        setError(`${config.title} update failed.`);
        return;
      }
      config.detailCache.set(selectedId, data);
      setDetail(data);
      setItems((current) =>
        current.map((item) =>
          config.getId(item) === selectedId ? ({ ...item, ...data } as TSummary) : item,
        ),
      );
      setError("");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 pb-28 md:pb-8">
        <div className={`h-16 ${internalTheme.skeleton}`} />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <div className={`h-24 ${internalTheme.skeleton}`} />
          <div className={`h-24 ${internalTheme.skeleton}`} />
          <div className={`h-24 ${internalTheme.skeleton}`} />
          <div className={`h-24 ${internalTheme.skeleton}`} />
        </div>
        <div className={`h-64 ${internalTheme.skeleton}`} />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-28 md:pb-8">
      <InternalPageHeader
        action={<InternalRefreshPill show={refreshing} />}
        description={config.description}
        title={config.title}
      />

      <InternalSearchInput
        onChange={setSearch}
        placeholder={config.searchPlaceholder}
        value={search}
      />

      {error ? (
        <div className={`${internalTheme.card} text-[13px] text-[#c0392b]`}>
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {stats.map((stat) => (
          <InternalStatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
          />
        ))}
      </section>

      {!items.length ? (
        <InternalEmptyState
          description={config.emptyDescription}
          title={config.emptyTitle}
        />
      ) : (
        <section className="grid gap-3 md:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-2">
            {items.map((item) => {
              const id = config.getId(item);
              const active = selectedId === id;
              const relationshipStatus = String(
                (item as { relationship_status?: string }).relationship_status ?? "ok",
              );
              return (
                <button
                  className={`w-full rounded-[12px] border bg-white p-4 text-left shadow-sm transition ${
                    active
                      ? "border-[#3b3f6e]"
                      : "border-[#e0d9ce] hover:border-[#9a9ccb]"
                  }`}
                  key={id}
                  onClick={() => setSelectedId(id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[14px] font-semibold text-[#3b3f6e]">
                        {config.getTitle(item)}
                      </h3>
                      <p className={`mt-1 text-[12px] ${internalTheme.faint}`}>
                        {config.renderCardMeta(item)}
                      </p>
                    </div>
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${statusDot(
                        relationshipStatus,
                      )}`}
                    />
                  </div>
                  <p className={`mt-3 text-[11px] ${internalTheme.faint}`}>
                    {labelStatus(relationshipStatus)}
                  </p>
                </button>
              );
            })}
          </div>

          <aside className={internalTheme.card}>
            {detailLoading ? (
              <div className="space-y-3">
                <div className={`h-5 ${internalTheme.skeleton}`} />
                <div className={`h-20 ${internalTheme.skeleton}`} />
                <div className={`h-28 ${internalTheme.skeleton}`} />
              </div>
            ) : detail ? (
              config.renderDetail({ detail, patch, saving })
            ) : (
              <p className={`text-[13px] ${internalTheme.faint}`}>
                Select a record to inspect its details.
              </p>
            )}
          </aside>
        </section>
      )}
    </div>
  );
}

function DetailMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[10px] bg-[#f3eadc] p-3">
      <p className="text-[18px] font-bold text-[#3b3f6e]">{value}</p>
      <p className={internalTheme.label}>{label}</p>
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        active ? "bg-[#d4edda] text-[#2f7d32]" : "bg-[#f3eadc] text-[#2b2b2f99]"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function InternalTeachersPanel() {
  const config = useMemo(
    (): ResourceConfig<InternalAdminTeacherSummary, InternalAdminTeacherDetail> => ({
      basePath: "/api/internal/admin/teachers",
      description:
        "Inspect teacher records, class links, uploaded lessons, and activity health.",
      detailCache: teacherDetailCache,
      emptyDescription: "Try another search term or clear the filter.",
      emptyTitle: "No teachers found",
      getId: (item) => item.teacher_id,
      getTitle: (item) => item.teacher_name,
      listCache: teacherListCache,
      listKey: "teachers",
      renderCardMeta: (item) =>
        `${item.school_name || "No school"} - ${item.assigned_classes} classes - ${item.uploaded_lessons} lessons`,
      renderDetail: ({ detail, patch, saving }) => (
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[16px] font-bold text-[#3b3f6e]">
                {detail.teacher_name}
              </h3>
              <p className={`mt-1 text-[12px] ${internalTheme.faint}`}>
                {detail.email || "No email"} - {detail.school_name || "No school"}
              </p>
            </div>
            <StatusPill active={detail.is_active} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <DetailMetric label="Classes" value={detail.assigned_classes} />
            <DetailMetric label="Lessons" value={detail.uploaded_lessons} />
            <DetailMetric label="Active assignments" value={detail.active_assignments} />
            <DetailMetric label="Completions" value={detail.completed_sessions} />
          </div>
          <ListBlock
            empty="No classes linked yet."
            label="Classes"
            values={detail.classes.map((item) => item.class_name)}
          />
          <ListBlock
            empty="No lessons uploaded yet."
            label="Recent lessons"
            values={detail.lessons.map((item) => textValue(item.title))}
          />
          <button
            className="mt-4 h-10 w-full rounded-[10px] bg-[#3b3f6e] text-[13px] font-semibold text-[#f7f1e6] disabled:opacity-50"
            disabled={saving}
            onClick={() => patch({ is_active: !detail.is_active })}
            type="button"
          >
            {saving ? "Saving..." : detail.is_active ? "Deactivate teacher" : "Reactivate teacher"}
          </button>
        </div>
      ),
      searchPlaceholder: "Search teachers...",
      stats: (items) => [
        { label: "Active teachers", value: items.filter((item) => item.is_active).length },
        {
          label: "Needs review",
          value: items.filter((item) => item.relationship_status !== "ok").length,
        },
        {
          label: "Classes",
          value: items.reduce((total, item) => total + item.assigned_classes, 0),
        },
        {
          label: "Lessons",
          value: items.reduce((total, item) => total + item.uploaded_lessons, 0),
        },
      ],
      title: "Teachers",
    }),
    [],
  );

  return (
    <AdminResourcePanel
      config={config}
    />
  );
}

export function InternalStudentsPanel() {
  const config = useMemo(
    (): ResourceConfig<InternalAdminStudentSummary, InternalAdminStudentDetail> => ({
      basePath: "/api/internal/admin/students",
      description:
        "Inspect student placement, learning flags, accessibility settings, and progress.",
      detailCache: studentDetailCache,
      emptyDescription: "Try another name, Nevo ID, class, or school.",
      emptyTitle: "No students found",
      getId: (item) => item.student_id,
      getTitle: (item) => item.student_name,
      listCache: studentListCache,
      listKey: "students",
      renderCardMeta: (item) =>
        `${item.nevo_id || "No Nevo ID"} - ${item.class_name || "No class"} - ${item.lessons_completed} completed`,
      renderDetail: ({ detail, patch, saving }) => (
        <StudentDetail
          detail={detail}
          key={detail.student_id}
          patch={patch}
          saving={saving}
        />
      ),
      searchPlaceholder: "Search students...",
      stats: (items) => [
        { label: "Active students", value: items.filter((item) => item.is_active).length },
        { label: "ESL inferred", value: items.filter((item) => item.is_esl_learner).length },
        {
          label: "Completed",
          value: items.reduce((total, item) => total + item.lessons_completed, 0),
        },
        {
          label: "Needs review",
          value: items.filter((item) => item.relationship_status !== "ok").length,
        },
      ],
      title: "Students",
    }),
    [],
  );

  return (
    <AdminResourcePanel
      config={config}
    />
  );
}

function StudentDetail({
  detail,
  patch,
  saving,
}: DetailRenderProps<InternalAdminStudentDetail>) {
  const [classId, setClassId] = useState(detail.class_id ?? "");

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-bold text-[#3b3f6e]">
            {detail.student_name}
          </h3>
          <p className={`mt-1 text-[12px] ${internalTheme.faint}`}>
            {detail.nevo_id || "No Nevo ID"} - {detail.school_name || "No school"}
          </p>
        </div>
        <StatusPill active={detail.is_active} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <DetailMetric label="Completed" value={detail.lessons_completed} />
        <DetailMetric label="Assigned" value={detail.assigned_lessons} />
        <DetailMetric label="Score" value={`${Math.round(detail.average_score)}%`} />
        <DetailMetric label="Streak" value={detail.current_streak_days} />
      </div>
      <label className="mt-4 block">
        <span className={internalTheme.label}>Class placement</span>
        <select
          className="mt-2 h-10 w-full rounded-[10px] border border-[#e0d9ce] bg-white px-3 text-[13px] text-[#3b3f6e] outline-none focus:border-[#3b3f6e]"
          onChange={(event) => setClassId(event.target.value)}
          value={classId}
        >
          <option value="">No class assigned</option>
          {detail.class_options.map((classItem) => (
            <option key={classItem.class_id} value={classItem.class_id}>
              {classItem.class_name}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <ToggleButton
          active={detail.adapt_automatically}
          label="Auto adapt"
          onClick={() => patch({ adapt_automatically: !detail.adapt_automatically })}
        />
        <ToggleButton
          active={detail.voice_guidance}
          label="Voice guidance"
          onClick={() => patch({ voice_guidance: !detail.voice_guidance })}
        />
        <ToggleButton
          active={detail.large_text}
          label="Large text"
          onClick={() => patch({ large_text: !detail.large_text })}
        />
        <ToggleButton
          active={detail.extra_spacing}
          label="Extra spacing"
          onClick={() => patch({ extra_spacing: !detail.extra_spacing })}
        />
      </div>
      <ListBlock
        empty="No recent assignments."
        label="Recent lessons"
        values={detail.recent_lessons.map((item) => textValue(item.title))}
      />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          className="h-10 rounded-[10px] border border-[#3b3f6e] text-[13px] font-semibold text-[#3b3f6e] disabled:opacity-50"
          disabled={saving || classId === (detail.class_id ?? "")}
          onClick={() => patch({ class_id: classId || null })}
          type="button"
        >
          {saving ? "Saving..." : "Save class"}
        </button>
        <button
          className="h-10 rounded-[10px] bg-[#3b3f6e] text-[13px] font-semibold text-[#f7f1e6] disabled:opacity-50"
          disabled={saving}
          onClick={() => patch({ is_active: !detail.is_active })}
          type="button"
        >
          {detail.is_active ? "Deactivate" : "Reactivate"}
        </button>
      </div>
    </div>
  );
}

export function InternalLessonsPanel() {
  const config = useMemo(
    (): ResourceConfig<InternalAdminLessonSummary, InternalAdminLessonDetail> => ({
      basePath: "/api/internal/admin/lessons",
      description:
        "Inspect uploaded lessons, assignment coverage, AI package health, and safe lesson status controls.",
      detailCache: lessonDetailCache,
      emptyDescription: "Try another title, teacher, subject, or school.",
      emptyTitle: "No lessons found",
      getId: (item) => item.lesson_id,
      getTitle: (item) => item.title,
      listCache: lessonListCache,
      listKey: "lessons",
      renderCardMeta: (item) =>
        `${item.subject || "No subject"} - ${item.teacher_name || "No teacher"} - ${item.status}`,
      renderDetail: ({ detail, patch, saving }) => (
        <LessonDetail detail={detail} patch={patch} saving={saving} />
      ),
      searchPlaceholder: "Search lessons...",
      stats: (items) => [
        { label: "Lessons", value: items.length },
        {
          label: "Needs action",
          value: items.filter((item) => item.relationship_status !== "ok").length,
        },
        {
          label: "Assignments",
          value: items.reduce((total, item) => total + item.assignment_count, 0),
        },
        {
          label: "Variants",
          value: items.reduce((total, item) => total + item.adapted_variants, 0),
        },
      ],
      title: "Lessons",
    }),
    [],
  );

  return (
    <AdminResourcePanel
      config={config}
    />
  );
}

function LessonDetail({
  detail,
  patch,
  saving,
}: DetailRenderProps<InternalAdminLessonDetail>) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-bold text-[#3b3f6e]">{detail.title}</h3>
          <p className={`mt-1 text-[12px] ${internalTheme.faint}`}>
            {detail.teacher_name || "No teacher"} - {detail.school_name || "No school"}
          </p>
        </div>
        <span className="rounded-full bg-[#f3eadc] px-2.5 py-1 text-[11px] font-semibold text-[#3b3f6e]">
          {detail.status}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <DetailMetric label="Concepts" value={detail.concept_count} />
        <DetailMetric label="Assignments" value={detail.assignment_count} />
        <DetailMetric label="Completed" value={detail.completed_assignments} />
        <DetailMetric label="Variants" value={detail.adapted_variants} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <ToggleButton
          active={detail.simplify_enabled}
          label="Simplify"
          onClick={() => patch({ simplify_enabled: !detail.simplify_enabled })}
        />
        <ToggleButton
          active={detail.expand_enabled}
          label="Expand"
          onClick={() => patch({ expand_enabled: !detail.expand_enabled })}
        />
      </div>
      <ListBlock
        empty="No transform jobs yet."
        label="Transform jobs"
        values={detail.jobs.map((item) => {
          const status = textValue(item.status);
          const failed = Number(item.failed_students ?? item.failed_signatures ?? 0);
          return failed ? `${status} - ${failed} failures` : status;
        })}
      />
      <ListBlock
        empty="No key concepts saved."
        label="Key concepts"
        values={detail.key_concepts.slice(0, 6)}
      />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          className="h-10 rounded-[10px] border border-[#3b3f6e] text-[13px] font-semibold text-[#3b3f6e] disabled:opacity-50"
          disabled={saving || detail.status === "archived"}
          onClick={() => patch({ status: "archived" })}
          type="button"
        >
          {saving ? "Saving..." : "Archive"}
        </button>
        <button
          className="h-10 rounded-[10px] bg-[#3b3f6e] text-[13px] font-semibold text-[#f7f1e6] disabled:opacity-50"
          disabled={saving || detail.status === "published"}
          onClick={() => patch({ status: "published" })}
          type="button"
        >
          Publish
        </button>
      </div>
    </div>
  );
}

function ToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`h-10 rounded-[10px] text-[12px] font-semibold ${
        active ? "bg-[#d4edda] text-[#2f7d32]" : "bg-[#f3eadc] text-[#2b2b2f99]"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}: {active ? "On" : "Off"}
    </button>
  );
}

function ListBlock({
  empty,
  label,
  values,
}: {
  empty: string;
  label: string;
  values: string[];
}) {
  return (
    <div className="mt-4">
      <p className={internalTheme.label}>{label}</p>
      <div className="mt-2 space-y-1">
        {values.length ? (
          values.slice(0, 5).map((value, index) => (
            <p
              className="rounded-[9px] bg-[#f3eadc] px-3 py-2 text-[12px] text-[#3b3f6e]"
              key={`${value}-${index}`}
            >
              {value}
            </p>
          ))
        ) : (
          <p className={`text-[12px] ${internalTheme.faint}`}>{empty}</p>
        )}
      </div>
    </div>
  );
}
