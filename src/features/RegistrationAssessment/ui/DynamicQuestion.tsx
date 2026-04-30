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
    totalQuestions,
    onNext 
}: { 
    question: AssessmentQuestion; 
    number: number; 
    totalQuestions: number;
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
        <div className="w-full flex flex-col flex-1 relative">
            <div className="w-full justify-between px-6 xl:px-20 pt-6 z-10 hidden sm:flex flex-col-reverse">
                <span className="text-lavender text-sm">Step 4 of 6</span>
                <span className="text-graphite flex items-end justify-end font-medium text-[15px]">Question {number} of {totalQuestions}</span>
            </div>
            {/* Mobile fallbacks */}
            <div className="w-full flex justify-between px-6 pt-6 sm:hidden">
                <span className="text-lavender text-sm">Step 4 of 6</span>
                <span className="text-graphite font-semibold text-sm">Question {number} of {totalQuestions}</span>
            </div>
            
            <main className="px-6 flex-1 flex flex-col items-center justify-center mt-6 sm:mt-12 pb-12 w-full">
                <Header number={number} title={question.text} className="pb-8 w-full max-w-[592px]" />
                <div className="flex flex-col gap-4 w-full flex-1 mb-8">
                    {question.options.map((opt, idx) => (
                        <HorizontalCard 
                            key={idx}
                            onClick={() => setSelectedOption(selectedOption === idx ? null : idx)} 
                            isSelected={selectedOption === idx} 
                            hasPadding 
                            content={opt} 
                            centerText
                        />
                    ))}
                </div>
                
                <div className="h-[72px] flex flex-col items-center justify-end w-full">
                    {selectedOption !== null && (
                        <button
                            type="button"
                            onClick={handleNext}
                            className={`bg-indigo text-white rounded-xl px-6 py-4 outline-none w-full transition-all cursor-pointer hover:opacity-90 font-medium`}
                        >Continue</button>
                    )}
                </div>
            </main>
        </div>
    )
}
