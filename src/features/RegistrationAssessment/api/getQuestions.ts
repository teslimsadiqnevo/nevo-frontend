"use server";

export type AssessmentQuestion = {
    id: number;
    text: string;
    type: string;
    category: string;
    options: string[];
    is_required: boolean;
};

export async function getQuestions(): Promise<AssessmentQuestion[]> {
    try {
        const res = await fetch("https://api.nevolearning.com/api/v1/assessment/questions");
        const data = await res.json();
        return data.questions || [];
    } catch (err) {
        console.error("Failed to fetch questions", err);
        return [];
    }
}
