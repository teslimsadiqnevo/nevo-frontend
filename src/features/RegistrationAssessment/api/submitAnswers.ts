import { apiFetch } from "@/shared/lib/api";

export async function submitAnswers(data: {
    answers: { question_id: number; value: any }[];
    token: string;
}) {
    try {
        const res = await apiFetch("/assessments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${data.token}`
            },
            body: JSON.stringify({ answers: data.answers }),
        });

        const result = await res.json();
        
        if (!res.ok) {
            const detail =
                typeof result?.detail === "string"
                    ? result.detail
                    : typeof result?.error === "string"
                        ? result.error
                        : "Failed to submit assessment answers.";
            return { error: detail };
        }
        
        return { success: true, data: result };
    } catch (error) {
        console.error("Submit assessment error:", error);
        return { error: "An unexpected error occurred." };
    }
}
