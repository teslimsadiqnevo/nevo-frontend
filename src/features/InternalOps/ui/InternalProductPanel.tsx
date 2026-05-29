"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  InternalConnectivityEvent,
  InternalProductError,
  InternalProductSchool,
  InternalProductStats,
} from "../api/types";
import { InternalRefreshPill, internalTheme } from "./internalOpsTheme";

type ProductCacheEntry = {
  stats: InternalProductStats;
  schools: InternalProductSchool[];
  errors: InternalProductError[];
  connectivity: InternalConnectivityEvent[];
};

const productCache = new Map<string, ProductCacheEntry>();

function ProductCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <article className={internalTheme.card}>
      <p className="text-[28px] font-bold leading-none text-[#3b3f6e]">
        {value}
      </p>
      <p className={`mt-2 ${internalTheme.label}`}>{label}</p>
    </article>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "No sessions yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No sessions yet";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function sessionLabel(range: "today" | "week" | "month" | "all") {
  if (range === "today") return "Sessions today";
  if (range === "all") return "Sessions all time";
  return `Sessions this ${range}`;
}

export function InternalProductPanel() {
  const [range, setRange] = useState<"today" | "week" | "month" | "all">(
    "today",
  );
  const initialCache = productCache.get(range);
  const [stats, setStats] = useState<InternalProductStats | null>(
    initialCache?.stats ?? null,
  );
  const [schools, setSchools] = useState<InternalProductSchool[]>(
    initialCache?.schools ?? [],
  );
  const [errors, setErrors] = useState<InternalProductError[]>(
    initialCache?.errors ?? [],
  );
  const [connectivity, setConnectivity] = useState<InternalConnectivityEvent[]>(
    initialCache?.connectivity ?? [],
  );
  const [loading, setLoading] = useState(!initialCache);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;
    const cached = productCache.get(range);

    async function loadProductHealth() {
      if (cached) {
        setStats(cached.stats);
        setSchools(cached.schools);
        setErrors(cached.errors);
        setConnectivity(cached.connectivity);
        setLoading(false);
        setRefreshing(true);
        setError("");
      } else {
        setLoading(true);
        setRefreshing(false);
      }

      try {
        const query = new URLSearchParams({ range });
        const [statsRes, schoolsRes, errorsRes, connectivityRes] =
          await Promise.all([
            fetch(`/api/internal/product/stats?${query.toString()}`, {
              cache: "no-store",
            }),
            fetch("/api/internal/product/schools", { cache: "no-store" }),
            fetch(`/api/internal/product/errors?${query.toString()}`, {
              cache: "no-store",
            }),
            fetch("/api/internal/product/connectivity", { cache: "no-store" }),
          ]);
        if (!statsRes.ok || !schoolsRes.ok) {
          if (!cached) setError("Product health is unavailable.");
          return;
        }
        const statsData = await statsRes.json();
        const schoolsData = await schoolsRes.json();
        const errorsData = errorsRes.ok
          ? await errorsRes.json()
          : { errors: [] };
        const connectivityData = connectivityRes.ok
          ? await connectivityRes.json()
          : { events: [] };
        if (!isActive) return;
        const nextPayload = {
          stats: statsData as InternalProductStats,
          schools: (schoolsData.schools ?? []) as InternalProductSchool[],
          errors: (errorsData.errors ?? []) as InternalProductError[],
          connectivity: (connectivityData.events ??
            []) as InternalConnectivityEvent[],
        };
        productCache.set(range, nextPayload);
        setStats(nextPayload.stats);
        setSchools(nextPayload.schools);
        setErrors(nextPayload.errors);
        setConnectivity(nextPayload.connectivity);
        setError("");
      } catch {
        if (isActive && !cached) setError("Product health is unavailable.");
      } finally {
        if (isActive) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }
    loadProductHealth();
    return () => {
      isActive = false;
    };
  }, [range]);

  const maxActivity = useMemo(() => {
    return Math.max(
      1,
      ...(stats?.session_activity_7d ?? []).map((item) => item.count),
    );
  }, [stats]);

  if (loading) {
    return (
      <div className="space-y-3 pb-24">
        <div className="grid grid-cols-2 gap-2">
          <div className={`h-28 ${internalTheme.skeleton}`} />
          <div className={`h-28 ${internalTheme.skeleton}`} />
          <div className={`h-28 ${internalTheme.skeleton}`} />
          <div className={`h-28 ${internalTheme.skeleton}`} />
        </div>
        <div className={`h-40 ${internalTheme.skeleton}`} />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={`${internalTheme.card} text-[13px] text-[#c0392b]`}>
        {error || "Product health is unavailable."}
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      <section className="space-y-3">
        <div className="flex justify-end">
          <InternalRefreshPill show={refreshing} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            ["today", "Today"],
            ["week", "Week"],
            ["month", "Month"],
            ["all", "All"],
          ].map(([value, label]) => (
            <button
              className={`h-9 rounded-full text-[12px] ${
                range === value
                  ? internalTheme.pillActive
                  : internalTheme.pillInactive
              }`}
              key={value}
              onClick={() => setRange(value as typeof range)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2">
        <ProductCard label="Active schools" value={stats.active_schools} />
        <ProductCard label="Active students" value={stats.active_students} />
        <ProductCard label={sessionLabel(range)} value={stats.sessions_today} />
        <ProductCard
          label="Lessons published"
          value={stats.lessons_published}
        />
      </section>

      <section className={internalTheme.card}>
        <p className={internalTheme.label}>Session activity</p>
        <div className="mt-4 flex h-32 items-end gap-2">
          {stats.session_activity_7d.map((item) => (
            <div
              className="flex flex-1 flex-col items-center gap-2"
              key={item.date}
            >
              <div
                className="w-full rounded-t-[8px] bg-[#9a9ccb]"
                style={{
                  height: `${Math.max(8, (item.count / maxActivity) * 96)}px`,
                }}
                title={`${item.count} sessions`}
              />
              <span className={`text-[10px] ${internalTheme.faint}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className={`mb-3 ${internalTheme.label}`}>Pilot schools</p>
        <div className="space-y-2">
          {schools.length ? (
            schools.slice(0, 6).map((school) => (
              <article className={internalTheme.card} key={school.school_id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[14px] font-semibold text-[#3b3f6e]">
                      {school.school_name}
                    </h2>
                    <p className={`mt-1 text-[12px] ${internalTheme.muted}`}>
                      {school.active_students} students / {school.teacher_count}{" "}
                      teachers / {school.class_count} classes
                    </p>
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-[#7ab87a]" />
                </div>
                <p className={`mt-3 text-[12px] ${internalTheme.faint}`}>
                  Last session: {formatDate(school.last_session_date)}
                </p>
              </article>
            ))
          ) : (
            <div
              className={`${internalTheme.card} text-center text-[13px] ${internalTheme.faint}`}
            >
              No pilot schools found.
            </div>
          )}
        </div>
      </section>

      <section className={internalTheme.card}>
        <p className={internalTheme.label}>Errors</p>
        {errors.length ? (
          <div className="mt-3 space-y-2">
            {errors.slice(0, 4).map((item) => (
              <div
                className="flex items-center gap-2 text-[12px]"
                key={`${item.type}-${item.timestamp}`}
              >
                <span className="h-2 w-2 rounded-full bg-[#c0392b]" />
                <span
                  className={`min-w-0 flex-1 truncate ${internalTheme.muted}`}
                >
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-center text-[13px] text-[#7ab87a]">
            No errors in this range
          </p>
        )}
      </section>

      <section className={internalTheme.card}>
        <p className={internalTheme.label}>Connectivity</p>
        {connectivity.length ? (
          <div className="mt-3 space-y-2">
            {connectivity.slice(0, 4).map((item) => (
              <p
                className={`text-[12px] ${internalTheme.muted}`}
                key={item.timestamp}
              >
                {item.sessions_affected} sessions affected for{" "}
                {item.duration_seconds}s
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-center text-[13px] text-[#7ab87a]">
            Stable connection throughout
          </p>
        )}
      </section>
    </div>
  );
}
