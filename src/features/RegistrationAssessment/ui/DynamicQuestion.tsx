"use client";

import { useState } from "react";
import { HorizontalCard } from "@/shared/ui";
import { Header } from "./Header";

export type AssessmentQuestion = {
    id: number;
    text: string;
    type: string;
    category: string;
    options: string[];
    is_required: boolean;
};

export function DynamicQuestion({ 
    question, 
    number, 
    onNext 
}: { 
    question: AssessmentQuestion; 
    number: number; 
    onNext: (answerIdx: number) => void;
}) {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    const handleNext = () => {
        if (selectedOption !== null) {
            onNext(selectedOption);
            setSelectedOption(null); 
        }
    };

    return (
        <div>
            <main className="px-6 pb-12 flex flex-col items-center justify-center">
                <Header number={number} title={question.text} className="pb-8 w-[592px]" />
                <div className="flex flex-col gap-4">
                    {question.options.map((opt, idx) => (
                        <HorizontalCard 
                            key={idx}
                            onClick={() => setSelectedOption(selectedOption === idx ? null : idx)} 
                            isSelected={selectedOption === idx} 
                            hasPadding 
                            width={592} 
                            content={opt} 
                        />
                    ))}
                </div>
                <div className="flex flex-col gap-4 items-center justify-center">
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={selectedOption === null && question.is_required}
                        className={`bg-indigo mt-10 text-white rounded-2xl px-6 py-4 outline-none w-[592px] transition-all ${(selectedOption === null && question.is_required) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
                    >Continue</button>
                </div>
            </main>
        </div>
    )
}
