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

export async function getStudentProgress() {
    try {
        const headers = await getAuthHeader();
        const res = await apiFetch(`/students/me/progress`, { headers });
        return unwrap(res, "Failed to fetch progress");
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
