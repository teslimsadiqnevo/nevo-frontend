"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  InternalAuditEvent,
  InternalSupportAction,
  InternalSupportActionResult,
  InternalSupportOverview,
} from "../api/types";
import {
  InternalEmptyState,
  InternalPageHeader,
  InternalStatCard,
} from "./InternalOpsPrimitives";
import { InternalRefreshPill, internalTheme } from "./internalOpsTheme";

type SupportCache = {
  overview: InternalSupportOverview | null;
  actions: InternalSupportAction[];
  audit: InternalAuditEvent[];
  updatedAt: number;
};

let supportCache: SupportCache | null = null;

const EMPTY_OVERVIEW: InternalSupportOverview = {
  issues: [],
  last_event_at: null,
};

function severityClass(severity: string) {
  if (severity === "ok") return "bg-[#d4edda] text-[#2f7d32]";
  if (severity === "error") return "bg-[#f4d6d2] text-[#c0392b]";
  if (severity === "warning") return "bg-[#fff3cd] text-[#a66a00]";
  return "bg-[#e8e7f5] text-[#3b3f6e]";
}

function dotClass(severity: string) {
  if (severity === "ok") return "bg-[#7ab87a]";
  if (severity === "error") return "bg-[#c0392b]";
  if (severity === "warning") return "bg-[#e8a84a]";
  return "bg-[#9a9ccb]";
}

async function readJson<T>(response: Response, fallback: T): Promise<T> {
  if (!response.ok) return fallback;
  return (await response.json().catch(() => fallback)) as T;
}

