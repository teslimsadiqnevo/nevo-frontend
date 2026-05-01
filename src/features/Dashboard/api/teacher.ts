"use server";

import { auth, signOut } from "@/features/Auth/api/auth";
import { API_BASE_URL, apiFetch } from "@/shared/lib/api";
import { cookies } from "next/headers";

async function teacherContext() {
  // Prefer NextAuth session token for authenticated dashboard flows.
  // Cookie tokens are mainly for pre-session onboarding/verification states and can become stale.
  const session = await auth();
  const tokenFromSession = (session?.user as any)?.apiToken;
  const teacherIdFromSession = (session?.user as any)?.id;

  if (tokenFromSession && teacherIdFromSession) {
    return {
      teacherId: String(teacherIdFromSession),
      headers: { Authorization: `Bearer ${tokenFromSession}` },
    };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const userRaw = cookieStore.get("user")?.value;

  let user: any = null;
  if (userRaw) {
    try {
      user = JSON.parse(decodeURIComponent(userRaw));
    } catch {
      user = null;
    }
  }

  const teacherIdFromCookie = user?.id || user?.sub || user?.teacher_id;
  if (token && teacherIdFromCookie) {
    return {
      teacherId: String(teacherIdFromCookie),
      headers: { Authorization: `Bearer ${token}` },
    };
  }

  throw new Error("Unauthorized");
}

function isAuthExpiredResponse(status: number, detail: unknown) {
  if (status !== 401 && status !== 403) return false;
  const text = typeof detail === "string" ? detail : JSON.stringify(detail ?? "");
  return /invalid|expired|unauthorized|token/i.test(text);
}

async function clearAuthState() {
  try {
    await signOut({ redirect: false });
  } catch {
    // no-op: signOut may fail in some server action contexts
  }

  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  cookieStore.delete("user");
}

async function unwrap(res: Response, label: string) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      (data as any)?.detail ||
      (data as any)?.message ||
      (data as any)?.error ||
      res.statusText;
    const detailText =
      typeof detail === "string" ? detail : JSON.stringify(detail ?? "");
    const authExpired = isAuthExpiredResponse(res.status, detail);

    if (authExpired) {
      await clearAuthState();
    }

    return { error: `${label}: ${detailText || res.statusText}`, data, authExpired };
  }
  return { data };
}


