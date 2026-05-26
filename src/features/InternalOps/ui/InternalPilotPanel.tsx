"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  InternalObservationLog,
  InternalPilotMetrics,
  InternalPilotSchool,
} from "../api/types";

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
  const [schools, setSchools] = useState<InternalPilotSchool[]>([]);
  const [logs, setLogs] = useState<InternalObservationLog[]>([]);
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [location, setLocation] = useState<"all" | "island" | "mainland">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadMetrics() {
      try {
        const params = new URLSearchParams({
          school: selectedSchool,
          location,
        });
        const [metricsResponse, schoolsResponse, logsResponse] = await Promise.all([
          fetch(`/api/internal/pilot/metrics?${params.toString()}`, {
            cache: "no-store",
          }),
          fetch("/api/internal/pilot/schools", { cache: "no-store" }),
          fetch("/api/internal/pilot/logs", { cache: "no-store" }),
        ]);
        if (!metricsResponse.ok) {
          setError("Pilot metrics are unavailable.");
          return;
        }
        const data = await metricsResponse.json();
        const schoolsData = schoolsResponse.ok
          ? await schoolsResponse.json()
          : { schools: [] };
        const logsData = logsResponse.ok ? await logsResponse.json() : { logs: [] };
        if (!isActive) return;
        setMetrics(data);
        setSchools(schoolsData.schools ?? []);
        setLogs(logsData.logs ?? []);
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
  }, [location, selectedSchool]);

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
      <section className="rounded-[12px] bg-[#2b2b2f99] p-3">
        <div className="grid grid-cols-1 gap-2">
          <select
            aria-label="School filter"
            className="h-10 rounded-full border border-[#f7f1e633] bg-[#2b2b2fcc] px-3 text-[13px] text-[#f7f1e6] outline-none"
            onChange={(event) => setSelectedSchool(event.target.value)}
            value={selectedSchool}
          >
            <option value="all">All schools</option>
            {schools.map((school) => (
              <option key={school.school_id} value={school.school_id}>
                {school.school_name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-2">
            {[
              ["all", "All"],
              ["island", "Island"],
              ["mainland", "Mainland"],
            ].map(([value, label]) => (
              <button
                className={`h-9 rounded-full text-[12px] ${
                  location === value
                    ? "bg-[#f7f1e6] text-[#3b3f6e]"
                    : "bg-[#2b2b2fcc] text-[#f7f1e699]"
                }`}
                key={value}
                onClick={() => setLocation(value as typeof location)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-normal uppercase tracking-[0.08em] text-[#f7f1e680]">
            Completion and engagement
          </p>
          <Link
            className="rounded-full bg-[#9a9ccb33] px-3 py-1 text-[12px] text-[#f7f1e6]"
            href="/internal/log-entry"
          >
            Log today
          </Link>
        </div>
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
          Average session time
        </p>
        <p className="mt-3 text-[24px] font-bold text-[#f7f1e6]">
          {metrics.avg_session_time} mins
        </p>
        <p className="mt-1 text-[12px] text-[#f7f1e666]">
          Average across tracked lesson sessions for this filter.
        </p>
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

      <section className="rounded-[12px] bg-[#2b2b2f99] p-4">
        <p className="text-[11px] font-normal uppercase tracking-[0.08em] text-[#f7f1e680]">
          Feedback prompt response
        </p>
        <div className="mt-3 space-y-3">
          {[
            ["Accepted", metrics.feedback_prompt.accepted, "bg-[#9a9ccb]"],
            ["Dismissed", metrics.feedback_prompt.dismissed, "bg-[#f7f1e633]"],
            ["Ignored", metrics.feedback_prompt.ignored, "bg-[#2b2b2fcc]"],
          ].map(([label, value, color]) => (
            <div key={label as string}>
              <div className="mb-1 flex justify-between text-[12px] text-[#f7f1e6b3]">
                <span>{label}</span>
                <span>{value as number}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#2b2b2fcc]">
                <div
                  className={`h-2 rounded-full ${color as string}`}
                  style={{ width: `${Math.min(100, Number(value))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-normal uppercase tracking-[0.08em] text-[#f7f1e680]">
            Observation log
          </p>
          <span className="rounded-full bg-[#7ab87a22] px-3 py-1 text-[12px] text-[#7ab87a]">
            {logs.length ? `Logged ${logs[0].log_date}` : "No log yet"}
          </span>
        </div>
        <div className="space-y-2">
          {logs.length ? (
            logs.slice(0, 5).map((log) => (
              <article className="rounded-[12px] bg-[#2b2b2f99] p-4" key={log.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-[13px] font-semibold text-[#f7f1e6]">
                      {new Date(log.log_date).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      - {log.school_name}
                    </h2>
                    <p className="mt-1 text-[12px] text-[#f7f1e699]">
                      {log.class_name}
                      {log.location ? ` / ${log.location}` : ""}
                    </p>
                  </div>
                  <span className="text-[12px] text-[#f7f1e680]">
                    {log.engagement_level ?? 0}/5
                  </span>
                </div>
                {log.notable_moments ? (
                  <p className="mt-3 line-clamp-2 text-[12px] leading-5 text-[#f7f1e680]">
                    {log.notable_moments}
                  </p>
                ) : null}
              </article>
            ))
          ) : (
            <div className="rounded-[12px] bg-[#2b2b2f99] p-4 text-center text-[13px] text-[#f7f1e666]">
              No observation logs have been submitted yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
