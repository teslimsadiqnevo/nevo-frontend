"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type {
  InternalHealth,
  InternalLiveSession,
  InternalLiveSignal,
} from "../api/types";

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
    <section className="fixed bottom-14 left-1/2 z-10 grid h-10 w-full max-w-[390px] -translate-x-1/2 grid-cols-4 bg-[#2b2b2fcc] px-4">
      {(["api", "db", "ai", "cache"] as const).map((key) => (
        <div className="flex items-center justify-center gap-2" key={key}>
          <span className={`h-2 w-2 rounded-full ${statusColor(health?.[key])}`} />
          <span className="text-[11px] font-normal uppercase text-[#f7f1e699]">
            {key}
          </span>
        </div>
      ))}
    </section>
  );
}

function StatPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-[#2b2b2fcc] px-3 py-2 text-[12px] font-normal text-[#f7f1e6]">
      {children}
    </span>
  );
}

export function InternalLivePanel({
  initialHealth,
}: {
  initialHealth: InternalHealth | null;
}) {
  const [session, setSession] = useState<InternalLiveSession | null>(null);
  const [signals, setSignals] = useState<InternalLiveSignal[]>([]);
  const [health, setHealth] = useState<InternalHealth | null>(initialHealth);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadLiveData() {
      try {
        const [sessionResponse, signalsResponse, healthResponse] =
          await Promise.all([
            fetch("/api/internal/live/session", { cache: "no-store" }),
            fetch("/api/internal/live/signals?limit=30", { cache: "no-store" }),
            fetch("/api/internal/live/health", { cache: "no-store" }),
          ]);

        if (!isActive) return;

        if (!sessionResponse.ok || !signalsResponse.ok) {
          setError("Live monitor is degraded.");
          return;
        }

        const sessionData = await sessionResponse.json();
        const signalsData = await signalsResponse.json();
        const healthData = healthResponse.ok ? await healthResponse.json() : null;

        setSession(sessionData);
        setSignals(signalsData.events ?? []);
        if (healthData) setHealth(healthData);
        setError("");
      } catch {
        if (isActive) setError("Live monitor is degraded.");
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadLiveData();
    const interval = window.setInterval(loadLiveData, 10000);
    return () => {
      isActive = false;
      window.clearInterval(interval);
    };
  }, []);

  const isActiveSession = Boolean(session?.active);

  return (
    <div className="space-y-5 pb-36">
      <section className="rounded-[12px] bg-[#2b2b2f99] p-4">
        <p className="text-[11px] font-normal uppercase tracking-[0.08em] text-[#f7f1e680]">
          Current session
        </p>
        {loading ? (
          <div className="mt-3 h-[118px] rounded-[10px] bg-[#2b2b2fcc]" />
        ) : isActiveSession ? (
          <div className="mt-3">
            <h2 className="text-[17px] font-bold text-[#f7f1e6]">
              {session?.school_name}
            </h2>
            {session?.school_location ? (
              <span className="mt-2 inline-flex rounded-full bg-[#9a9ccb33] px-3 py-1 text-[11px] text-[#f7f1e6]">
                {session.school_location}
              </span>
            ) : null}
            <p className="mt-2 text-[14px] text-[#f7f1e6b3]">
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
              <StatPill>{session?.stats.mins_running ?? 0} mins running</StatPill>
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-[10px] px-4 py-5 text-center text-[14px] text-[#f7f1e680]">
            No session running
          </div>
        )}
      </section>

      <section>
        <p className="mb-3 text-[11px] font-normal uppercase tracking-[0.08em] text-[#f7f1e680]">
          Live signals
        </p>
        {error ? (
          <div className="rounded-[12px] bg-[#2b2b2f99] p-4 text-[13px] leading-5 text-[#c0392b]">
            API error - {error}
          </div>
        ) : signals.length > 0 ? (
          <div className="max-h-[430px] space-y-1 overflow-y-auto rounded-[12px] bg-[#2b2b2f99] p-2">
            {signals.map((signal, index) => (
              <article
                className="grid grid-cols-[16px_1fr_auto] items-center gap-2 rounded-[8px] px-2 py-3"
                key={`${signal.timestamp}-${signal.type}-${index}`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${eventColor(signal.severity)}`}
                />
                <p className="min-w-0 text-[13px] leading-5 text-[#f7f1e6cc]">
                  {signal.description}
                </p>
                <time className="text-[11px] text-[#f7f1e666]">
                  {formatTime(signal.timestamp)}
                </time>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[12px] bg-[#2b2b2f99] p-4 text-center text-[13px] leading-5 text-[#f7f1e666]">
            No live signals yet.
          </div>
        )}
      </section>

      <HealthStrip health={health} />
    </div>
  );
}
