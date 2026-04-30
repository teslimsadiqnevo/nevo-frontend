"use server";

import { apiFetch } from "@/shared/lib/api";
import { auth } from "@/features/Auth/api/auth";

async function getAuthHeader() {
    const session = await auth();
    const token = (session?.user as any)?.apiToken;
    if (!token) {
        throw new Error("Unauthorized");
    }
    return { Authorization: `Bearer ${token}` };
}

export async function getStudentDashboard() {
    try {
        const headers = await getAuthHeader();
        const res = await apiFetch(`/students/me/dashboard`, { headers });
        if (!res.ok) {
            return { error: `Failed to fetch dashboard: ${res.statusText}` };
        }
        return { data: await res.json() };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getStudentLessons() {
    try {
        const headers = await getAuthHeader();
        const res = await apiFetch(`/students/me/lessons`, { headers });
        if (!res.ok) {
            return { error: `Failed to fetch lessons: ${res.statusText}` };
        }
        return { data: await res.json() };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getStudentProfile() {
    try {
        const headers = await getAuthHeader();
        const res = await apiFetch(`/students/me/profile`, { headers });
        if (!res.ok) {
            return { error: `Failed to fetch profile: ${res.statusText}` };
        }
        return { data: await res.json() };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getStudentProgress() {
    try {
        const headers = await getAuthHeader();
        const res = await apiFetch(`/students/me/progress`, { headers });
        if (!res.ok) {
            return { error: `Failed to fetch progress: ${res.statusText}` };
        }
        return { data: await res.json() };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getStudentConnections() {
    try {
        const headers = await getAuthHeader();
        const res = await apiFetch(`/students/me/connections`, { headers });
        if (!res.ok) {
            return { error: `Failed to fetch connections: ${res.statusText}` };
        }
        return { data: await res.json() };
    } catch (e: any) {
        return { error: e.message };
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
        if (!res.ok) {
            return { error: `Failed to update settings: ${res.statusText}` };
        }
        return { data: await res.json() };
    } catch (e: any) {
        return { error: e.message };
    }
}
