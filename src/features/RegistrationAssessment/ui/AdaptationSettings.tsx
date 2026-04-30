"use client";

import { useState } from "react";
import { useRegistrationStore } from "@/shared/store/useRegistrationStore";

export function AdaptationSettings({ onNext }: { onNext: () => void }) {
    const { isAutoAdapt, setIsAutoAdapt } = useRegistrationStore();

    return (
        <div className="w-full h-full flex flex-col flex-1 relative bg-parchment pb-12">
            <main className="px-6 flex-1 flex flex-col items-center justify-center mt-6 w-full">
                
                <div className="w-[72px] h-[72px] bg-lavender rounded-full flex items-center justify-center text-white mb-8">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="6" cy="6" r="3.5" stroke="currentColor" strokeWidth="2.5"/>
                        <circle cx="18" cy="6" r="3.5" stroke="currentColor" strokeWidth="2.5"/>
                        <circle cx="6" cy="18" r="3.5" stroke="currentColor" strokeWidth="2.5"/>
                        <circle cx="18" cy="18" r="3.5" stroke="currentColor" strokeWidth="2.5"/>
                    </svg>
                </div>
                
                <h1 className="text-3xl font-extrabold text-indigo mb-6 tracking-tight">Nevo learns how you learn.</h1>
                
                <p className="text-graphite-80 text-sm font-medium mb-12 text-center max-w-[380px] leading-relaxed">
                    As you go through lessons, Nevo will quietly adjust<br/>
                    to suit you better. You're always in control — you can<br/>
                    change things anytime in your profile.
                </p>

                <div className="flex items-center gap-4 mb-4">
                    <span className="text-indigo font-bold text-sm">Adapt automatically</span>
                    <button 
                        onClick={() => setIsAutoAdapt(!isAutoAdapt)}
                        className={`w-[52px] h-[28px] rounded-full relative transition-colors duration-300 flex items-center cursor-pointer px-[2px] ${isAutoAdapt ? 'bg-indigo' : 'bg-transparent border border-[#E0D9CE]'}`}
                    >
                        <div className={`w-[22px] h-[22px] rounded-full transition-transform duration-300 shadow-sm ${isAutoAdapt ? 'bg-white translate-x-[24px]' : 'bg-white border border-[#E0D9CE] translate-x-0'}`} />
                    </button>
                </div>
                
                <p className="text-graphite-60 text-[11px] font-medium mb-10">You can turn this off in settings anytime.</p>

                <button
                    onClick={onNext}
                    className="w-[180px] bg-indigo text-white py-3.5 text-center rounded-xl text-md font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 cursor-pointer"
                >
                    Let's go
                </button>
            </main>
        </div>
    );
}
