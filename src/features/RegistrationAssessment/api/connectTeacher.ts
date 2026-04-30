"use server";

import { apiFetch } from "@/shared/lib/api";

export async function connectTeacher(data: {
  teacherId: string;
  token: string;
}) {
  try {
    const res = await apiFetch(`/teachers/${data.teacherId}/connect`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${data.token}`,
      },
    });

    const result = await res.json();

    if (!res.ok) {
      return { error: result.detail || result.error || "Failed to connect to teacher." };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Connect teacher error:", error);
    return { error: "An unexpected error occurred." };
  }
}
