"use server";

import { auth, signOut } from "@/features/Auth/api/auth";
import { API_BASE_URL, apiFetch } from "@/shared/lib/api";
import { cookies } from "next/headers";

async function schoolContext() {
  const session = await auth();
  const tokenFromSession = (session?.user as any)?.apiToken;
  const schoolIdFromSession = (session?.user as any)?.schoolId;

  if (tokenFromSession) {
    return {
      schoolId: schoolIdFromSession ? String(schoolIdFromSession) : null,
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

  if (token) {
    return {
      schoolId: user?.school_id ? String(user.school_id) : null,
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
    // no-op
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

export async function getSchoolDashboardOverview() {
  try {
    const { headers } = await schoolContext();
    const res = await apiFetch("/schools/me/overview", { headers });
    return unwrap(res, "Failed to fetch school overview");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getSchoolDashboardSummary() {
  try {
    const { headers } = await schoolContext();
    const res = await apiFetch("/schools/dashboard", { headers });
    return unwrap(res, "Failed to fetch school dashboard summary");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getSchoolStudentsPage(params?: {
  search?: string;
  classId?: string | null;
  page?: number;
  pageSize?: number;
}) {
  try {
    const { headers } = await schoolContext();
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.classId) query.set("class_id", params.classId);
    if (typeof params?.page === "number") query.set("page", String(params.page));
    if (typeof params?.pageSize === "number") query.set("page_size", String(params.pageSize));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const res = await apiFetch(`/schools/me/students${suffix}`, { headers });
    return unwrap(res, "Failed to fetch school students");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getSchoolStudentDetail(studentId: string) {
  try {
    const { headers } = await schoolContext();
    const res = await apiFetch(`/schools/me/students/${studentId}`, { headers });
    return unwrap(res, "Failed to fetch student details");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function enrollSchoolStudent(payload: {
  firstName: string;
  age: number;
  classId: string;
}) {
  try {
    const { headers } = await schoolContext();
    const res = await apiFetch("/schools/me/students/enroll", {
      method: "POST",
      headers,
      body: JSON.stringify({
        age: Number(payload.age),
        class_id: payload.classId,
        first_name: payload.firstName.trim(),
      }),
    });
    return unwrap(res, "Failed to enroll student");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function moveSchoolStudentToClass(payload: {
  studentId: string;
  classId: string;
  note?: string;
}) {
  try {
    const { headers } = await schoolContext();
    const res = await apiFetch(`/schools/me/students/${payload.studentId}/move-class`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        class_id: payload.classId,
        note: payload.note || null,
      }),
    });
    return unwrap(res, "Failed to move student");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function removeSchoolStudent(studentId: string) {
  try {
    const { headers } = await schoolContext();
    const res = await apiFetch(`/schools/me/students/${studentId}`, {
      method: "DELETE",
      headers,
    });
    return unwrap(res, "Failed to remove student");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function resetSchoolStudentId(studentId: string) {
  try {
    const { headers } = await schoolContext();
    const res = await apiFetch(`/schools/me/students/${studentId}/reset-id`, {
      method: "POST",
      headers,
    });
    return unwrap(res, "Failed to reset student ID");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getSchoolClassesOverview() {
  try {
    const { headers } = await schoolContext();
    const res = await apiFetch("/schools/me/classes", { headers });
    return unwrap(res, "Failed to fetch school classes");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getSchoolClassFormOptions() {
  try {
    const { headers } = await schoolContext();
    const res = await apiFetch("/schools/me/class-form-options", { headers });
    return unwrap(res, "Failed to fetch class form options");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function createSchoolClass(payload: Record<string, any>) {
  try {
    const { headers } = await schoolContext();
    const res = await apiFetch("/classes", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    return unwrap(res, "Failed to create class");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getSchoolClassDetail(classId: string) {
  try {
    const { headers } = await schoolContext();
    const res = await apiFetch(`/classes/${classId}`, { headers });
    return unwrap(res, "Failed to fetch class details");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getSchoolClassEditForm(classId: string) {
  try {
    const { headers } = await schoolContext();
    const res = await apiFetch(`/schools/me/classes/${classId}/edit-form`, { headers });
    return unwrap(res, "Failed to fetch class edit form");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function updateSchoolClass(classId: string, payload: Record<string, any>) {
  try {
    const { headers } = await schoolContext();
    const res = await apiFetch(`/classes/${classId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
    return unwrap(res, "Failed to update class");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function archiveSchoolClass(classId: string) {
  try {
    const { headers } = await schoolContext();
    const res = await apiFetch(`/classes/${classId}`, {
      method: "DELETE",
      headers,
    });
    return unwrap(res, "Failed to archive class");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getSchoolTeachersPage() {
  try {
    const { headers } = await schoolContext();
    const res = await apiFetch("/schools/me/teachers", { headers });
    return unwrap(res, "Failed to fetch school teachers");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getSchoolTeacherInviteForm() {
  try {
    const { headers } = await schoolContext();
    const res = await apiFetch("/schools/me/teachers/invite-form", { headers });
    return unwrap(res, "Failed to fetch invite form");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function checkSchoolTeacherInviteEmail(email: string) {
  try {
    const { headers } = await schoolContext();
    const query = new URLSearchParams({ email });
    const res = await apiFetch(`/schools/me/teachers/invite-email-check?${query.toString()}`, { headers });
    return unwrap(res, "Failed to check teacher email");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function inviteSchoolTeacher(payload: Record<string, any>) {
  try {
    const { headers } = await schoolContext();
    const res = await apiFetch("/schools/me/teachers/invite", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    return unwrap(res, "Failed to invite teacher");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getSchoolTermSummary(params?: {
  startDate?: string;
  endDate?: string;
}) {
  try {
    const { headers } = await schoolContext();
    const query = new URLSearchParams();
    if (params?.startDate) query.set("start_date", params.startDate);
    if (params?.endDate) query.set("end_date", params.endDate);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const res = await apiFetch(`/schools/me/term-summary${suffix}`, { headers });
    return unwrap(res, "Failed to fetch term summary");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getSchoolBoardSharePreview(params?: {
  startDate?: string;
  endDate?: string;
}) {
  try {
    const { headers } = await schoolContext();
    const query = new URLSearchParams();
    if (params?.startDate) query.set("start_date", params.startDate);
    if (params?.endDate) query.set("end_date", params.endDate);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const res = await apiFetch(`/schools/me/reports/board-share-preview${suffix}`, {
      headers,
    });
    return unwrap(res, "Failed to fetch board share preview");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getSchoolSettings() {
  try {
    const { headers } = await schoolContext();
    const res = await apiFetch("/schools/me/settings", { headers });
    return unwrap(res, "Failed to fetch school settings");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function updateSchoolSettings(payload: Record<string, any>) {
  try {
    const { headers, schoolId } = await schoolContext();
    if (!schoolId) {
      return { error: "School not found in session." };
    }
    const res = await apiFetch(`/schools/${schoolId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
    return unwrap(res, "Failed to update school settings");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteSchoolAccount(confirmationName: string) {
  try {
    const { headers } = await schoolContext();
    const res = await apiFetch("/schools/me", {
      method: "DELETE",
      headers,
      body: JSON.stringify({
        confirmation_name: confirmationName,
      }),
    });
    return unwrap(res, "Failed to delete school account");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getSchoolOnboardingStatus() {
  try {
    const { headers } = await schoolContext();
    const res = await apiFetch("/schools/me/status", { headers });
    return unwrap(res, "Failed to fetch school onboarding status");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function updateSchoolConsent(
  consentType: "data_protection" | "camera",
  consentGiven: boolean
) {
  try {
    const { headers } = await schoolContext();
    const res = await apiFetch("/schools/me/consent", {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        consent_type: consentType,
        consent_given: consentGiven,
      }),
    });
    return unwrap(res, "Failed to update school consent");
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getSchoolCode() {
  try {
    const { headers, schoolId } = await schoolContext();
    if (!schoolId) {
      return { error: "School not found in session." };
    }
    const res = await apiFetch(`/schools/${schoolId}/code`, { headers });
    return unwrap(res, "Failed to fetch school code");
  } catch (e: any) {
    return { error: e.message };
  }
}
