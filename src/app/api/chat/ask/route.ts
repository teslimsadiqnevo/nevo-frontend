import { NextResponse } from "next/server";
import { auth } from "@/features/Auth/api/auth";
import { API_BASE_URL } from "@/shared/lib/api";
import { cookies } from "next/headers";

type ChatHistoryMessage = {
  role: "user" | "student" | "teacher" | "nevo";
  content: string;
};

async function getAuthContext() {
  const session = await auth();
  const tokenFromSession = (session?.user as any)?.apiToken;
  const roleFromSession = (session?.user as any)?.role;
  const userIdFromSession = (session?.user as any)?.id;

  if (tokenFromSession) {
    return {
      token: tokenFromSession,
      role: typeof roleFromSession === "string" ? roleFromSession.toLowerCase() : null,
      userId:
        typeof userIdFromSession === "string" ? userIdFromSession : null,
    };
  }

  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get("access_token")?.value;
  const userRaw = cookieStore.get("user")?.value;

  let roleFromCookie: string | null = null;
  let userIdFromCookie: string | null = null;
  if (userRaw) {
    try {
      const user = JSON.parse(decodeURIComponent(userRaw));
      roleFromCookie =
        typeof user?.role === "string" ? user.role.toLowerCase() : null;
      userIdFromCookie =
        typeof user?.id === "string"
          ? user.id
          : typeof user?.sub === "string"
            ? user.sub
            : typeof user?.teacher_id === "string"
              ? user.teacher_id
              : typeof user?.student_id === "string"
                ? user.student_id
                : null;
    } catch {
      roleFromCookie = null;
      userIdFromCookie = null;
    }
  }

  return {
    token: tokenFromCookie ?? null,
    role: roleFromCookie,
    userId: userIdFromCookie,
  };
}

function parseHistory(value: unknown): ChatHistoryMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const role =
        typeof item?.role === "string" ? item.role.toLowerCase().trim() : "";
      const content =
        typeof item?.content === "string" ? item.content.trim() : "";

      if (
        !content ||
        !["user", "student", "teacher", "nevo"].includes(role)
      ) {
        return null;
      }

      return {
        role: role as ChatHistoryMessage["role"],
        content,
      };
    })
    .filter(Boolean) as ChatHistoryMessage[];
}

function formatLagosTimestamp() {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date());
}

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function safeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function inferTeacherPage(page: string | null, context: string | null) {
  if (page) return titleCase(page);
  if (context?.toLowerCase().includes("teacher dashboard")) return "Home";
  return "Home";
}

async function fetchTeacherResource(
  token: string,
  path: string,
): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch {
    return null;
  }
}

function normalizeTeacherProfile(data: any) {
  const payload = data?.teacher || data?.profile || data?.data || data || {};
  const fullName =
    safeText(
      payload.name ||
        payload.full_name ||
        payload.display_name ||
        `${payload.first_name || ""} ${payload.last_name || ""}`.trim(),
    ) || "Teacher";

  return {
    fullName,
    email: safeText(payload.email),
    subjects: toArray<string>(
      payload.subjects ?? payload.teaching_context?.subjects,
    ).filter(Boolean),
    levels: toArray<string>(
      payload.education_levels ??
        payload.educationLevels ??
        payload.teaching_context?.education_levels,
    ).filter(Boolean),
  };
}

