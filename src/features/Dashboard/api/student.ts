"use server";

import { apiFetch } from "@/shared/lib/api";
import { auth, signOut } from "@/features/Auth/api/auth";
import { cookies } from "next/headers";

async function getAuthHeader() {
    const session = await auth();
    const token = (session?.user as any)?.apiToken;
    if (!token) {
        throw new Error("Unauthorized");
    }
    return { Authorization: `Bearer ${token}` };
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

        return { data: data ?? null, error: `${label}: ${detailText || res.statusText}`, authExpired };
    }
    return { data, error: undefined as string | undefined, authExpired: false };
}

export async function getStudentDashboard() {
    try {
        const headers = await getAuthHeader();
        const res = await apiFetch(`/students/me/dashboard`, { headers });
        return unwrap(res, "Failed to fetch dashboard");
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function getStudentLessons() {
    try {
        const headers = await getAuthHeader();
        const res = await apiFetch(`/students/me/lessons`, { headers });
        return unwrap(res, "Failed to fetch lessons");
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function getStudentProfile() {
    try {
        const headers = await getAuthHeader();
        const res = await apiFetch(`/students/me/profile`, { headers });
        return unwrap(res, "Failed to fetch profile");
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function getStudentSchoolById(schoolId: string) {
    try {
        const headers = await getAuthHeader();
        const res = await apiFetch(`/schools/${encodeURIComponent(schoolId)}`, { headers });
        return unwrap(res, "Failed to fetch school");
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function getStudentSchoolClasses(schoolId: string) {
    try {
        const headers = await getAuthHeader();
        const res = await apiFetch(`/schools/${encodeURIComponent(schoolId)}/classes`, { headers });
        return unwrap(res, "Failed to fetch classes");
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function getStudentProgress() {
    try {
        const headers = await getAuthHeader();
        const res = await apiFetch(`/students/me/progress`, { headers });
        return unwrap(res, "Failed to fetch progress");
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function getStudentProgressOverview() {
    try {
        const headers = await getAuthHeader();
        const res = await apiFetch(`/students/me/progress/overview`, { headers });
        return unwrap(res, "Failed to fetch progress overview");
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function getStudentSubjectDetail(subject: string) {
    try {
        const headers = await getAuthHeader();
        const res = await apiFetch(`/students/me/progress/subjects/${encodeURIComponent(subject)}`, {
            headers,
        });
        return unwrap(res, "Failed to fetch subject detail");
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function getStudentConnections() {
    try {
        const headers = await getAuthHeader();
        const res = await apiFetch(`/students/me/connections`, { headers });
        return unwrap(res, "Failed to fetch connections");
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function updateStudentSettings(settings: any) {
    try {
        const headers = await getAuthHeader();
        const res = await apiFetch(`/students/me/settings`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(settings),
        });
        return unwrap(res, "Failed to update settings");
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function getStudentSettings() {
    try {
        const headers = await getAuthHeader();
        const res = await apiFetch(`/students/me/settings`, { headers });
        return unwrap(res, "Failed to fetch settings");
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function updateStudentLearningProfile(profile: Record<string, unknown>) {
    try {
        const headers = await getAuthHeader();
        const res = await apiFetch(`/students/me/learning-profile`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(profile),
        });
        return unwrap(res, "Failed to update learning profile");
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function setStudentAdaptation(enabled: boolean) {
    try {
        const headers = await getAuthHeader();
        const res = await apiFetch(`/students/me/adaptation?enabled=${encodeURIComponent(String(enabled))}`, {
            method: "PUT",
            headers,
        });
        return unwrap(res, "Failed to update adaptation");
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function getStudentDownloads() {
    try {
        const headers = await getAuthHeader();
        const res = await apiFetch(`/downloads/me/downloads`, { headers });
        return unwrap(res, "Failed to fetch downloads");
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function recordStudentDownload(payload: { lesson_id: string; version_hash: string; size_bytes: number }) {
    try {
        const headers = await getAuthHeader();
        const res = await apiFetch(`/downloads/me/downloads`, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        });
        return unwrap(res, "Failed to record download");
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function removeStudentDownload(lessonId: string) {
    try {
        const headers = await getAuthHeader();
        const res = await apiFetch(`/downloads/me/downloads/${encodeURIComponent(lessonId)}`, {
            method: "DELETE",
            headers,
        });
        return unwrap(res, "Failed to remove download");
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

export async function getLessonDownloadPackage(lessonId: string) {
    try {
        const headers = await getAuthHeader();
        const res = await apiFetch(`/downloads/me/lessons/${encodeURIComponent(lessonId)}/package`, {
            headers,
        });
        return unwrap(res, "Failed to fetch lesson package");
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}
