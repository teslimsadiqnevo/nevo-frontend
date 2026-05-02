import { apiFetch } from "@/shared/lib/api";

export async function registerStudent(data: {
  fullName: string;
  age: string;
  pin: string;
  schoolId: string;
  classId: string;
}) {
  try {
    const nameParts = data.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const payload = {
      age: Number(data.age),
      class_id: data.classId,
      first_name: firstName,
      last_name: lastName,
      pin: data.pin,
      role: "student",
      school_id: data.schoolId,
      phone_number: "+2348133333333",
    };

    const res = await apiFetch("/auth/student/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    console.log("registerStudent", result);

    if (!res.ok) {
      let errorMessage = "Failed to register student.";
      if (result.detail) {
        if (typeof result.detail === "string") {
          errorMessage = result.detail;
        } else if (Array.isArray(result.detail)) {
          errorMessage = result.detail
            .map((d: any) => d.msg || d.message || JSON.stringify(d))
            .join(", ");
        }
      }
      return { error: errorMessage };
    }

    const nevoId =
      result.nevo_id ||
      result.student_id ||
      result.user?.nevo_id ||
      result.user?.student_id;

    // The registration endpoint doesn't return a token.
    // We must immediately log the student in to get their session token.
    let token = result.token || result.access_token;
    
    if (!token && nevoId) {
        try {
            const loginRes = await apiFetch("/auth/student/login", {
                method: "POST",
                body: JSON.stringify({
                    first_name: firstName,
                    nevo_id: nevoId,
                    pin: data.pin,
                }),
            });
            const loginData = await loginRes.json();
            if (loginRes.ok) {
                token = loginData.token || loginData.access_token;
            }
        } catch (loginErr) {
            console.error("Auto-login after registration failed:", loginErr);
        }
    }

    return {
      success: true,
      data: result,
      token,
      nevoId,
    };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "An unexpected error occurred." };
  }
}
