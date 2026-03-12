"use client";

import { useState, useRef, ChangeEvent, KeyboardEvent } from "react";
import { Icon } from "@/shared/ui";
import QRCode from "react-qr-code";

export function Onboarding({ onNext }: { onNext: () => void }) {
    const [pin, setPin] = useState(["", "", "", ""]);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [showQR, setShowQR] = useState(false);
    const [copied, setCopied] = useState(false);
    const nevoId = "NEVO-7K3P2";

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(nevoId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (!/^[0-9]?$/.test(value)) return;

        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);


        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {

        if (e.key === "Backspace" && !pin[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <div className="flex flex-col p-6 items-center">
            <p className="text-indigo mb-4.75 text-sm font-semibold">Almost ready</p>
            <h1 className="text-40px font-extrabold mb-4">This is your Nevo ID</h1>
            <p className="w-[454px] text-lg text-graphite-80 text-center mb-10 font-medium">You&apos;ll use this ID to log in again — even on a different tablet.</p>

            <div className="card p-8.25 mb-10 flex flex-col items-center w-[414px] justify-center rounded-3xl border border-graphite-5 bg-white relative">
                <p className="text-xs font-bold text-graphite-60 mb-4">YOUR NEVO ID</p>
                <p className="text-4xl mb-6 font-bold">{nevoId}</p>
                <div className="flex items-center justify-center gap-6">
                    <div className="flex gap-2 items-center cursor-pointer transition-all active:scale-95" onClick={copyToClipboard}>
                        <Icon type={copied ? "checkmark" : "clipboard"} width={18} height={18} />
                        <p className="text-indigo font-semibold transition-all duration-200 w-16 whitespace-nowrap overflow-hidden text-center">{copied ? "Copied!" : "Copy ID"}</p>
                    </div>
                    <div className="w-px h-4 bg-graphite-10"></div>
                    <div>
                        <p className="text-indigo cursor-pointer font-semibold transition-all active:scale-95" onClick={() => setShowQR(true)}>
                            Show QR
                        </p>
                        {showQR && (
                            <div
                                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                                onClick={() => setShowQR(false)}
                            >
                                <div
                                    className="p-8 bg-white rounded-3xl shadow-2xl flex flex-col items-center gap-6 w-[360px]"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <h2 className="text-2xl font-bold">Your Nevo ID</h2>
                                    <QRCode value={nevoId} size={200} />
                                    <button
                                        className="bg-indigo-10 text-indigo font-semibold px-6 py-2 rounded-xl mt-2 w-full hover:bg-indigo-20 transition-colors"
                                        onClick={() => setShowQR(false)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center">
                <p className="text-xl font-bold mb-2">Create a simple 4-digit PIN</p>
                <p className="text-sm text-graphite-60 mb-6">This helps keep your learning space private.</p>

                <div className="flex gap-3">
                    {pin.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-[64px] h-[64px] bg-white rounded-[16px] text-center text-2xl font-semibold text-indigo outline-none border border-transparent focus:border-indigo transition-colors shadow-sm"
                        />
                    ))}
                </div>

                <p className="mt-4 text-sm font-medium text-graphite-60 mb-12">Choose something easy to remember.</p>
                <button
                    onClick={onNext}
                    className={`w-80 bg-indigo text-white cursor-pointer py-3 text-center rounded-2xl text-lg font-semibold`}
                >
                    Save and Continue
                </button>
            </div>
        </div>
    )
}