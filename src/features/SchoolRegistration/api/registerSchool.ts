"use server";

import { apiFetch } from "@/shared/lib/api";

function extractErrorMessage(result: any, fallback: string) {
  const detail = result?.detail ?? result?.message ?? result?.error;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((err: any) => {
        const field = err?.loc ? err.loc[err.loc.length - 1] : "Field";
        return `${field}: ${err?.msg || "Validation error"}`;
      })
      .join(", ");
  }

  if (detail && typeof detail === "object") {
    try {
      return JSON.stringify(detail);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

export async function registerSchool(data: {
  schoolName: string;
  adminName: string;
  adminEmail: string;
  password: string;
  state: string;
  schoolType?: string;
}) {
  try {
    const nameParts = data.adminName.trim().split(/\s+/).filter(Boolean);
    const adminFirstName = nameParts[0] || data.adminName.trim();
    const adminLastName = nameParts.slice(1).join(" ") || "Admin";

    const res = await apiFetch("/auth/school/register", {
      method: "POST",
      body: JSON.stringify({
        school_name: data.schoolName,
        admin_first_name: adminFirstName,
        admin_last_name: adminLastName,
        admin_email: data.adminEmail,
        admin_password: data.password,
        state: data.state,
        country: "Nigeria",
        ...(data.schoolType ? { school_type: data.schoolType } : {}),
      }),
    });

    const result = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMessage = extractErrorMessage(result, "Failed to sign up.");
      return { error: errorMessage };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Signup error:", error);
    return { error: "An unexpected error occurred." };
  }
}
