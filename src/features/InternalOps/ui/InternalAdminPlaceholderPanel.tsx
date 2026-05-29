"use client";

import type { InternalOpsTab } from "../api/types";
import {
  InternalEmptyState,
  InternalListCard,
  InternalPageHeader,
  InternalSearchInput,
  InternalStatCard,
} from "./InternalOpsPrimitives";
import { internalTheme } from "./internalOpsTheme";

const ADMIN_SECTIONS: Record<
  Exclude<InternalOpsTab, "live" | "pilot" | "product" | "ai">,
  {
    title: string;
    description: string;
    search: string;
    stats: Array<{ label: string; value: string; helper: string }>;
    nextItems: Array<{ title: string; meta: string }>;
  }
> = {
  schools: {
    title: "Schools",
    description:
      "Check school records, pilot status, classes, teachers, students, and activity.",
    search: "Search schools...",
    stats: [
      {
        label: "Active schools",
        value: "Soon",
        helper: "Batch 2 connects live data",
      },
      {
        label: "Needs review",
        value: "Soon",
        helper: "Status and relationship checks",
      },
    ],
    nextItems: [
      {
        title: "School directory",
        meta: "List, search, detail, edit, deactivate",
      },
      {
        title: "School health",
        meta: "Classes, teachers, students, lessons, last activity",
      },
    ],
  },
  classes: {
    title: "Classes",
    description:
      "Inspect class records and verify teacher/student relationships without opening the DB.",
    search: "Search classes...",
    stats: [
      {
        label: "Tracked classes",
        value: "Soon",
        helper: "Batch 3 connects live data",
      },
      {
        label: "Relationship issues",
        value: "Soon",
        helper: "Teacher-class visibility checks",
      },
    ],
    nextItems: [
      {
        title: "Class directory",
        meta: "School, teachers, students, assignments",
      },
      {
        title: "Relationship debugger",
        meta: "Class ID, school ID, teacher IDs, student count",
      },
    ],
  },
  teachers: {
    title: "Teachers",
    description:
      "Manage teacher profiles, class assignments, uploaded lessons, and access status.",
    search: "Search teachers...",
    stats: [
      {
        label: "Active teachers",
        value: "Soon",
        helper: "Batch 4 connects live data",
      },
      {
        label: "Unassigned",
        value: "Soon",
        helper: "Teachers missing classes or school links",
      },
    ],
    nextItems: [
      {
        title: "Teacher directory",
        meta: "Profile, school, classes, lessons, activity",
      },
      {
        title: "Assignment tools",
        meta: "Assign or remove teachers from classes safely",
      },
    ],
  },
  students: {
    title: "Students",
    description:
      "Inspect student profiles, class placement, lesson progress, and learning flags.",
    search: "Search students...",
    stats: [
      {
        label: "Active students",
        value: "Soon",
        helper: "Batch 5 connects live data",
      },
      {
        label: "ESL learners",
        value: "Soon",
        helper: "Language access and support flags",
      },
    ],
    nextItems: [
      {
        title: "Student directory",
        meta: "Profile, class, lessons, checkpoints, concepts",
      },
      {
        title: "Student support",
        meta: "Move class, toggle ESL, deactivate or reactivate",
      },
    ],
  },
  lessons: {
    title: "Lessons",
    description:
      "Review uploaded lessons, generated packages, assignments, AI jobs, and cache status.",
    search: "Search lessons...",
    stats: [
      {
        label: "Uploaded lessons",
        value: "Soon",
        helper: "Batch 6 connects live data",
      },
      {
        label: "Needs action",
        value: "Soon",
        helper: "Failed, stuck, or uncached packages",
      },
    ],
    nextItems: [
      {
        title: "Lesson directory",
        meta: "Teacher, school, subject, status, package health",
      },
      {
        title: "Lesson operations",
        meta: "Retry transform, rebuild package, re-run pre-cache",
      },
    ],
  },
  support: {
    title: "Support",
    description:
      "Run safe fix-it actions for stuck data without manually editing production tables.",
    search: "Search support actions...",
    stats: [
      {
        label: "Open actions",
        value: "Soon",
        helper: "Batch 8 connects operational tools",
      },
      {
        label: "Audit trail",
        value: "Soon",
        helper: "Mutations will be logged before release",
      },
    ],
    nextItems: [
      {
        title: "Fix-it center",
        meta: "Recalculate metrics, concepts, packages, reports",
      },
      {
        title: "Safe operations",
        meta: "Confirm actions, show results, avoid hard deletes",
      },
    ],
  },
};

export function InternalAdminPlaceholderPanel({
  section,
}: {
  section: Exclude<InternalOpsTab, "live" | "pilot" | "product" | "ai">;
}) {
  const config = ADMIN_SECTIONS[section];

  return (
    <div className="space-y-5 pb-28 md:pb-8">
      <InternalPageHeader
        description={config.description}
        title="Admin foundation"
        action={
          <span className="rounded-full bg-[#e8e2d4] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#3b3f6e99]">
            Batch setup
          </span>
        }
      />

      <InternalSearchInput placeholder={config.search} />

      <section className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {config.stats.map((stat) => (
          <InternalStatCard
            helper={stat.helper}
            key={stat.label}
            label={stat.label}
            value={stat.value}
          />
        ))}
      </section>

      <section className="space-y-2">
        <p className={internalTheme.label}>What this section will manage</p>
        {config.nextItems.map((item) => (
          <InternalListCard
            key={item.title}
            meta={item.meta}
            title={item.title}
          />
        ))}
      </section>

      <InternalEmptyState
        description="This route is intentionally scaffolded in Batch 1 so the dashboard structure is ready before we connect mutations and real admin data."
        title={`${config.title} data comes in the next batches`}
      />
    </div>
  );
}
