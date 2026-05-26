"use client";

import { useEffect, useState } from "react";
import type { InternalPilotMetrics } from "../api/types";

function metricTone(value: number, good: number, okay: number) {
  if (value >= good) return "text-[#7ab87a]";
  if (value >= okay) return "text-[#e8a84a]";
  return "text-[#c0392b]";
}

function MetricCard({
  label,
  value,
  subtext,
  className = "text-[#f7f1e6]",
}: {
  label: string;
  value: string;
  subtext?: string;
  className?: string;
}) {
  return (
    <article className="rounded-[12px] bg-[#2b2b2f99] p-4">
      <p className={`text-[28px] font-bold leading-none ${className}`}>{value}</p>
      <p className="mt-2 text-[11px] font-normal uppercase tracking-[0.08em] text-[#f7f1e680]">
        {label}
      </p>
      {subtext ? (
        <p className="mt-1 text-[12px] text-[#f7f1e666]">{subtext}</p>
      ) : null}
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-[10px] bg-[#2b2b2fcc] px-3 py-3">
      <span className="text-[12px] text-[#f7f1e680]">{label}</span>
      <span className="text-[20px] font-bold text-[#f7f1e6]">{value}</span>
    </div>
  );
}

export function InternalPilotPanel() {
  const [metrics, setMetrics] = useState<InternalPilotMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadMetrics() {
      try {
        const response = await fetch("/api/internal/pilot/metrics", {
          cache: "no-store",
        });
        if (!response.ok) {
          setError("Pilot metrics are unavailable.");
          return;
        }
        const data = await response.json();
        if (!isActive) return;
        setMetrics(data);
        setError("");
      } catch {
        if (isActive) setError("Pilot metrics are unavailable.");
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadMetrics();
    return () => {
      isActive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-3 pb-24">
        <div className="grid grid-cols-2 gap-2">
          <div className="h-28 rounded-[12px] bg-[#2b2b2f99]" />
          <div className="h-28 rounded-[12px] bg-[#2b2b2f99]" />
        </div>
        <div className="h-40 rounded-[12px] bg-[#2b2b2f99]" />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="rounded-[12px] bg-[#2b2b2f99] p-4 text-[13px] text-[#c0392b]">
        {error || "Pilot metrics are unavailable."}
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      <section>
        <p className="mb-3 text-[11px] font-normal uppercase tracking-[0.08em] text-[#f7f1e680]">
          Completion and engagement
        </p>
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label="Lessons completed"
            subtext={`${metrics.lessons_completed} of ${metrics.lessons_started} started`}
            value={String(metrics.lessons_completed)}
          />
          <MetricCard
            className={metricTone(metrics.completion_rate, 70, 50)}
            label="Completion rate"
            subtext="Target: 70%+"
            value={`${metrics.completion_rate}%`}
          />
        </div>
      </section>

      <section className="rounded-[12px] bg-[#2b2b2f99] p-4">
        <p className="text-[11px] font-normal uppercase tracking-[0.08em] text-[#f7f1e680]">
          Adaptive control usage
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MiniStat label="Simplify" value={metrics.control_usage.simplify} />
          <MiniStat label="Expand" value={metrics.control_usage.expand} />
          <MiniStat label="Slower" value={metrics.control_usage.slower} />
          <MiniStat label="TTS" value={metrics.control_usage.tts} />
        </div>
      </section>

      <section className="rounded-[12px] bg-[#2b2b2f99] p-4">
        <p className="text-[11px] font-normal uppercase tracking-[0.08em] text-[#f7f1e680]">
          Pre-cache performance
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <MetricCard
            className={metricTone(metrics.pre_cache.hit_rate, 80, 60)}
            label="Hit rate"
            value={`${metrics.pre_cache.hit_rate}%`}
          />
          <MetricCard
            label="Cached"
            value={`${metrics.pre_cache.avg_cached_ms}ms`}
          />
          <MetricCard label="Live API" value={`${metrics.pre_cache.avg_live_ms}ms`} />
        </div>
      </section>

      <section className="rounded-[12px] bg-[#2b2b2f99] p-4">
        <p className="text-[11px] font-normal uppercase tracking-[0.08em] text-[#f7f1e680]">
          Student understanding
        </p>
        <p className="mt-3 text-[28px] font-bold text-[#f7f1e6]">
          {metrics.checkpoint_accuracy === null
            ? "No data"
            : `${metrics.checkpoint_accuracy}%`}
        </p>
        <p className="mt-1 text-[12px] text-[#f7f1e666]">
          Checkpoint accuracy from logged session signals.
        </p>
        {metrics.concept_accuracy.length ? (
          <div className="mt-4 space-y-2">
            {metrics.concept_accuracy.map((concept) => (
              <div
                className="flex items-center justify-between text-[12px]"
                key={concept.concept_id}
              >
                <span className="truncate text-[#f7f1e6b3]">{concept.concept_id}</span>
                <span className="text-[#f7f1e680]">{concept.accuracy}%</span>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-[12px] bg-[#2b2b2f99] p-4">
        <p className="text-[11px] font-normal uppercase tracking-[0.08em] text-[#f7f1e680]">
          Teacher experience
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <MetricCard
            label="Upload"
            value={
              metrics.avg_upload_time === null
                ? "No data"
                : `${metrics.avg_upload_time}m`
            }
          />
          <MetricCard
            label="Ease"
            value={
              metrics.avg_ease_score === null
                ? "No data"
                : `${metrics.avg_ease_score}/5`
            }
          />
          <MetricCard
            label="Again"
            value={
              metrics.would_upload_again_pct === null
                ? "No data"
                : `${metrics.would_upload_again_pct}%`
            }
          />
        </div>
      </section>

      <section className="rounded-[12px] bg-[#2b2b2f99] p-4">
        <p className="text-[11px] font-normal uppercase tracking-[0.08em] text-[#f7f1e680]">
          ESL learner breakdown
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MetricCard
            label="ESL learners"
            value={String(metrics.esl_breakdown.esl_student_count)}
          />
          <MetricCard
            label="Standard"
            value={
              metrics.esl_breakdown.standard_avg_score === null
                ? "No data"
                : `${metrics.esl_breakdown.standard_avg_score}%`
            }
          />
        </div>
      </section>
    </div>
  );
}