function formatTime(value?: string | null) {
  if (!value) return "No events yet";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function resultPreview(result: InternalSupportActionResult | null) {
  if (!result) return null;
  const detailRows = Object.entries(result.details).slice(0, 4);

  return (
    <article className={`${internalTheme.card} border-[#9a9ccb66]`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={internalTheme.label}>
            {result.dry_run ? "Preview result" : "Action result"}
          </p>
          <h3 className="mt-1 text-[15px] font-semibold text-[#3b3f6e]">
            {result.summary}
          </h3>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${severityClass(result.status === "ok" ? "ok" : "warning")}`}>
          {result.affected_count} affected
        </span>
      </div>
      {detailRows.length ? (
        <div className="mt-3 space-y-2">
          {detailRows.map(([key, value]) => (
            <p
              className="rounded-[10px] bg-[#f3eadc] px-3 py-2 text-[12px] text-[#3b3f6e]"
              key={key}
            >
              <span className="font-semibold">{key}: </span>
              {JSON.stringify(value).slice(0, 180)}
            </p>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function SupportActionCard({
  action,
  onRun,
  running,
}: {
  action: InternalSupportAction;
  onRun: (payload: {
    action: string;
    dry_run: boolean;
    target_id?: string;
    target_type?: string | null;
  }) => void;
  running: boolean;
}) {
  const [targetId, setTargetId] = useState("");
  const canExecute = action.supports_execute && (!action.requires_target || targetId.trim());

  return (
    <article className={internalTheme.card}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold text-[#3b3f6e]">
            {action.label}
          </h3>
          <p className={`mt-1 text-[12px] leading-5 ${internalTheme.muted}`}>
            {action.description}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${severityClass(action.severity)}`}>
          {action.severity}
        </span>
      </div>

      {action.requires_target ? (
        <label className="mt-3 block">
          <span className={internalTheme.label}>
            {action.target_type || "Target"} id
          </span>
          <input
            className="mt-2 h-10 w-full rounded-[10px] border border-[#e0d9ce] bg-white px-3 text-[13px] text-[#3b3f6e] outline-none placeholder:text-[#2b2b2f66] focus:border-[#3b3f6e]"
            onChange={(event) => setTargetId(event.target.value)}
            placeholder="Paste id from Students panel"
            value={targetId}
          />
        </label>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          className="h-10 rounded-[10px] border border-[#3b3f6e] text-[13px] font-semibold text-[#3b3f6e] disabled:opacity-50"
          disabled={running}
          onClick={() =>
            onRun({
              action: action.key,
              dry_run: true,
              target_id: targetId.trim() || undefined,
              target_type: action.target_type,
            })
          }
          type="button"
        >
          Preview
        </button>
        <button
          className="h-10 rounded-[10px] bg-[#3b3f6e] text-[13px] font-semibold text-[#f7f1e6] disabled:bg-[#b8b4ad]"
          disabled={running || !canExecute}
          onClick={() =>
            onRun({
              action: action.key,
              dry_run: false,
              target_id: targetId.trim() || undefined,
              target_type: action.target_type,
            })
          }
          type="button"
        >
          {running ? "Working..." : "Run"}
        </button>
      </div>
    </article>
  );
}

function AuditList({ events }: { events: InternalAuditEvent[] }) {
  if (!events.length) {
    return (
      <InternalEmptyState
        description="Support actions and internal admin changes will appear here."
        title="No audit events yet"
      />
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <article className={internalTheme.cardCompact} key={event.id}>
          <div className="flex items-start gap-3">
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dotClass(event.severity)}`} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[#3b3f6e]">
                {event.description}
              </p>
              <p className={`mt-1 text-[11px] ${internalTheme.faint}`}>
                {event.event_type} - {formatTime(event.occurred_at)}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function InternalSupportPanel() {
  const initial = supportCache;
  const [overview, setOverview] = useState<InternalSupportOverview>(
    initial?.overview ?? EMPTY_OVERVIEW,
  );
  const [actions, setActions] = useState<InternalSupportAction[]>(
    initial?.actions ?? [],
  );
  const [audit, setAudit] = useState<InternalAuditEvent[]>(initial?.audit ?? []);
  const [loading, setLoading] = useState(!initial);
  const [refreshing, setRefreshing] = useState(false);
  const [runningAction, setRunningAction] = useState("");
  const [result, setResult] = useState<InternalSupportActionResult | null>(null);
  const [error, setError] = useState("");

  const issueTotal = useMemo(
    () => overview.issues.reduce((total, issue) => total + issue.count, 0),
    [overview.issues],
  );
  const warningTotal = useMemo(
    () =>
      overview.issues
        .filter((issue) => issue.severity === "warning" || issue.severity === "error")
        .reduce((total, issue) => total + issue.count, 0),
    [overview.issues],
  );

  const loadSupport = useCallback(async ({ background = false } = {}) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    try {
      const [overviewResponse, actionsResponse, auditResponse] = await Promise.all([
        fetch("/api/internal/admin/support/overview", { cache: "no-store" }),
        fetch("/api/internal/admin/support/actions", { cache: "no-store" }),
        fetch("/api/internal/admin/support/audit?limit=30", { cache: "no-store" }),
      ]);
      const nextOverview = await readJson<InternalSupportOverview>(
        overviewResponse,
        EMPTY_OVERVIEW,
      );
      const actionsData = await readJson<{ actions: InternalSupportAction[] }>(
        actionsResponse,
        { actions: [] },
      );
      const auditData = await readJson<{ events: InternalAuditEvent[] }>(
        auditResponse,
        { events: [] },
      );
      setOverview(nextOverview);
      setActions(actionsData.actions);
      setAudit(auditData.events);
      setError(
        overviewResponse.ok && actionsResponse.ok && auditResponse.ok
          ? ""
          : "Some support data could not be loaded.",
      );
      supportCache = {
        overview: nextOverview,
        actions: actionsData.actions,
        audit: auditData.events,
        updatedAt: Date.now(),
      };
    } catch {
      if (!supportCache) setError("Support data could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const stale = !supportCache || Date.now() - supportCache.updatedAt > 60000;
    if (stale) {
      loadSupport({ background: Boolean(supportCache) });
    }
  }, [loadSupport]);

  async function runAction(payload: {
    action: string;
    dry_run: boolean;
    target_id?: string;
    target_type?: string | null;
  }) {
    setRunningAction(payload.action);
    setError("");
    try {
      const response = await fetch("/api/internal/admin/support/actions/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await readJson<InternalSupportActionResult | null>(response, null);
      if (!response.ok || !data) {
        setError("Support action failed.");
        return;
      }
      setResult(data);
      await loadSupport({ background: true });
    } finally {
      setRunningAction("");
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 pb-24 md:grid md:grid-cols-3 md:gap-3 md:space-y-0 md:pb-0">
        <div className={`h-28 ${internalTheme.skeleton}`} />
        <div className={`h-28 ${internalTheme.skeleton}`} />
        <div className={`h-28 ${internalTheme.skeleton}`} />
        <div className={`h-48 ${internalTheme.skeleton} md:col-span-2`} />
        <div className={`h-48 ${internalTheme.skeleton}`} />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 md:pb-0">
      <InternalPageHeader
        action={<InternalRefreshPill show={refreshing} />}
        description="Run safe diagnostics, repair known operational drift, and see what changed."
        title="Support center"
      />
      {error ? (
        <p className="rounded-[10px] bg-[#f4d6d2] px-3 py-2 text-[12px] text-[#c0392b]">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <InternalStatCard
          helper="Across schools, classes, students, lessons, and AI jobs"
          label="Open checks"
          value={issueTotal}
        />
        <InternalStatCard
          helper="Warnings and errors that may need action"
          label="Needs attention"
          value={warningTotal}
        />
        <InternalStatCard
          helper={formatTime(overview.last_event_at)}
          label="Last ops event"
          value={audit.length}
        />
      </div>

      <section>
        <p className={internalTheme.label}>Current support checks</p>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {overview.issues.map((issue) => (
            <article className={internalTheme.cardCompact} key={issue.key}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[13px] font-semibold text-[#3b3f6e]">
                    {issue.label}
                  </h3>
                  <p className={`mt-1 text-[12px] leading-5 ${internalTheme.muted}`}>
                    {issue.description}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${severityClass(issue.severity)}`}>
                  {issue.count}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {resultPreview(result)}

      <section>
        <p className={internalTheme.label}>Fix-it actions</p>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          {actions.map((action) => (
            <SupportActionCard
              action={action}
              key={action.key}
              onRun={runAction}
              running={runningAction === action.key}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-[1fr_1fr]">
        <div>
          <p className={internalTheme.label}>Audit trail</p>
          <div className="mt-2">
            <AuditList events={audit} />
          </div>
        </div>
        <article className={internalTheme.card}>
          <p className={internalTheme.label}>Safety rules</p>
          <ul className="mt-3 space-y-2 text-[12px] leading-5 text-[#2b2b2f99]">
            <li>Preview first whenever an action could mutate data.</li>
            <li>Execute actions are intentionally narrow and audited.</li>
            <li>Use resource panels to inspect records before changing them.</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
