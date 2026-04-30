"use client";

import { useState } from "react";
import { Icon } from "@/shared/ui";
import QRCode from "react-qr-code";
import { useRegistrationStore } from "@/shared/store/useRegistrationStore";

export function Onboarding({ onNext }: { onNext: () => void }) {
    const storedNevoId = useRegistrationStore((s) => s.nevoId);
    const [showQR, setShowQR] = useState(false);
    const [copied, setCopied] = useState(false);
    const nevoId = storedNevoId || "NEVO-XXXXX";

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(nevoId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };



    return (
        <div className="flex-1 w-full flex flex-col justify-center items-center relative mt-8 mb-10">
            {/* Top Icon */}
            <div className="w-[88px] h-[88px] bg-[#EAE8F2] rounded-[24px] flex items-center justify-center text-[#B0ADCD] mb-6">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.25"/>
                    <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.25"/>
                    <path d="M12 9.5V12L13.5 13.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>

            <h1 className="text-[26px] font-extrabold text-indigo mb-3">You're all set.</h1>
            <p className="text-[15px] text-graphite-60 font-medium mb-8">Your Nevo account has been created.</p>

            <div className="w-[480px] rounded-2xl border border-indigo/80 flex flex-col items-center pt-8 pb-7 bg-transparent relative mb-5">
                <p className="text-[12px] font-bold text-lavender tracking-wider mb-5">YOUR NEVO ID</p>
                <p className="text-[32px] font-bold text-indigo tracking-[0.2em] mb-7">{nevoId}</p>
                <div className="flex items-center gap-3">
                    <button className="px-5 py-[9px] rounded-full border border-indigo/80 text-indigo text-[13px] font-bold active:scale-95 transition-all cursor-pointer hover:bg-black/5" onClick={copyToClipboard}>
                        {copied ? "Copied!" : "Copy ID"}
                    </button>
                    <button className="px-5 py-[9px] rounded-full border border-indigo/80 text-indigo text-[13px] font-bold active:scale-95 transition-all cursor-pointer hover:bg-black/5" onClick={() => setShowQR(true)}>
                        Show QR
                    </button>
                </div>
            </div>

            <p className="text-[13px] text-graphite-60 font-medium mb-8">Remember this ID — you'll need it to log in.</p>

            <button
                onClick={onNext}
                className="w-[480px] bg-indigo text-white py-[18px] rounded-[14px] text-[15px] font-bold transition-all duration-200 hover:opacity-90 active:scale-95 cursor-pointer"
            >
                Continue
            </button>

            {/* QR Modal */}
            {showQR && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={() => setShowQR(false)}
                >
                    <div
                        className="p-8 bg-white rounded-3xl shadow-2xl flex flex-col items-center gap-6 w-[360px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold text-indigo">Your Nevo ID</h2>
                        <QRCode value={nevoId} size={200} />
                        <button
                            className="bg-indigo-10 text-indigo font-semibold px-6 py-3 rounded-xl w-full hover:bg-indigo-20 transition-colors cursor-pointer"
                            onClick={() => setShowQR(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}