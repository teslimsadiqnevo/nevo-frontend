"use server";

export async function joinWaitlist(data: {
  name: string;
  email: string;
  role: string;
}) {
  try {

    const res = await fetch(
      "https://api.nevolearning.com/api/v1/waitlist/join",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          role: data.role,
        }),
      },
    );

    const result = await res.json();

    if (!res.ok) {
      let errorMessage = "Failed to join the waitlist.";

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
      } else if (result.error || result.message) {
        errorMessage = result.error || result.message;
      }

      return { error: errorMessage };
    }

    console.log("Joined waitlist:", result);
    return { success: true, data: result };
  } catch (error) {
    console.error("Waitlist error:", error);
    return { error: "An unexpected error occurred." };
  }
}
