"use client";

import { useState, useEffect } from "react";
import { ActionButton } from "@/shared/ui";

export function Completion({ onNext }: { onNext: () => void }) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((oldProgress) => {
                if (oldProgress >= 100) {
                    clearInterval(timer);
                    return 100;
                }
                const diff = Math.random() * 8 + 2;
                return Math.min(oldProgress + diff, 100);
            });
        }, 150);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col items-center justify-between h-full">
            <main className="flex flex-col items-center justify-center">
                <p className="text-sm text-indigo font-semibold mb-4">Assessment complete</p>
                <h1 className="text-40px font-extrabold mb-4">Thank you.</h1>
                <p className="text-lg font-medium w-[458px] text-graphite-80 text-center">Nevo is setting up learning in a way that fits you. This will only take a moment.</p>

                <div className="mb-12 mt-10 flex flex-col items-center gap-3 w-full max-w-[320px]">
                    <div className="w-full bg-indigo-10 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-indigo h-full rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-indigo text-sm font-medium">Preparing your dashboard…</p>
                </div>

                <button
                    disabled={progress < 100}
                    onClick={onNext}
                    className={`w-80 bg-indigo text-white py-3 text-center rounded-2xl text-lg font-semibold transition-all duration-300 ${progress < 100 ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'opacity-100 hover:opacity-90 cursor-pointer'}`}
                >
                    Continue
                </button>
            </main>
        </div>
    )
}