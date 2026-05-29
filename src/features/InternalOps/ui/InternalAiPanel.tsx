"use client";

import { useEffect, useState } from "react";
import type {
  InternalAiCache,
  InternalAiCost,
  InternalAiError,
  InternalAiEsl,
  InternalAiHealth,
  InternalAiImages,
  InternalAiStats,
} from "../api/types";
import { InternalRefreshPill, internalTheme } from "./internalOpsTheme";

type AiPayload = {
  health: InternalAiHealth;
  stats: InternalAiStats;
  cache: InternalAiCache;
  esl: InternalAiEsl;
  images: InternalAiImages;
  cost: InternalAiCost;
  errors: InternalAiError[];
};

const aiCache = new Map<string, AiPayload>();

function toneClass(
  value: number,
  good: number,
  warning: number,
  inverse = false,
) {
  if (inverse) {
    if (value <= good) return "text-[#7ab87a]";
    if (value <= warning) return "text-[#e8a84a]";
    return "text-[#c0392b]";
  }
  if (value >= good) return "text-[#7ab87a]";
  if (value >= warning) return "text-[#e8a84a]";
  return "text-[#c0392b]";
}

function dotClass(status: string) {
  if (status === "ok") return "bg-[#7ab87a]";
  if (status === "down") return "bg-[#c0392b]";
  return "bg-[#e8a84a]";
}

function MiniCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <article className={internalTheme.cardCompact}>
      <p
        className={`text-[20px] font-bold leading-none ${tone ?? "text-[#3b3f6e]"}`}
      >
        {value}
      </p>
      <p className="mt-2 text-[10px] font-normal uppercase tracking-[0.08em] text-[#3b3f6e99]">
        {label}
      </p>
    </article>
  );
}

function CoverageRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12px]">
        <span className={internalTheme.muted}>{label}</span>
        <span className={toneClass(value, 90, 70)}>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-[#e8e2d4]">
        <div
          className="h-2 rounded-full bg-[#9a9ccb]"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

export function InternalAiPanel() {
  const [range, setRange] = useState<"today" | "week" | "month">("month");
  const initialPayload = aiCache.get(range);
  const [payload, setPayload] = useState<AiPayload | null>(
    initialPayload ?? null,
  );
  const [loading, setLoading] = useState(!initialPayload);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;
    const cached = aiCache.get(range);

    async function loadAiHealth() {
      if (cached) {
        setPayload(cached);
        setLoading(false);
        setRefreshing(true);
        setError("");
      } else {
        setLoading(true);
        setRefreshing(false);
      }

      try {
        const query = new URLSearchParams({ range });
        const [
          healthRes,
          statsRes,
          cacheRes,
          eslRes,
          imagesRes,
          costRes,
          errorsRes,
        ] = await Promise.all([
          fetch("/api/internal/ai/health", { cache: "no-store" }),
          fetch(`/api/internal/ai/stats?${query.toString()}`, {
            cache: "no-store",
          }),
          fetch("/api/internal/ai/cache", { cache: "no-store" }),
          fetch("/api/internal/ai/esl", { cache: "no-store" }),
          fetch("/api/internal/ai/images", { cache: "no-store" }),
          fetch(`/api/internal/ai/cost?${query.toString()}`, {
            cache: "no-store",
          }),
          fetch(`/api/internal/ai/errors?${query.toString()}`, {
            cache: "no-store",
          }),
        ]);
        if (!healthRes.ok || !statsRes.ok || !cacheRes.ok) {
          if (!cached) setError("AI performance is unavailable.");
          return;
        }
        const nextPayload: AiPayload = {
          health: await healthRes.json(),
          stats: await statsRes.json(),
          cache: await cacheRes.json(),
          esl: eslRes.ok
            ? await eslRes.json()
            : {
                esl_student_count: 0,
                esl_pct_of_total: 0,
                esl_avg_comprehension_score: null,
                standard_avg_comprehension_score: null,
              },
          images: imagesRes.ok
            ? await imagesRes.json()
            : {
                image_fetch_success_rate: 0,
                avg_fetch_time: 0,
                cache_hit_rate: 0,
              },
          cost: costRes.ok
            ? await costRes.json()
            : {
                cost_today_ngn: 0,
                cost_today_usd: 0,
                breakdown: {},
                cost_week: 0,
                cost_month: 0,
              },
          errors: errorsRes.ok ? ((await errorsRes.json()).errors ?? []) : [],
        };
        if (!isActive) return;
        aiCache.set(range, nextPayload);
        setPayload(nextPayload);
        setError("");
      } catch {
        if (isActive && !cached) setError("AI performance is unavailable.");
      } finally {
        if (isActive) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }
    loadAiHealth();
    return () => {
      isActive = false;
    };
  }, [range]);

  if (loading) {
    return (
      <div className="space-y-3 pb-24">
        <div className={`h-12 ${internalTheme.skeleton}`} />
        <div className="grid grid-cols-3 gap-2">
          <div className={`h-24 ${internalTheme.skeleton}`} />
          <div className={`h-24 ${internalTheme.skeleton}`} />
          <div className={`h-24 ${internalTheme.skeleton}`} />
        </div>
        <div className={`h-40 ${internalTheme.skeleton}`} />
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className={`${internalTheme.card} text-[13px] text-[#c0392b]`}>
        {error || "AI performance is unavailable."}
      </div>
    );
  }

  const hasCacheTelemetry =
    payload.cache.cache_hit_rate > 0 ||
    payload.cache.avg_cached_response_ms > 0 ||
    payload.cache.avg_live_response_ms > 0;

  return (
    <div className="space-y-5 pb-24">
      <section className="space-y-3">
        <div className="flex justify-end">
          <InternalRefreshPill show={refreshing} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            ["today", "Today"],
            ["week", "Week"],
            ["month", "Month"],
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

      <section
        className={`${internalTheme.card} flex items-center justify-between px-4 py-3`}
      >
        {[
          ["Gemini", payload.health.gemini],
          ["Fallback", payload.health.fallback],
          ["Cache", payload.health.cache],
        ].map(([label, status]) => (
          <div className="flex items-center gap-2" key={label}>
            <span className={`h-2 w-2 rounded-full ${dotClass(status)}`} />
            <span className={`text-[11px] ${internalTheme.muted}`}>
              {label}
            </span>
          </div>
        ))}
      </section>

      <section>
        <p className={`mb-3 ${internalTheme.label}`}>Pre-cache performance</p>
        {!hasCacheTelemetry ? (
          <p className="mb-3 rounded-[10px] bg-[#9a9ccb22] p-3 text-[12px] text-[#3b3f6e99]">
            No cache hit or miss telemetry yet. This will populate as students
            use adaptive controls.
          </p>
        ) : payload.cache.cache_hit_rate < 70 ? (
          <p className="mb-3 rounded-[10px] bg-[#e8a84a22] p-3 text-[12px] text-[#e8a84a]">
            Run pre-cache before the next session. Current cache hit telemetry
            is below pilot target.
          </p>
        ) : null}
        <div className="grid grid-cols-3 gap-2">
          <MiniCard
            label="Hit rate"
            value={`${payload.cache.cache_hit_rate}%`}
            tone={toneClass(payload.cache.cache_hit_rate, 80, 60)}
          />
          <MiniCard
            label="Cached"
            value={`${payload.cache.avg_cached_response_ms}ms`}
            tone={toneClass(
              payload.cache.avg_cached_response_ms,
              200,
              500,
              true,
            )}
          />
          <MiniCard
            label="Live API"
            value={`${(payload.cache.avg_live_response_ms / 1000).toFixed(1)}s`}
            tone={toneClass(
              payload.cache.avg_live_response_ms / 1000,
              2,
              5,
              true,
            )}
          />
        </div>
        <div className={`mt-3 space-y-3 ${internalTheme.card}`}>
          <CoverageRow
            label="Simplify coverage"
            value={payload.cache.coverage.simplify_pct}
          />
          <CoverageRow
            label="Expand coverage"
            value={payload.cache.coverage.expand_pct}
          />
          <CoverageRow
            label="Slower coverage"
            value={payload.cache.coverage.slower_pct}
          />
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <MiniCard
          label="Transform"
          value={`${payload.stats.avg_transform_time}s`}
          tone={toneClass(payload.stats.avg_transform_time, 3, 8, true)}
        />
        <MiniCard
          label="Success"
          value={`${payload.stats.batch_success_rate}%`}
          tone={toneClass(payload.stats.batch_success_rate, 95, 85)}
        />
        <MiniCard
          label="Failed"
          value={payload.stats.failed_transformations}
          tone={
            payload.stats.failed_transformations > 0
              ? "text-[#c0392b]"
              : "text-[#7ab87a]"
          }
        />
      </section>

      <section className={internalTheme.card}>
        <p className={`mb-3 ${internalTheme.label}`}>Response times</p>
        {(["simplify", "expand", "slower", "speed_up"] as const).map((key) => (
          <div
            className="flex items-center justify-between py-2 text-[13px]"
            key={key}
          >
            <span className={`capitalize ${internalTheme.muted}`}>
              {key.replace("_", " ")}
            </span>
            <span className={internalTheme.faint}>
              {payload.stats.response_times[key].avg_seconds.toFixed(2)}s
            </span>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-2">
        <MiniCard label="ESL students" value={payload.esl.esl_student_count} />
        <MiniCard
          label="ESL share"
          value={`${payload.esl.esl_pct_of_total}%`}
        />
        <MiniCard
          label="Image success"
          value={`${payload.images.image_fetch_success_rate}%`}
        />
        <MiniCard
          label="AI cost today"
          value={`NGN ${payload.cost.cost_today_ngn}`}
        />
      </section>

      <section className={internalTheme.card}>
        <p className={internalTheme.label}>AI errors</p>
        {payload.errors.length ? (
          <div className="mt-3 space-y-2">
            {payload.errors.slice(0, 4).map((item) => (
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
            No AI errors
          </p>
        )}
      </section>
    </div>
  );
}
