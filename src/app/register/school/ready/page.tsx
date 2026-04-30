"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/shared/ui";

export default function SchoolReadyPage() {
    const router = useRouter();
    const [showCopied, setShowCopied] = useState(false);

    // Hardcoded logic for the mock design
    const codeString = "NEVO-SCH-4X2";
    const schoolName = "Lagos International School";

    const handleCopy = () => {
        // Technically copies to clipboard if API allows
        if (typeof window !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(codeString).catch(() => {});
        }
        
        // Show banner
        setShowCopied(true);
    };

    useEffect(() => {
        if (showCopied) {
            const timer = setTimeout(() => {
                setShowCopied(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showCopied]);

    return (
        <div className="flex-1 w-full flex flex-col items-center p-6 min-h-screen relative overflow-x-hidden">
            {/* Top Toast Layout Native Drop */}
            <div className={`fixed bg-[#3B3F6E] flex justify-center max-w-lg rounded-lg py-[14px] px-8 transition-all duration-500 z-50 shadow-md ${
                showCopied ? "top-4 opacity-100" : "-top-20 opacity-0"
            }`}>
                <span className="text-white text-[13px] font-bold tracking-wide">Code copied to clipboard</span>
            </div>

            <div className="w-full max-w-[1000px] flex items-center justify-between mx-auto md:px-6 mt-4">
                <button type="button" onClick={() => router.back()} className="flex items-center gap-[6px] text-[#3B3F6E] hover:opacity-70 transition-opacity p-2 -ml-2 select-none cursor-pointer">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="font-bold text-[14px] mt-[1px]">Setup</span>
                </button>
                <span className="font-bold text-[13px] text-[#A29ECA] mr-2">Setup 3 of 3</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[620px] mx-auto pb-10">
                <h1 className="font-bold text-indigo text-[24px] tracking-tight mb-3">Your school is ready.</h1>
                <p className="text-[15px] text-graphite opacity-60 mb-8 text-center max-w-[500px]">
                    Share this code with teachers and students to join
                </p>

                {/* Secure Border Block */}
                <div className="w-[440px] bg-transparent border-2 border-indigo rounded-2xl flex flex-col items-center justify-center py-10 shadow-sm relative mb-4">
                    <h2 className="text-3-4xl font-bold text-indigo tracking-tight mb-6 select-all">{codeString}</h2>
                    <p className="text-sm text-[#000] opacity-60 select-none">
                        {schoolName}
                    </p>
                </div>

                {/* Sub Buttons */}
                <div className="flex items-center justify-center gap-2 w-full mb-6">
                    <button 
                        type="button" 
                        onClick={handleCopy}
                        className="w-[180px] flex items-center justify-center font-medium text-[15px] text-[#3B3F6E] border-2 border-[#3B3F6E] rounded-lg py-[10px] hover:bg-[#3B3F6E]/5 active:scale-[0.98] transition-all cursor-pointer"
                    >
                        Copy code
                    </button>
                    <button 
                        type="button" 
                        className="w-[180px] flex items-center justify-center font-medium text-[15px] text-[#3B3F6E] border-2 border-[#3B3F6E] rounded-lg py-[10px] hover:bg-[#3B3F6E]/5 active:scale-[0.98] transition-all cursor-pointer"
                    >
                        Download QR
                    </button>
                </div>

                {/* Target Mock QR Logic Vector Render */}
                <div className="flex items-center justify-center w-full mb-[42px]">
                    <Icon type="qr" width={120} height={120} />
                </div>

                <div className="flex flex-col items-center gap-3 w-full mb-[85px] max-w-[480px]">
                    <p className="text-sm text-graphite opacity-60">Share via</p>
                    <div className="flex items-center justify-center gap-3">
                        <button type="button" className="px-5 py-2.5 rounded-full border-2 border-[#3B3F6E] text-[#3B3F6E] text-sm font-medium hover:bg-[#3B3F6E]/5 transition-colors cursor-pointer">
                            Email
                        </button>
                        <button type="button" className="px-5 py-2.5 rounded-full border-2 border-[#3B3F6E] text-[#3B3F6E] text-sm font-medium hover:bg-[#3B3F6E]/5 transition-colors cursor-pointer">
                            WhatsApp
                        </button>
                        <button type="button" className="px-5 py-2.5 rounded-full border-2 border-[#3B3F6E] text-[#3B3F6E] text-sm font-medium hover:bg-[#3B3F6E]/5 transition-colors cursor-pointer">
                            SMS
                        </button>
                    </div>
                </div>

                <div className="w-full px-4 max-w-[480px]">
                    <button
                        type="button"
                        onClick={() => router.push('/register/school/success')}
                        className="w-full font-bold rounded-[8px] py-[15px] text-[14px] outline-none transition-all shadow-sm bg-[#3B3F6E] hover:opacity-90 text-white cursor-pointer active:scale-[0.98]"
                    >
                        Go to admin dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
