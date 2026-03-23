"use server";

export async function registerTeacher(data: {
  fullName: string;
  schoolName: string;
  workEmail: string;
  password?: string;
}) {
  try {

    const res = await fetch("https://api.nevolearning.com/api/v1/auth/register/teacher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: data.fullName,
        school_name: data.schoolName,
        email: data.workEmail,
        password: data.password,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      let errorMessage = "Failed to register teacher.";

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
    console.error("Registration error:", error);
    return { error: "An unexpected error occurred." };
  }
}
