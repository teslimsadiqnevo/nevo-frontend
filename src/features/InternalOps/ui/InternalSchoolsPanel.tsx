"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type {
  InternalAdminSchoolDetail,
  InternalAdminSchoolSummary,
} from "../api/types";
import {
  InternalEmptyState,
  InternalPageHeader,
  InternalSearchInput,
  InternalStatCard,
} from "./InternalOpsPrimitives";
import { InternalRefreshPill, internalTheme } from "./internalOpsTheme";

type SchoolListCache = {
  schools: InternalAdminSchoolSummary[];
  updatedAt: number;
};

const schoolListCache = new Map<string, SchoolListCache>();
const schoolDetailCache = new Map<string, InternalAdminSchoolDetail>();

function relationshipCopy(status: string) {
  if (status === "no_classes") return "No classes";
  if (status === "no_teachers") return "No teachers";
  return "Healthy";
}

function relationshipColor(status: string) {
  if (status === "ok") return "bg-[#7ab87a]";
  if (status === "no_classes" || status === "no_teachers") return "bg-[#e8a84a]";
  return "bg-[#c0392b]";
}

function formatDate(value?: string | null) {
  if (!value) return "No sessions yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No sessions yet";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

async function readJson<T>(response: Response, fallback: T): Promise<T> {
  if (!response.ok) return fallback;
  return (await response.json().catch(() => fallback)) as T;
}

export function InternalSchoolsPanel() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const cacheKey = deferredSearch.toLowerCase();
  const initialCache = schoolListCache.get(cacheKey);
  const [schools, setSchools] = useState<InternalAdminSchoolSummary[]>(
    initialCache?.schools ?? [],
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    initialCache?.schools[0]?.school_id ?? null,
  );
  const [detail, setDetail] = useState<InternalAdminSchoolDetail | null>(
    selectedId ? (schoolDetailCache.get(selectedId) ?? null) : null,
  );
  const [loading, setLoading] = useState(!initialCache);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;
    const cached = schoolListCache.get(cacheKey);

    async function loadSchools() {
      if (cached) {
        setSchools(cached.schools);
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
          limit: "80",
        });
        const response = await fetch(
          `/api/internal/admin/schools?${query.toString()}`,
          { cache: "no-store" },
        );
        const data = await readJson<{ schools?: InternalAdminSchoolSummary[] }>(
          response,
          { schools: [] },
        );
        if (!isActive) return;
        const nextSchools = data.schools ?? [];
        schoolListCache.set(cacheKey, {
          schools: nextSchools,
          updatedAt: Date.now(),
        });
        setSchools(nextSchools);
        setSelectedId((current) => {
          if (current && nextSchools.some((school) => school.school_id === current)) {
            return current;
          }
          return nextSchools[0]?.school_id ?? null;
        });
        setError(response.ok ? "" : "Schools could not be loaded.");
      } catch {
        if (isActive && !cached) setError("Schools could not be loaded.");
      } finally {
        if (isActive) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadSchools();
    return () => {
      isActive = false;
    };
  }, [cacheKey, deferredSearch]);

  useEffect(() => {
    let isActive = true;
    if (!selectedId) {
      setDetail(null);
      return;
    }

    const detailId = selectedId;
    const cached = schoolDetailCache.get(detailId);
    if (cached) {
      setDetail(cached);
      setDetailLoading(false);
    } else {
      setDetail(null);
      setDetailLoading(true);
    }

    async function loadDetail() {
      try {
        const response = await fetch(`/api/internal/admin/schools/${detailId}`, {
          cache: "no-store",
        });
        const data = await readJson<InternalAdminSchoolDetail | null>(
          response,
          null,
        );
        if (!isActive || !data) return;
        schoolDetailCache.set(detailId, data);
        setDetail(data);
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
    const active = schools.filter((school) => school.is_active).length;
    const needsReview = schools.filter(
      (school) => school.relationship_status !== "ok",
    ).length;
    const students = schools.reduce(
      (total, school) => total + school.active_students,
      0,
    );
    const classes = schools.reduce((total, school) => total + school.class_count, 0);
    return { active, needsReview, students, classes };
  }, [schools]);

  async function patchSchool(payload: Record<string, unknown>) {
    if (!selectedId) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/internal/admin/schools/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await readJson<InternalAdminSchoolDetail | null>(
        response,
        null,
      );
      if (!response.ok || !data) {
        setError("School update failed.");
        return;
      }
      schoolDetailCache.set(selectedId, data);
      setDetail(data);
      setSchools((current) =>
        current.map((school) =>
          school.school_id === data.school_id ? { ...school, ...data } : school,
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
        title="Schools"
        description="Search real school records, inspect relationships, and make safe status updates."
        action={<InternalRefreshPill show={refreshing} />}
      />

      <InternalSearchInput
        onChange={setSearch}
        placeholder="Search schools..."
        value={search}
      />

      {error ? (
        <div className={`${internalTheme.card} text-[13px] text-[#c0392b]`}>
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <InternalStatCard label="Active schools" value={stats.active} />
        <InternalStatCard label="Needs review" value={stats.needsReview} />
        <InternalStatCard label="Students" value={stats.students} />
        <InternalStatCard label="Classes" value={stats.classes} />
      </section>

      {!schools.length ? (
        <InternalEmptyState
          title="No schools found"
          description="Try another search term or clear the filter to see all internal school records."
        />
      ) : (
        <section className="grid gap-3 md:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-2">
            {schools.map((school) => {
              const active = selectedId === school.school_id;
              return (
                <button
                  className={`w-full rounded-[12px] border bg-white p-4 text-left shadow-sm transition ${
                    active
                      ? "border-[#3b3f6e]"
                      : "border-[#e0d9ce] hover:border-[#9a9ccb]"
                  }`}
                  key={school.school_id}
                  onClick={() => setSelectedId(school.school_id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[14px] font-semibold text-[#3b3f6e]">
                        {school.school_name}
                      </h3>
                      <p className={`mt-1 text-[12px] ${internalTheme.faint}`}>
                        {school.location || "No location"} -{" "}
                        {school.active_students} students
                      </p>
                    </div>
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${relationshipColor(
                        school.relationship_status,
                      )}`}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[12px] text-[#2b2b2f99]">
                    <span>{school.class_count} classes</span>
                    <span>{school.teacher_count} teachers</span>
                    <span>{school.lesson_count} lessons</span>
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
                      {detail.school_name}
                    </h3>
                    <p className={`mt-1 text-[12px] ${internalTheme.faint}`}>
                      {detail.address || detail.location || "No address saved"}
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
                  <DetailMetric label="Students" value={detail.active_students} />
                  <DetailMetric label="Teachers" value={detail.teacher_count} />
                  <DetailMetric label="Classes" value={detail.class_count} />
                  <DetailMetric label="Lessons" value={detail.lesson_count} />
                </div>

                <div className="mt-4 space-y-2 text-[12px] text-[#2b2b2f99]">
                  <p>Email: {detail.email || "Not set"}</p>
                  <p>Phone: {detail.phone_number || "Not set"}</p>
                  <p>Last session: {formatDate(detail.last_session_date)}</p>
                  <p>Status: {relationshipCopy(detail.relationship_status)}</p>
                </div>

                <div className="mt-4">
                  <p className={internalTheme.label}>Teachers</p>
                  <div className="mt-2 space-y-1">
                    {detail.teachers.length ? (
                      detail.teachers.slice(0, 4).map((teacher) => (
                        <p
                          className="rounded-[9px] bg-[#f3eadc] px-3 py-2 text-[12px] text-[#3b3f6e]"
                          key={teacher.id}
                        >
                          {teacher.name}
                        </p>
                      ))
                    ) : (
                      <p className={`text-[12px] ${internalTheme.faint}`}>
                        No teachers linked yet.
                      </p>
                    )}
                  </div>
                </div>

                <button
                  className="mt-4 h-10 w-full rounded-[10px] bg-[#3b3f6e] text-[13px] font-semibold text-[#f7f1e6] disabled:opacity-50"
                  disabled={saving}
                  onClick={() => patchSchool({ is_active: !detail.is_active })}
                  type="button"
                >
                  {saving
                    ? "Saving..."
                    : detail.is_active
                      ? "Mark inactive"
                      : "Reactivate school"}
                </button>
              </div>
            ) : (
              <p className={`text-[13px] ${internalTheme.faint}`}>
                Select a school to inspect its details.
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
