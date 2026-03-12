'use client'

import { useState } from "react";
import { Header } from "./Header";
import { HorizontalCard } from "@/widgets/HorizontalCard";

export function Question7({ onNext }: { onNext: () => void }) {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    return (
        <div>
            <main className="px-6 pb-12 flex flex-col items-center justify-center">
                <Header number={7} title="What environment helps you focus best?" className="pb-8 w-[592px]" />
                <div className="flex flex-col gap-4">
                    <HorizontalCard onClick={() => setSelectedOption(selectedOption === 0 ? null : 0)} isSelected={selectedOption === 0} hasPadding width={592} content="Quiet and calm" />
                    <HorizontalCard onClick={() => setSelectedOption(selectedOption === 1 ? null : 1)} isSelected={selectedOption === 1} hasPadding width={592} content="Light background sound" />
                    <HorizontalCard onClick={() => setSelectedOption(selectedOption === 2 ? null : 2)} isSelected={selectedOption === 2} hasPadding width={592} content="Changing activities often" />
                    <HorizontalCard onClick={() => setSelectedOption(selectedOption === 3 ? null : 3)} isSelected={selectedOption === 3} hasPadding width={592} content="It depends on my mood" />
                </div>
                <div className="flex flex-col gap-4 items-center justify-center">
                    <button
                        type="button"
                        onClick={onNext}
                        disabled={selectedOption === null}
                        className={`bg-indigo mt-10 text-white rounded-2xl px-6 py-4 outline-none w-[592px] transition-all ${selectedOption === null ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
                    >Finish</button>
                </div>
            </main>
        </div>
    )
}