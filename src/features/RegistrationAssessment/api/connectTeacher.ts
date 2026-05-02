export async function connectTeacher(data: {
  code: string;
  token: string;
}) {
  try {
    const normalizedCode = data.code.trim().toUpperCase();
    const payload = normalizedCode.startsWith("NEVO-CLASS-")
      ? { class_code: normalizedCode }
      : { teacher_nevo_id: normalizedCode };

    const res = await fetch("/api/teachers/connect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.token}`,
      },
      body: JSON.stringify(payload),
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
