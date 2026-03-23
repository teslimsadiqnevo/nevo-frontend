"use server";

export async function submitAnswers(data: {
    answers: { question_id: number; value: any }[];
    token: string;
}) {
    try {
        const res = await fetch(
            "https://api.nevolearning.com/api/v1/assessment/submit",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${data.token}`
                },
                body: JSON.stringify({ answers: data.answers }),
            }
        );

        const result = await res.json();
        
        if (!res.ok) {
            return { error: result.detail || "Failed to submit assessment answers." };
        }
        
        console.log(result)
        return { success: true, data: result };
    } catch (error) {
        console.error("Submit assessment error:", error);
        return { error: "An unexpected error occurred." };
    }
}