function summarizeTeacherContext(input: {
  page: string;
  visibleContext: string | null;
  profile: any;
  dashboardHome: any;
  dashboard: any;
  students: any;
  lessons: any;
  connectionRequests: any;
}) {
  const {
    page,
    visibleContext,
    profile,
    dashboardHome,
    dashboard,
    students,
    lessons,
    connectionRequests,
  } = input;

  const teacher = normalizeTeacherProfile(profile);
  const studentRows = toArray<any>(students?.students ?? students);
  const lessonRows = toArray<any>(lessons?.lessons ?? lessons);
  const requestRows = toArray<any>(
    connectionRequests?.requests ??
      connectionRequests?.connections ??
      connectionRequests,
  );
  const dashboardLessons = toArray<any>(dashboard?.lessons);
  const dashboardTopics = toArray<any>(dashboard?.topics_building);
  const weekStats = dashboardHome?.this_week ?? dashboardHome ?? {};

  const classCounts = new Map<string, number>();
  for (const student of studentRows) {
    const className =
      safeText(student.class_name || student.class || student.className) ||
      "Unassigned";
    classCounts.set(className, (classCounts.get(className) || 0) + 1);
  }

  const topClasses = Array.from(classCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([className, count]) => `${className} (${count})`);

  const supportStudents = studentRows
    .filter((student) =>
      Boolean(
        student.signal_reason ||
          student.support_note ||
          student.note ||
          (Array.isArray(student.issues) && student.issues.length > 0),
      ),
    )
    .slice(0, 6)
    .map((student) => {
      const name =
        safeText(
          student.name ||
            `${student.first_name || ""} ${student.last_name || ""}`.trim(),
        ) || "Student";
      const signal =
        safeText(student.signal_reason || student.support_note || student.note) ||
        toArray<string>(student.issues).slice(0, 2).join(", ");
      return signal ? `${name}: ${signal}` : name;
    });

  const lessonSummary = lessonRows.slice(0, 8).map((lesson) => {
    const title = safeText(lesson.title) || "Untitled lesson";
    const subject = safeText(lesson.subject || lesson.topic) || "General";
    const level =
      safeText(lesson.education_level || lesson.level || lesson.target_level) ||
      "Unknown level";
    const status = safeText(lesson.status) || "published";
    const confusionSignals = Number(
      lesson.confusion_signal_count ?? lesson.confusion_signals ?? 0,
    );
    return `${title} [${subject}, ${level}, ${status}]${
      confusionSignals > 0 ? ` - confusion signals: ${confusionSignals}` : ""
    }`;
  });

  const confusionLessons = dashboardLessons
    .filter((lesson) => Number(lesson.confusion_signals ?? lesson.confusion_count ?? 0) > 0)
    .slice(0, 5)
    .map((lesson) => {
      const title = safeText(lesson.title || lesson.name) || "Lesson";
      const count = Number(lesson.confusion_signals ?? lesson.confusion_count ?? 0);
      return `${title} (${count} confusion signals)`;
    });

  const buildingTopics = dashboardTopics.slice(0, 5).map((topic) => {
    const title = safeText(topic.title || topic.topic) || "Topic";
    const summary = safeText(topic.description || topic.summary);
    return summary ? `${title}: ${summary}` : title;
  });

  const activity = toArray<any>(dashboardHome?.recent_activity)
    .slice(0, 6)
    .map((item) => {
      const text =
        safeText(item.text || item.message || item.title) || "Recent activity";
      const when = safeText(item.time_ago || item.time || item.when);
      return when ? `${text} (${when})` : text;
    });

  return [
    `Teacher identity: ${teacher.fullName}${teacher.email ? ` (${teacher.email})` : ""}`,
    `Current local time in Lagos: ${formatLagosTimestamp()}`,
    `Current page: Teacher Dashboard > ${page}`,
    visibleContext ? `Visible page context: ${visibleContext}` : null,
    teacher.subjects.length
      ? `Subjects taught: ${teacher.subjects.join(", ")}`
      : null,
    teacher.levels.length
      ? `Education levels taught: ${teacher.levels.join(", ")}`
      : null,
    `Student count in view: ${studentRows.length}`,
    topClasses.length ? `Classes taught: ${topClasses.join("; ")}` : null,
    supportStudents.length
      ? `Students who may need support: ${supportStudents.join("; ")}`
      : "No explicit support signals were found in the fetched student list.",
    lessonSummary.length
      ? `Recent or managed lessons: ${lessonSummary.join("; ")}`
      : "No teacher lessons were returned.",
    confusionLessons.length
      ? `Lessons with confusion signals: ${confusionLessons.join("; ")}`
      : null,
    buildingTopics.length
      ? `Topics building well: ${buildingTopics.join("; ")}`
      : null,
    activity.length ? `Recent activity: ${activity.join("; ")}` : null,
    `Dashboard home metrics: students needing support=${Number(
      weekStats?.students_needing_support ??
        weekStats?.students_need_support ??
        0,
    )}, lessons with confusion=${Number(
      weekStats?.lessons_with_confusion_signals ??
        weekStats?.lessons_with_confusion ??
        0,
    )}, topics building well=${Number(
      weekStats?.topics_building_well ?? 0,
    )}`,
    requestRows.length
      ? `Pending teacher connection requests: ${requestRows.length}`
      : null,
    "Instruction: respond as Nevo for a teacher. Be specific, actionable, and refer to the teacher's current page, students, classes, lessons, and signals when useful.",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(request: Request) {
  try {
    const { token, role, userId } = await getAuthContext();
    if (!token) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const message =
      typeof body?.message === "string" ? body.message.trim() : "";
    const lessonId =
      typeof body?.lesson_id === "string" && body.lesson_id.trim().length > 0
        ? body.lesson_id.trim()
        : null;
    const context =
      typeof body?.context === "string" && body.context.trim().length > 0
        ? body.context.trim()
        : null;
    const page =
      typeof body?.page === "string" && body.page.trim().length > 0
        ? body.page.trim().toLowerCase()
        : null;
    const history = parseHistory(body?.history);

    if (!message) {
      return NextResponse.json(
        { detail: "Message is required." },
        { status: 400 }
      );
    }

    let upstreamContext = context;
    if (role === "teacher") {
      if (!userId) {
        return NextResponse.json(
          { detail: "Teacher identity is missing from the session." },
          { status: 401 },
        );
      }

      const [profile, dashboardHome, dashboard, students, lessons, connectionRequests] =
        await Promise.all([
          fetchTeacherResource(token, `/teachers/${userId}`),
          fetchTeacherResource(token, "/teachers/dashboard-home"),
          fetchTeacherResource(token, "/teachers/dashboard"),
          fetchTeacherResource(token, `/teachers/${userId}/students?page=1&page_size=100`),
          fetchTeacherResource(
            token,
            "/lessons/teacher/manage?page=1&page_size=20&sort_by=created_at&sort_order=desc",
          ),
          fetchTeacherResource(token, "/teachers/me/connection-requests"),
        ]);

      upstreamContext = summarizeTeacherContext({
        page: inferTeacherPage(page, context),
        visibleContext: context,
        profile,
        dashboardHome,
        dashboard,
        students,
        lessons,
        connectionRequests,
      });
    }

    const upstream = await fetch(`${API_BASE_URL}/chat/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
        ...(lessonId ? { lesson_id: lessonId } : {}),
        ...(upstreamContext ? { context: upstreamContext } : {}),
        ...(history.length > 0 ? { history } : {}),
      }),
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error: any) {
    return NextResponse.json(
      { detail: error?.message || "Failed to send Ask Nevo message." },
      { status: 500 }
    );
  }
}
