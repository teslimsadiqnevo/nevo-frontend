"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type {
  InternalHealth,
  InternalLiveSession,
  InternalLiveSignal,
} from "../api/types";
import { internalTheme } from "./internalOpsTheme";

let liveCache: {
  session: InternalLiveSession | null;
  signals: InternalLiveSignal[];
  health: InternalHealth | null;
} | null = null;

function statusColor(status?: string) {
  if (status === "ok") return "bg-[#7ab87a]";
  if (status === "down") return "bg-[#c0392b]";
  return "bg-[#e8a84a]";
}

function eventColor(severity?: string) {
  if (severity === "error") return "bg-[#c0392b]";
  if (severity === "warning") return "bg-[#e8a84a]";
  return "bg-[#7ab87a]";
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function HealthStrip({ health }: { health: InternalHealth | null }) {
  return (
    <section className="fixed bottom-14 left-1/2 z-10 grid h-10 w-full max-w-[390px] -translate-x-1/2 grid-cols-4 border-t border-[#e0d9ce] bg-white px-4 shadow-[0_-8px_24px_rgba(59,63,110,0.08)]">
      {(["api", "db", "ai", "cache"] as const).map((key) => (
        <div className="flex items-center justify-center gap-2" key={key}>
          <span
            className={`h-2 w-2 rounded-full ${statusColor(health?.[key])}`}
          />
          <span className="text-[11px] font-normal uppercase text-[#3b3f6e99]">
            {key}
          </span>
        </div>
      ))}
    </section>
  );
}

function StatPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-[#f3eadc] px-3 py-2 text-[12px] font-normal text-[#3b3f6e]">
      {children}
    </span>
  );
}

export function InternalLivePanel({
  initialHealth,
}: {
  initialHealth: InternalHealth | null;
}) {
  const [session, setSession] = useState<InternalLiveSession | null>(
    liveCache?.session ?? null,
  );
  const [signals, setSignals] = useState<InternalLiveSignal[]>(
    liveCache?.signals ?? [],
  );
  const [health, setHealth] = useState<InternalHealth | null>(
    liveCache?.health ?? initialHealth,
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!liveCache);

  useEffect(() => {
    let isActive = true;

    async function loadLiveData(includeSignals = false) {
      try {
        const [sessionResponse, healthResponse, signalsResponse] =
          await Promise.all([
            fetch("/api/internal/live/session", { cache: "no-store" }),
            fetch("/api/internal/live/health", { cache: "no-store" }),
            includeSignals
              ? fetch("/api/internal/live/signals?limit=30", {
                  cache: "no-store",
                })
              : Promise.resolve(null),
          ]);

        if (!isActive) return;

        if (!sessionResponse.ok) {
          setError("Live monitor is degraded.");
          return;
        }

        const sessionData = await sessionResponse.json();
        const healthData = healthResponse.ok
          ? await healthResponse.json()
          : null;
        const nextSignals = signalsResponse?.ok
          ? ((await signalsResponse.json()).events ?? [])
          : (liveCache?.signals ?? []);

        setSession(sessionData);
        if (signalsResponse?.ok) setSignals(nextSignals);
        if (healthData) setHealth(healthData);
        liveCache = {
          session: sessionData,
          signals: nextSignals,
          health: healthData ?? liveCache?.health ?? initialHealth,
        };
        setError("");
      } catch {
        if (isActive) setError("Live monitor is degraded.");
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadLiveData(true);
    const interval = window.setInterval(() => loadLiveData(false), 10000);
    const source = new EventSource("/api/internal/live/signals/stream");
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (isActive && Array.isArray(payload.events)) {
          setSignals(payload.events);
          liveCache = {
            session: liveCache?.session ?? null,
            signals: payload.events,
            health: liveCache?.health ?? initialHealth,
          };
          setError("");
        }
      } catch {
        if (isActive) setError("Live signal stream is degraded.");
      }
    };
    source.onerror = () => {
      if (isActive) setError("Live signal stream is reconnecting.");
    };
    return () => {
      isActive = false;
      window.clearInterval(interval);
      source.close();
    };
  }, [initialHealth]);

  const isActiveSession = Boolean(session?.active);

  return (
    <div className="space-y-5 pb-36">
      <section className={internalTheme.card}>
        <p className={internalTheme.label}>Current session</p>
        {loading ? (
          <div className={`mt-3 h-[118px] ${internalTheme.skeleton}`} />
        ) : isActiveSession ? (
          <div className="mt-3">
            <h2 className="text-[17px] font-bold text-[#3b3f6e]">
              {session?.school_name}
            </h2>
            {session?.school_location ? (
              <span className="mt-2 inline-flex rounded-full bg-[#9a9ccb33] px-3 py-1 text-[11px] text-[#3b3f6e]">
                {session.school_location}
              </span>
            ) : null}
            <p className={`mt-2 text-[14px] ${internalTheme.muted}`}>
              {session?.class_name ?? "Class"} -{" "}
              {session?.lesson_title ?? "Lesson"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatPill>
                {session?.stats.students_active ?? 0} students active
              </StatPill>
              <StatPill>
                {session?.stats.lessons_completed ?? 0} lessons completed
              </StatPill>
              <StatPill>
                {session?.stats.mins_running ?? 0} mins running
              </StatPill>
            </div>
          </div>
        ) : (
          <div
            className={`mt-3 rounded-[10px] px-4 py-5 text-center text-[14px] ${internalTheme.faint}`}
          >
            No session running
          </div>
        )}
      </section>

      <section>
        <p className={`mb-3 ${internalTheme.label}`}>Live signals</p>
        {error ? (
          <div
            className={`${internalTheme.card} text-[13px] leading-5 text-[#c0392b]`}
          >
            API error - {error}
          </div>
        ) : signals.length > 0 ? (
          <div className="max-h-[430px] space-y-1 overflow-y-auto rounded-[12px] border border-[#e0d9ce] bg-white p-2 shadow-sm">
            {signals.map((signal, index) => (
              <article
                className="grid grid-cols-[16px_1fr_auto] items-center gap-2 rounded-[8px] px-2 py-3"
                key={`${signal.timestamp}-${signal.type}-${index}`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${eventColor(signal.severity)}`}
                />
                <p
                  className={`min-w-0 text-[13px] leading-5 ${internalTheme.muted}`}
                >
                  {signal.description}
                </p>
                <time className={`text-[11px] ${internalTheme.faint}`}>
                  {formatTime(signal.timestamp)}
                </time>
              </article>
            ))}
          </div>
        ) : (
          <div
            className={`${internalTheme.card} text-center text-[13px] leading-5 ${internalTheme.faint}`}
          >
            No live signals yet.
          </div>
        )}
      </section>

      <HealthStrip health={health} />
    </div>
  );
}