export async function getTeacherDashboardHome() {
  try {
    const { headers } = await teacherContext();
    const res = await apiFetch("/teachers/dashboard-home", { headers });
    return unwrap(res, "Failed to fetch teacher dashboard home");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getTeacherDashboard() {
  try {
    const { headers } = await teacherContext();
    const res = await apiFetch("/teachers/dashboard", { headers });
    return unwrap(res, "Failed to fetch teacher dashboard");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getTeacherLessons(params?: {
  search?: string;
  status?: string;
  subject?: string;
  level?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  page_size?: number;
}) {
  try {
    const { headers } = await teacherContext();
    const query = new URLSearchParams();

    if (params?.search) query.set("search", params.search);
    if (params?.status) query.set("status", params.status);
    if (params?.subject) query.set("subject", params.subject);
    if (params?.level) query.set("level", params.level);
    if (params?.sort_by) query.set("sort_by", params.sort_by);
    if (params?.sort_order) query.set("sort_order", params.sort_order);
    if (typeof params?.page === "number") query.set("page", String(params.page));
    if (typeof params?.page_size === "number") query.set("page_size", String(params.page_size));

    const suffix = query.toString() ? `?${query.toString()}` : "";
    const res = await apiFetch(`/lessons/teacher/manage${suffix}`, { headers });
    return unwrap(res, "Failed to fetch teacher lessons");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getTeacherStudents() {
  try {
    const { headers, teacherId } = await teacherContext();
    const res = await apiFetch(`/teachers/${teacherId}/students`, { headers });
    return unwrap(res, "Failed to fetch teacher students");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getAssignableStudents() {
  try {
    const { headers } = await teacherContext();
    const res = await apiFetch("/teachers/students/assignable", { headers });
    return unwrap(res, "Failed to fetch assignable students");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function updateStudentNote(studentId: string, note: string) {
  try {
    const { headers } = await teacherContext();
    const res = await apiFetch(`/teachers/students/${studentId}/notes`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ note }),
    });
    return unwrap(res, "Failed to update student note");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getTeacherQr() {
  try {
    const { headers, teacherId } = await teacherContext();
    const res = await apiFetch(`/teachers/${teacherId}/qr`, { headers });
    return unwrap(res, "Failed to fetch teacher QR");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getTeacherConnectionRequests() {
  try {
    const { headers } = await teacherContext();
    const res = await apiFetch("/teachers/me/connection-requests", { headers });
    return unwrap(res, "Failed to fetch connection requests");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function updateTeacherConnectionRequest(connectionId: string, action: "accept" | "reject") {
  try {
    const { headers } = await teacherContext();
    const res = await apiFetch(`/teachers/me/connection-requests/${connectionId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ action }),
    });
    return unwrap(res, "Failed to update connection request");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getTeacherProfile() {
  try {
    const { headers, teacherId } = await teacherContext();
    const res = await apiFetch(`/teachers/${teacherId}`, { headers });
    return unwrap(res, "Failed to fetch teacher profile");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function updateTeacherProfile(payload: Record<string, any>) {
  try {
    const { headers, teacherId } = await teacherContext();
    const res = await apiFetch(`/teachers/${teacherId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
    return unwrap(res, "Failed to update teacher profile");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function updateTeachingContext(payload: Record<string, any>) {
  try {
    const { headers } = await teacherContext();
    const res = await apiFetch("/teachers/me/teaching-context", {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
    return unwrap(res, "Failed to update teaching context");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function completeTeacherProfileSetup(payload: Record<string, any>) {
  try {
    const { headers } = await teacherContext();
    const res = await apiFetch("/teachers/me/profile-setup", {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
    return unwrap(res, "Failed to complete teacher profile setup");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getTeacherUploadUrl(payload: Record<string, any>) {
  try {
    const { headers } = await teacherContext();
    const res = await apiFetch("/teachers/me/upload-url", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    return unwrap(res, "Failed to get teacher upload URL");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function sendTeacherFeedback(payload: Record<string, any>) {
  try {
    const { headers } = await teacherContext();
    const res = await apiFetch("/teachers/feedback", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    return unwrap(res, "Failed to send feedback");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function createTeacherLesson(payload: {
  title: string;
  content: string;
  description?: string;
  subject?: string;
  topic?: string;
  target_grade_level?: number;
  file?: File | null;
}) {
  try {
    const { headers } = await teacherContext();
    const formData = new FormData();

    formData.append("title", payload.title);
    formData.append("content", payload.content);
    if (payload.description) formData.append("description", payload.description);
    if (payload.subject) formData.append("subject", payload.subject);
    if (payload.topic) formData.append("topic", payload.topic);
    if (typeof payload.target_grade_level === "number") {
      formData.append("target_grade_level", String(payload.target_grade_level));
    }
    if (payload.file) formData.append("file", payload.file);

    const res = await fetch(`${API_BASE_URL}/lessons`, {
      method: "POST",
      headers: {
        Authorization: (headers as any).Authorization,
      },
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail =
        (data as any)?.detail ||
        (data as any)?.message ||
        (data as any)?.error ||
        res.statusText;
      const detailText =
        typeof detail === "string" ? detail : JSON.stringify(detail ?? "");
      return { error: `Failed to create lesson: ${detailText || res.statusText}`, data };
    }
    return { data };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function archiveTeacherLesson(lessonId: string) {
  try {
    const { headers } = await teacherContext();
    const res = await apiFetch(`/lessons/${lessonId}/archive`, {
      method: "PUT",
      headers,
    });
    return unwrap(res, "Failed to archive lesson");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function duplicateTeacherLesson(lessonId: string) {
  try {
    const { headers } = await teacherContext();
    const res = await apiFetch(`/lessons/${lessonId}/duplicate`, {
      method: "POST",
      headers,
    });
    return unwrap(res, "Failed to duplicate lesson");
  } catch (e: any) {
    return { error: e.message };
  }
}
