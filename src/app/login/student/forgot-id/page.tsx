"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/shared/ui";

const mockStudents = [
    { id: "NEVO-XXX-234", name: "Chioma Okeke" },
    { id: "NEVO-XXX-567", name: "Emeka Obi" },
    { id: "NEVO-XXX-891", name: "Amaka Eze" },
    { id: "NEVO-XXX-123", name: "Adaeze Nwosu" }
];

export default function ForgotIdPage() {
    const router = useRouter();
    const [schoolCode, setSchoolCode] = useState("");
    const [isFound, setIsFound] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleFindId = () => {
        if (!schoolCode) return;
        setIsLoading(true);

        // Mock API call
        setTimeout(() => {
            setIsLoading(false);
            setIsFound(true);
        }, 800);
    };

    return (
        <div className="flex-1 w-full flex flex-col items-center mt-6 mb-10 px-6 max-w-2xl mx-auto">
            {/* Top Back Arrow */}
            <div className="w-full mb-8">
                <button type="button" onClick={() => router.back()} className="text-[#3B3F6E] opacity-70 hover:opacity-100 transition-opacity p-2 -ml-2 cursor-pointer">
                    <Icon type="back" width={16} height={16} />
                </button>
            </div>

            <header className="flex flex-col gap-3 mb-8 w-full">
                <h1 className="font-extrabold text-[#3B3F6E] text-[20px] text-left">Lost your ID?</h1>
                <p className="font-medium text-[12px] opacity-70 text-graphite text-left max-w-md">
                    Your teacher can help you find it. Or enter your school code below and we'll guide you.
                </p>
            </header>

            {!isFound ? (
                <div className="flex flex-col w-full">
                    <input
                        type="text"
                        placeholder="Enter your school code"
                        value={schoolCode}
                        onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                        autoCapitalize="characters"
                        className="w-full bg-transparent border border-[#3B3F6E]/20 focus:border-[#3B3F6E]/50 rounded-[8px] px-4 py-[14px] outline-none transition-colors text-[13.5px] font-medium placeholder:text-[#3B3F6E]/60 text-[#3B3F6E] mb-5"
                    />

                    <button
                        onClick={handleFindId}
                        disabled={!schoolCode || isLoading}
                        className={`w-full text-white font-bold rounded-xl py-[14px] text-[14px] outline-none transition-all ${
                            !schoolCode
                                ? 'bg-[#9A9BB5] cursor-not-allowed opacity-90'
                                : 'bg-[#3B3F6E] hover:opacity-90 active:scale-[0.98] cursor-pointer'
                        }`}
                    >
                        {isLoading ? 'Wait...' : 'Find my ID'}
                    </button>

                    <div className="flex items-center w-full gap-4 my-7">
                        <div className="h-px bg-[#3B3F6E]/10 flex-1"></div>
                        <span className="text-[11px] text-[#3B3F6E]/40 font-semibold lowercase">or</span>
                        <div className="h-px bg-[#3B3F6E]/10 flex-1"></div>
                    </div>

                    <div className="w-full border border-[#3B3F6E]/10 rounded-xl p-5 bg-[#3B3F6E]/[0.02]">
                        <h2 className="text-[14px] font-bold text-[#3B3F6E] mb-2">Ask your teacher</h2>
                        <p className="text-[12px] text-graphite opacity-60 font-medium">
                            Show your teacher this screen and they can look up your ID from their student list.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col w-full">
                    <h2 className="text-[14px] font-bold text-[#3B3F6E] mb-4">Is this you?</h2>
                    
                    <div className="flex flex-col gap-3">
                        {mockStudents.map((student, idx) => (
                            <button
                                key={idx}
                                onClick={() => router.push('/login/student')}
                                className="w-full border border-[#3B3F6E]/15 rounded-[12px] p-5 flex items-center justify-between transition-colors hover:bg-black/[0.02] active:scale-[0.99] cursor-pointer"
                            >
                                <div className="flex flex-col items-start gap-1">
                                    <span className="font-bold text-[13.5px] text-[#3B3F6E]">{student.name}</span>
                                    <span className="font-medium text-[12px] text-graphite opacity-50 uppercase tracking-wide">{student.id}</span>
                                </div>
                                <div className="text-[#3B3F6E]/30">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
