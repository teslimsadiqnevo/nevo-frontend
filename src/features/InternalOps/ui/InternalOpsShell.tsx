"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NevoLogo } from "@/shared/ui/NevoLogo";
import { InternalAdminPlaceholderPanel } from "./InternalAdminPlaceholderPanel";
import {
  InternalLessonsPanel,
  InternalStudentsPanel,
  InternalTeachersPanel,
} from "./InternalAdminResourcePanels";
import { InternalAiPanel } from "./InternalAiPanel";
import { InternalClassesPanel } from "./InternalClassesPanel";
import { InternalLivePanel } from "./InternalLivePanel";
import { InternalPilotPanel } from "./InternalPilotPanel";
import { InternalProductPanel } from "./InternalProductPanel";
import { InternalSchoolsPanel } from "./InternalSchoolsPanel";
import { InternalSupportPanel } from "./InternalSupportPanel";
import { internalTheme } from "./internalOpsTheme";
import type { InternalHealth, InternalOpsTab } from "../api/types";

type OpsIconName =
  | "activity"
  | "chart"
  | "grid"
  | "spark"
  | "school"
  | "class"
  | "teacher"
  | "student"
  | "lesson"
  | "support";

const TAB_ITEMS: Array<{
  id: InternalOpsTab;
  label: string;
  icon: OpsIconName;
  group: "Monitor" | "Admin";
}> = [
  { id: "live", label: "Live", icon: "activity", group: "Monitor" },
  { id: "pilot", label: "Pilot", icon: "chart", group: "Monitor" },
  { id: "product", label: "Product", icon: "grid", group: "Monitor" },
  { id: "ai", label: "AI", icon: "spark", group: "Monitor" },
  { id: "schools", label: "Schools", icon: "school", group: "Admin" },
  { id: "classes", label: "Classes", icon: "class", group: "Admin" },
  { id: "teachers", label: "Teachers", icon: "teacher", group: "Admin" },
  { id: "students", label: "Students", icon: "student", group: "Admin" },
  { id: "lessons", label: "Lessons", icon: "lesson", group: "Admin" },
  { id: "support", label: "Support", icon: "support", group: "Admin" },
];

let foundationCache: {
  health: InternalHealth | null;
  updatedAt: number;
} | null = null;

