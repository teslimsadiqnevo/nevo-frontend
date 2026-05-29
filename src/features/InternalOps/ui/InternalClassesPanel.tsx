"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type {
  InternalAdminClassDetail,
  InternalAdminClassSummary,
} from "../api/types";
import {
  InternalEmptyState,
  InternalPageHeader,
  InternalSearchInput,
  InternalStatCard,
} from "./InternalOpsPrimitives";
import { InternalRefreshPill, internalTheme } from "./internalOpsTheme";

type ClassListCache = {
  classes: InternalAdminClassSummary[];
  updatedAt: number;
};

const classListCache = new Map<string, ClassListCache>();
const classDetailCache = new Map<string, InternalAdminClassDetail>();

function relationshipCopy(status: string) {
  if (status === "missing_teacher") return "Missing teacher";
  if (status === "no_students") return "No students";
  return "Healthy";
}

function relationshipColor(status: string) {
  if (status === "ok") return "bg-[#7ab87a]";
  if (status === "missing_teacher" || status === "no_students") return "bg-[#e8a84a]";
  return "bg-[#c0392b]";
}

async function readJson<T>(response: Response, fallback: T): Promise<T> {
  if (!response.ok) return fallback;
  return (await response.json().catch(() => fallback)) as T;
}

export function InternalClassesPanel() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const cacheKey = deferredSearch.toLowerCase();
  const initialCache = classListCache.get(cacheKey);
  const [classes, setClasses] = useState<InternalAdminClassSummary[]>(
    initialCache?.classes ?? [],
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    initialCache?.classes[0]?.class_id ?? null,
  );
  const [detail, setDetail] = useState<InternalAdminClassDetail | null>(
    selectedId ? (classDetailCache.get(selectedId) ?? null) : null,
  );
  const [teacherId, setTeacherId] = useState("");
  const [loading, setLoading] = useState(!initialCache);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;
    const cached = classListCache.get(cacheKey);

    async function loadClasses() {
      if (cached) {
        setClasses(cached.classes);
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
        const response = await fetch(
          `/api/internal/admin/classes?${query.toString()}`,
          { cache: "no-store" },
        );
        const data = await readJson<{ classes?: InternalAdminClassSummary[] }>(
          response,
          { classes: [] },
        );
        if (!isActive) return;
        const nextClasses = data.classes ?? [];
        classListCache.set(cacheKey, {
          classes: nextClasses,
          updatedAt: Date.now(),
        });
        setClasses(nextClasses);
        setSelectedId((current) => {
          if (current && nextClasses.some((item) => item.class_id === current)) {
            return current;
          }
          return nextClasses[0]?.class_id ?? null;
        });
        setError(response.ok ? "" : "Classes could not be loaded.");
      } catch {
        if (isActive && !cached) setError("Classes could not be loaded.");
      } finally {
        if (isActive) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadClasses();
    return () => {
      isActive = false;
    };
  }, [cacheKey, deferredSearch]);

  useEffect(() => {
    let isActive = true;
    if (!selectedId) {
      setDetail(null);
      setTeacherId("");
      return;
    }

    const detailId = selectedId;
    const cached = classDetailCache.get(detailId);
    if (cached) {
      setDetail(cached);
      setTeacherId(cached.teacher_id ?? "");
      setDetailLoading(false);
    } else {
      setDetail(null);
      setTeacherId("");
      setDetailLoading(true);
    }

    async function loadDetail() {
      try {
        const response = await fetch(`/api/internal/admin/classes/${detailId}`, {
          cache: "no-store",
        });
        const data = await readJson<InternalAdminClassDetail | null>(
          response,
          null,
        );
        if (!isActive || !data) return;
        classDetailCache.set(detailId, data);
        setDetail(data);
        setTeacherId(data.teacher_id ?? "");
      } finally {
        if (isActive) setDetailLoading(false);
      }
    }

    loadDetail();
    return () => {
      isActive = false;
    };
  }, [selectedId]);

  const stats = useMemo(() => {
    const active = classes.filter((item) => item.is_active).length;
    const relationshipIssues = classes.filter(
      (item) => item.relationship_status !== "ok",
    ).length;
    const students = classes.reduce((total, item) => total + item.student_count, 0);
    const completed = classes.reduce(
      (total, item) => total + item.completed_sessions,
      0,
    );
    return { active, relationshipIssues, students, completed };
  }, [classes]);

  async function patchClass(payload: Record<string, unknown>) {
    if (!selectedId) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/internal/admin/classes/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await readJson<InternalAdminClassDetail | null>(
        response,
        null,
      );
      if (!response.ok || !data) {
        setError("Class update failed.");
        return;
      }
      classDetailCache.set(selectedId, data);
      setDetail(data);
      setTeacherId(data.teacher_id ?? "");
      setClasses((current) =>
        current.map((item) =>
          item.class_id === data.class_id ? { ...item, ...data } : item,
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
        title="Classes"
        description="Verify class records, teacher links, student counts, and assignment activity."
        action={<InternalRefreshPill show={refreshing} />}
      />

      <InternalSearchInput
        onChange={setSearch}
        placeholder="Search classes..."
        value={search}
      />

      {error ? (
        <div className={`${internalTheme.card} text-[13px] text-[#c0392b]`}>
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <InternalStatCard label="Active classes" value={stats.active} />
        <InternalStatCard label="Needs review" value={stats.relationshipIssues} />
        <InternalStatCard label="Students" value={stats.students} />
        <InternalStatCard label="Completions" value={stats.completed} />
      </section>

      {!classes.length ? (
        <InternalEmptyState
          title="No classes found"
          description="Try another search term or clear the filter to inspect all classes."
        />
      ) : (
        <section className="grid gap-3 md:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-2">
            {classes.map((classItem) => {
              const active = selectedId === classItem.class_id;
              return (
                <button
                  className={`w-full rounded-[12px] border bg-white p-4 text-left shadow-sm transition ${
                    active
                      ? "border-[#3b3f6e]"
                      : "border-[#e0d9ce] hover:border-[#9a9ccb]"
                  }`}
                  key={classItem.class_id}
                  onClick={() => setSelectedId(classItem.class_id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[14px] font-semibold text-[#3b3f6e]">
                        {classItem.class_name}
                      </h3>
                      <p className={`mt-1 text-[12px] ${internalTheme.faint}`}>
                        {classItem.school_name}
                      </p>
                    </div>
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${relationshipColor(
                        classItem.relationship_status,
                      )}`}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[12px] text-[#2b2b2f99]">
                    <span>{classItem.student_count} students</span>
                    <span>{classItem.assigned_lessons} lessons</span>
                    <span>{classItem.teacher_name || "No teacher"}</span>
                  </div>
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
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[16px] font-bold text-[#3b3f6e]">
                      {detail.class_name}
                    </h3>
                    <p className={`mt-1 text-[12px] ${internalTheme.faint}`}>
                      {detail.school_name}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      detail.is_active
                        ? "bg-[#d4edda] text-[#2f7d32]"
                        : "bg-[#f3eadc] text-[#2b2b2f99]"
                    }`}
                  >
                    {detail.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <DetailMetric label="Students" value={detail.student_count} />
                  <DetailMetric label="Lessons" value={detail.assigned_lessons} />
                  <DetailMetric
                    label="Completed"
                    value={detail.completed_sessions}
                  />
                  <DetailMetric
                    label="Subjects"
                    value={detail.subjects.length}
                  />
                </div>

                <div className="mt-4 space-y-2 text-[12px] text-[#2b2b2f99]">
                  <p>Code: {detail.class_code || "Not set"}</p>
                  <p>Level: {detail.education_level || "Not set"}</p>
                  <p>Term: {detail.academic_year_term || "Not set"}</p>
                  <p>Status: {relationshipCopy(detail.relationship_status)}</p>
                </div>

                <label className="mt-4 block">
                  <span className={internalTheme.label}>Teacher</span>
                  <select
                    className="mt-2 h-10 w-full rounded-[10px] border border-[#e0d9ce] bg-white px-3 text-[13px] text-[#3b3f6e] outline-none focus:border-[#3b3f6e]"
                    onChange={(event) => setTeacherId(event.target.value)}
                    value={teacherId}
                  >
                    <option value="">No teacher assigned</option>
                    {detail.teacher_options.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="mt-4">
                  <p className={internalTheme.label}>Students</p>
                  <div className="mt-2 space-y-1">
                    {detail.students.length ? (
                      detail.students.slice(0, 5).map((student) => (
                        <p
                          className="rounded-[9px] bg-[#f3eadc] px-3 py-2 text-[12px] text-[#3b3f6e]"
                          key={student.id}
                        >
                          {student.name}
                        </p>
                      ))
                    ) : (
                      <p className={`text-[12px] ${internalTheme.faint}`}>
                        No students linked yet.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    className="h-10 rounded-[10px] border border-[#3b3f6e] text-[13px] font-semibold text-[#3b3f6e] disabled:opacity-50"
                    disabled={saving || teacherId === (detail.teacher_id ?? "")}
                    onClick={() => patchClass({ teacher_id: teacherId || null })}
                    type="button"
                  >
                    {saving ? "Saving..." : "Save teacher"}
                  </button>
                  <button
                    className="h-10 rounded-[10px] bg-[#3b3f6e] text-[13px] font-semibold text-[#f7f1e6] disabled:opacity-50"
                    disabled={saving}
                    onClick={() => patchClass({ is_active: !detail.is_active })}
                    type="button"
                  >
                    {detail.is_active ? "Disable" : "Enable"}
                  </button>
                </div>
              </div>
            ) : (
              <p className={`text-[13px] ${internalTheme.faint}`}>
                Select a class to inspect its details.
              </p>
            )}
          </aside>
        </section>
      )}
    </div>
  );
}

function DetailMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[10px] bg-[#f3eadc] p-3">
      <p className="text-[18px] font-bold text-[#3b3f6e]">{value}</p>
      <p className={internalTheme.label}>{label}</p>
    </div>
  );
}
