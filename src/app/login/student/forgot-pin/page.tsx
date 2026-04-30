"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/shared/ui";

export default function ForgotPinPage() {
    const router = useRouter();
    const [nevoID, setNevoID] = useState("");
    const [isFound, setIsFound] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleFindAccount = () => {
        if (!nevoID) return;
        setIsLoading(true);

        // Mock API call
        setTimeout(() => {
            setIsLoading(false);
            setIsFound(true);
        }, 800);
    };

    return (
        <div className="flex-1 w-full flex flex-col justify-center items-center mt-12 mb-10">
            <header className="flex flex-col items-center justify-center gap-2 mb-8">
                <h1 className="font-extrabold text-[#3B3F6E] text-[22px]">Forgot your PIN?</h1>
                <p className="font-medium text-[13px] text-graphite-60 text-center w-[360px]">
                    Your teacher can reset it for you from their student list. Or enter your Nevo ID below and we'll guide you.
                </p>
            </header>

            {!isFound ? (
                <div className="flex flex-col items-center w-[456px]">
                    <input
                        type="text"
                        placeholder="Your Nevo ID"
                        value={nevoID}
                        onChange={(e) => setNevoID(e.target.value.toUpperCase())}
                        autoCapitalize="characters"
                        className="w-full bg-transparent border border-[#3B3F6E]/20 focus:border-[#3B3F6E]/50 rounded-[8px] px-4 py-3 outline-none transition-colors text-[13px] font-medium placeholder:text-[#3B3F6E]/40 text-[#3B3F6E] mb-4"
                    />

                    <button
                        onClick={handleFindAccount}
                        disabled={!nevoID || isLoading}
                        className={`w-full text-white font-bold rounded-xl py-[14px] text-[14px] outline-none transition-all ${
                            !nevoID
                                ? 'bg-[#9A9BB5] cursor-not-allowed opacity-90'
                                : 'bg-[#3B3F6E] hover:opacity-90 active:scale-95 cursor-pointer'
                        }`}
                    >
                        {isLoading ? 'Wait...' : 'Find my account'}
                    </button>

                    <div className="flex items-center w-full gap-4 my-6">
                        <div className="h-px bg-[#3B3F6E]/10 flex-1"></div>
                        <span className="text-[11px] text-[#3B3F6E]/40 font-semibold">or</span>
                        <div className="h-px bg-[#3B3F6E]/10 flex-1"></div>
                    </div>

                    <button type="button" onClick={() => setIsFound(true)} className="w-full border border-[#3B3F6E]/10 rounded-2xl p-4.25 text-left active:scale-[0.98] transition-transform cursor-pointer hover:bg-black/5 block">
                        <h2 className="text-[15px] font-semibold text-[#3B3F6E] mb-2">Ask your teacher</h2>
                        <p className="text-[13px] text-graphite opacity-60">
                            Show your teacher this screen. They can reset your PIN from their students list.
                        </p>
                    </button>

                    <button type="button" onClick={() => router.back()} className="mt-6 text-[#3B3F6E] opacity-60 cursor-pointer transition-opacity hover:opacity-100 p-2">
                        <Icon type="back" width={16} height={16} />
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center w-[360px] mt-6">
                    <p className="text-[13px] text-graphite-60 font-medium text-center mb-8 w-[320px]">
                        We found your account. Your teacher has been notified to reset your PIN.
                    </p>

                    <button
                        onClick={() => router.push('/login/student')}
                        className="w-full border border-[#3B3F6E]/30 text-[#3B3F6E] bg-transparent font-bold rounded-2xl py-[14px] text-[14px] outline-none transition-all hover:bg-[#3B3F6E]/5 active:scale-95 cursor-pointer mb-6"
                    >
                        Back to login
                    </button>

                    <button type="button" onClick={() => router.back()} className="text-[#3B3F6E] opacity-60 cursor-pointer transition-opacity hover:opacity-100 p-2">
                        <Icon type="back" width={16} height={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
