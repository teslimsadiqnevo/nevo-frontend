"use server";

import { apiFetch } from "@/shared/lib/api";

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
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      let errorMessage = "Failed to sign up.";
      if (result.detail) {
        if (typeof result.detail === "string") {
          errorMessage = result.detail;
        } else if (Array.isArray(result.detail)) {
          errorMessage = result.detail
            .map((err: any) => {
              const field = err.loc ? err.loc[err.loc.length - 1] : "Field";
              return `${field}: ${err.msg || "Validation error"}`;
            })
            .join(", ");
        } else if (typeof result.detail === "object") {
          errorMessage = JSON.stringify(result.detail);
        }
      }
      return { error: errorMessage };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Signup error:", error);
    return { error: "An unexpected error occurred." };
  }
}