function OpsIcon({
  name,
  className,
}: {
  name: OpsIconName | "logout";
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
  if (name === "school") {
    return (
      <svg aria-hidden="true" {...common}>
        <path
          d="M4 20V8l8-4 8 4v12M8 20v-8h8v8M6 10h12"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    );
  }
  if (name === "class") {
    return (
      <svg aria-hidden="true" {...common}>
        <path
          d="M4 5h16v12H4V5Zm4 16h8M9 9h6m-6 4h4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    );
  }
  if (name === "teacher" || name === "student") {
    return (
      <svg aria-hidden="true" {...common}>
        <path
          d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4m4-7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6.5 7c0-1.6-.8-3-2.1-3.8M17 6.3a2.5 2.5 0 0 1 0 4.4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    );
  }
  if (name === "lesson") {
    return (
      <svg aria-hidden="true" {...common}>
        <path
          d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21V5.5Zm0 0A2.5 2.5 0 0 0 7.5 8H20M9 12h7m-7 3h5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    );
  }
  if (name === "support") {
    return (
      <svg aria-hidden="true" {...common}>
        <path
          d="M14.7 6.3a4 4 0 0 0-5 5L4 17l3 3 5.7-5.7a4 4 0 0 0 5-5l-2.8 2.8-3-3 2.8-2.8Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
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

  if (activeTab === "ai") {
    return <InternalAiPanel />;
  }

  if (activeTab === "schools") {
    return <InternalSchoolsPanel />;
  }

  if (activeTab === "classes") {
    return <InternalClassesPanel />;
  }

  if (activeTab === "teachers") {
    return <InternalTeachersPanel />;
  }

  if (activeTab === "students") {
    return <InternalStudentsPanel />;
  }

  if (activeTab === "lessons") {
    return <InternalLessonsPanel />;
  }

  if (activeTab === "support") {
    return <InternalSupportPanel />;
  }

  return (
    <InternalAdminPlaceholderPanel
      section={
        activeTab as Exclude<
          InternalOpsTab,
          "live" | "pilot" | "product" | "ai"
        >
      }
    />
  );
}

function InternalNavigation({
  activeTab,
  variant,
}: {
  activeTab: InternalOpsTab;
  variant: "mobile" | "desktop";
}) {
  const activeMobileTabRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (variant !== "mobile") return;
    activeMobileTabRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeTab, variant]);

  if (variant === "mobile") {
    return (
      <nav className="fixed bottom-0 left-1/2 z-10 flex h-16 w-full max-w-[390px] -translate-x-1/2 gap-1 overflow-x-auto border-t border-[#3b3f6e22] bg-[#f7f1e6]/95 px-2 backdrop-blur md:hidden">
        {TAB_ITEMS.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <Link
              className={`flex min-w-[68px] flex-col items-center justify-center gap-1 rounded-[12px] text-[10px] font-medium transition ${
                isActive ? "text-[#3b3f6e]" : "text-[#3b3f6e66]"
              }`}
              href={`/internal/${item.id}`}
              key={item.id}
              ref={isActive ? activeMobileTabRef : undefined}
            >
              <OpsIcon className="h-5 w-5" name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="mt-8 space-y-6">
      {(["Monitor", "Admin"] as const).map((group) => (
        <div key={group}>
          <p className={internalTheme.label}>{group}</p>
          <div className="mt-2 space-y-1">
            {TAB_ITEMS.filter((item) => item.group === group).map((item) => {
              const isActive = item.id === activeTab;
              return (
                <Link
                  className={`flex h-11 items-center gap-3 rounded-[12px] px-3 text-[13px] font-semibold transition ${
                    isActive
                      ? "bg-[#3b3f6e] text-[#f7f1e6]"
                      : "text-[#3b3f6e99] hover:bg-[#f3eadc] hover:text-[#3b3f6e]"
                  }`}
                  href={`/internal/${item.id}`}
                  key={item.id}
                >
                  <OpsIcon className="h-5 w-5" name={item.icon} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function InternalOpsShell({ activeTab }: { activeTab: InternalOpsTab }) {
  const router = useRouter();
  const [health, setHealth] = useState<InternalHealth | null>(
    foundationCache?.health ?? null,
  );
  const [loading, setLoading] = useState(!foundationCache);

  useEffect(() => {
    let isActive = true;

    async function loadFoundation() {
      const shouldRefresh =
        !foundationCache || Date.now() - foundationCache.updatedAt > 60000;
      if (!shouldRefresh) return;

      const sessionResponse = await fetch("/api/internal/auth/session", {
        cache: "no-store",
      });
      if (sessionResponse.status === 401) {
        router.replace("/internal/login");
        return;
      }

      const healthResponse = await fetch("/api/internal/health", {
        cache: "no-store",
      });
      const healthData = await healthResponse.json().catch(() => ({}));

      if (!isActive) return;
      setHealth(healthResponse.ok ? healthData : null);
      foundationCache = {
        health: healthResponse.ok ? healthData : null,
        updatedAt: Date.now(),
      };
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
    <main className="min-h-dvh bg-[#f7f1e6] text-[#3b3f6e]">
      <section className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col md:max-w-6xl md:flex-row md:border-x md:border-[#e0d9ce]">
        <aside className="hidden w-[220px] shrink-0 flex-col border-r border-[#e0d9ce] bg-white/65 px-4 py-5 md:flex">
          <NevoLogo alt="Nevo" height={26} width={88} />
          <div className="mt-4 flex items-center justify-between rounded-[12px] border border-[#e0d9ce] bg-white px-3 py-2">
            <span className="flex items-center gap-2 text-[12px] font-normal text-[#7ab87a]">
              <span className="h-2 w-2 rounded-full bg-[#7ab87a]" />
              {health?.db === "down" ? "Degraded" : "Active"}
            </span>
            <span className="text-[11px] text-[#3b3f6e66]">
              {health?.environment ?? "env"}
            </span>
          </div>
          <InternalNavigation activeTab={activeTab} variant="desktop" />
          <button
            className="mt-auto flex h-11 items-center gap-3 rounded-[12px] px-3 text-[13px] font-semibold text-[#3b3f6e99] transition hover:bg-[#f3eadc] hover:text-[#3b3f6e]"
            onClick={handleLogout}
            type="button"
          >
            <OpsIcon className="h-5 w-5" name="logout" />
            Sign out
          </button>
        </aside>

        <div className="flex min-h-dvh flex-1 flex-col md:min-w-0">
          <header className="flex h-14 items-center justify-between px-4 md:hidden">
            <NevoLogo alt="Nevo" height={24} width={80} />
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-[12px] font-normal text-[#7ab87a]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#7ab87a]" />
                {health?.db === "down" ? "Degraded" : "Active"}
              </span>
              <button
                aria-label="Sign out"
                className="rounded-full p-1 text-[#3b3f6e99] transition hover:text-[#3b3f6e]"
                onClick={handleLogout}
                type="button"
              >
                <OpsIcon name="logout" />
              </button>
            </div>
          </header>

          <div className="flex items-center justify-between px-4 pb-3 pt-1 md:border-b md:border-[#e0d9ce] md:px-6 md:py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3b3f6e99]">
              Internal ops
            </p>
            <span className="rounded-full border border-[#3b3f6e22] bg-white/70 px-3 py-2 text-[12px] text-[#3b3f6e99]">
              {health?.environment ?? "env"}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 md:px-6 md:py-6">
            {loading ? (
              <div className="space-y-3 pb-24 pt-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 md:pb-0">
                <div className={`h-28 ${internalTheme.skeleton}`} />
                <div className={`h-28 ${internalTheme.skeleton}`} />
                <div
                  className={`h-16 ${internalTheme.skeleton} md:col-span-2`}
                />
              </div>
            ) : (
              <TabContent activeTab={activeTab} health={health} />
            )}
          </div>

          <InternalNavigation activeTab={activeTab} variant="mobile" />
        </div>
      </section>
    </main>
  );
}
