"use server";

export async function registerSchool(data: {
  schoolName: string;
  adminName: string;
  adminEmail: string;
  password?: string;
  schoolType?: string;
}) {
  try {
    const res = await fetch("https://api.nevolearning.com/api/v1/auth/register/school-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.adminEmail,
        full_name: data.adminName, 
        password: data.password,
        school_name: data.schoolName,
        school_type: data.schoolType,
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
