"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { NevoLogo } from "@/shared/ui/NevoLogo";
import { InternalLivePanel } from "./InternalLivePanel";
import { InternalPilotPanel } from "./InternalPilotPanel";
import { InternalProductPanel } from "./InternalProductPanel";
import type {
  InternalHealth,
  InternalOpsTab,
  InternalOpsUser,
} from "../api/types";

const TAB_ITEMS: Array<{
  id: InternalOpsTab;
  label: string;
  icon: "activity" | "chart" | "grid" | "spark";
}> = [
  { id: "live", label: "Live", icon: "activity" },
  { id: "pilot", label: "Pilot", icon: "chart" },
  { id: "product", label: "Product", icon: "grid" },
  { id: "ai", label: "AI", icon: "spark" },
];

function OpsIcon({
  name,
  className,
}: {
  name: (typeof TAB_ITEMS)[number]["icon"] | "logout";
  className?: string;
}) {
  const common = {
    className,
    fill: "none",
    height: "20",
    viewBox: "0 0 24 24",
    width: "20",
  };

  if (name === "activity") {
    return (
      <svg aria-hidden="true" {...common}>
        <path
          d="M3 12h4l2.5-6 5 12L17 12h4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }
  if (name === "chart") {
    return (
      <svg aria-hidden="true" {...common}>
        <path
          d="M5 20V9m7 11V4m7 16v-7"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }
  if (name === "grid") {
    return (
      <svg aria-hidden="true" {...common}>
        <path
          d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
      </svg>
    );
  }
  if (name === "logout") {
    return (
      <svg aria-hidden="true" {...common}>
        <path
          d="M10 6H6v12h4m4-9 3 3-3 3m-7-3h10"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" {...common}>
      <path
        d="m12 3 1.9 5.4L19 10.3l-5.1 1.9L12 18l-1.9-5.8L5 10.3l5.1-1.9L12 3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function statusColor(status?: string) {
  if (status === "ok") return "bg-[#7ab87a]";
  if (status === "down") return "bg-[#c0392b]";
  return "bg-[#e8a84a]";
}

function FoundationMetric({
  label,
  status,
}: {
  label: string;
  status?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-full bg-[#2b2b2fcc] px-3 py-2">
      <span className={`h-2 w-2 shrink-0 rounded-full ${statusColor(status)}`} />
      <span className="truncate text-[11px] font-normal uppercase text-[#f7f1e699]">
        {label}
      </span>
    </div>
  );
}

function PlaceholderCard({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-[12px] bg-[#2b2b2f99] p-4">
      <p className="text-[11px] font-normal uppercase tracking-[0.08em] text-[#f7f1e680]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-[17px] font-bold text-[#f7f1e6]">{title}</h2>
      <p className="mt-2 text-[13px] font-normal leading-5 text-[#f7f1e6b3]">
        {body}
      </p>
    </article>
  );
}

function TabContent({
  activeTab,
  health,
}: {
  activeTab: InternalOpsTab;
  health: InternalHealth | null;
}) {
  if (activeTab === "live") {
    return <InternalLivePanel initialHealth={health} />;
  }

  if (activeTab === "pilot") {
    return <InternalPilotPanel />;
  }

  if (activeTab === "product") {
    return <InternalProductPanel />;
  }

  return (
    <div className="space-y-5 pb-24">
      <section className="grid grid-cols-3 gap-2">
        <FoundationMetric label="Gemini" status={health?.ai} />
        <FoundationMetric label="Fallback" status={health?.ai} />
        <FoundationMetric label="Cache" status={health?.cache} />
      </section>
      <PlaceholderCard
        body="No AI performance metrics are connected yet. Batch 9 will add pre-cache hit rate, response times, ESL modifier performance, image fetch stats, cost, and AI errors."
        eyebrow="Pre-cache performance"
        title="Waiting for cache metrics"
      />
      <PlaceholderCard
        body="The DB currently has adapted lessons and transform logs, but no live session signals yet. That is why this screen stays in foundation mode for Batch 1."
        eyebrow="AI reality check"
        title="Foundation ready"
      />
    </div>
  );
}

export function InternalOpsShell({ activeTab }: { activeTab: InternalOpsTab }) {
  const router = useRouter();
  const [user, setUser] = useState<InternalOpsUser | null>(null);
  const [health, setHealth] = useState<InternalHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const activeLabel = useMemo(
    () => TAB_ITEMS.find((item) => item.id === activeTab)?.label ?? "Live",
    [activeTab],
  );

  useEffect(() => {
    let isActive = true;

    async function loadFoundation() {
      const sessionResponse = await fetch("/api/internal/auth/session", {
        cache: "no-store",
      });
      if (sessionResponse.status === 401) {
        router.replace("/internal/login");
        return;
      }

      const sessionData = await sessionResponse.json().catch(() => ({}));
      const healthResponse = await fetch("/api/internal/health", {
        cache: "no-store",
      });
      const healthData = await healthResponse.json().catch(() => ({}));

      if (!isActive) return;
      setUser(sessionData.user ?? null);
      setHealth(healthResponse.ok ? healthData : null);
      setLoading(false);
    }

    loadFoundation().catch(() => {
      if (!isActive) return;
      setLoading(false);
    });

    return () => {
      isActive = false;
    };
  }, [router]);

  async function handleLogout() {
    await fetch("/api/internal/auth/logout", { method: "POST" });
    router.replace("/internal/login");
    router.refresh();
  }

  return (
    <main className="min-h-dvh bg-[#3b3f6e] text-[#f7f1e6]">
      <section className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col">
        <header className="flex h-14 items-center justify-between px-4">
          <h1 className="text-[18px] font-bold">{activeLabel}</h1>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-[12px] font-normal text-[#7ab87a]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#7ab87a]" />
              {health?.db === "down" ? "Degraded" : "Active"}
            </span>
            <button
              aria-label="Sign out"
              className="rounded-full p-1 text-[#f7f1e680] transition hover:text-[#f7f1e6]"
              onClick={handleLogout}
              type="button"
            >
              <OpsIcon name="logout" />
            </button>
          </div>
        </header>

        <div className="flex items-center justify-between px-4 pb-4">
          <div>
            <NevoLogo alt="Nevo" height={24} variant="light" width={80} />
            <p className="mt-2 text-[12px] text-[#f7f1e680]">
              {user ? `${user.name} - ${user.role}` : "Internal Dashboard"}
            </p>
          </div>
          <span className="rounded-full bg-[#2b2b2f99] px-3 py-2 text-[12px] text-[#f7f1e699]">
            {health?.environment ?? "env"}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {loading ? (
            <div className="space-y-3 pb-24 pt-2">
              <div className="h-28 rounded-[12px] bg-[#2b2b2f99]" />
              <div className="h-16 rounded-[12px] bg-[#2b2b2f99]" />
              <div className="h-16 rounded-[12px] bg-[#2b2b2f99]" />
            </div>
          ) : (
            <TabContent activeTab={activeTab} health={health} />
          )}
        </div>

        <nav className="fixed bottom-0 left-1/2 z-10 grid h-14 w-full max-w-[390px] -translate-x-1/2 grid-cols-4 border-t border-[#f7f1e633] bg-[#3b3f6e]">
          {TAB_ITEMS.map((item) => {
            const isActive = item.id === activeTab;
            return (
              <Link
                className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
                  isActive ? "text-[#f7f1e6]" : "text-[#f7f1e666]"
                }`}
                href={`/internal/${item.id}`}
                key={item.id}
              >
                <OpsIcon className="h-5 w-5" name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </section>
    </main>
  );
}
