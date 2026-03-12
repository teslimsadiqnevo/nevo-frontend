"use client";

import { useState, useRef, ChangeEvent, KeyboardEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BrowserQRCodeReader } from "@zxing/browser";

const QRIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 8V6C4 4.89543 4.89543 4 6 4H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 16V18C4 19.1046 4.89543 20 6 20H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 4H18C19.1046 4 20 4.89543 20 6V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 20H18C19.1046 20 20 19.1046 20 18V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="8" y="8" width="3" height="3" fill="currentColor" />
        <rect x="13" y="8" width="3" height="3" fill="currentColor" />
        <rect x="8" y="13" width="3" height="3" fill="currentColor" />
        <rect x="13" y="13" width="3" height="3" fill="currentColor" />
    </svg>
)

export function Connect() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("scan");
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [qrValidated, setQrValidated] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);

    useEffect(() => {
        return () => {

            if (isScanning && videoRef.current) {
                const stream = videoRef.current.srcObject as MediaStream;
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
            }
        };
    }, [isScanning]);

    const startScanner = async () => {
        try {
            setIsScanning(true);
            codeReaderRef.current = new BrowserQRCodeReader();


            setTimeout(async () => {
                if (videoRef.current && codeReaderRef.current) {
                    await codeReaderRef.current.decodeFromVideoDevice(
                        undefined,
                        videoRef.current,
                        (result, error, controls) => {
                            if (result) {

                                setQrValidated(true);
                                controls.stop();
                                setIsScanning(false);
                            }
                            if (error && error.name !== 'NotFoundException') {
                                console.error('QR Decode error:', error);
                            }
                        }
                    );
                }
            }, 100);
        } catch (err) {
            console.error("Failed to start scanner", err);
            setIsScanning(false);
        }
    };

    const stopScanner = () => {
        setIsScanning(false);
        if (videoRef.current) {
            const stream = videoRef.current.srcObject as MediaStream;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        }
    };

    const isComplete = (activeTab === "code" && code.every((c) => c !== "")) || (activeTab === "scan" && qrValidated);

    const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase();
        if (!/^[A-Z0-9]?$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);


        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {

        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center w-full justify-between pb-6">
            <div className="flex flex-col items-center mt-12 w-full">
                <p className="text-sm font-semibold text-indigo mb-4">Connect your learning space</p>
                <h1 className="text-40px font-extrabold text-graphite mb-4">Add your teacher</h1>
                <p className="text-lg font-medium text-graphite-80 w-[454px] text-center mb-8">This helps Nevo personalise your lessons and makes account support easy.</p>

                <div className="flex bg-graphite-10 p-1.5 rounded-2xl mb-8 w-[420px]">
                    <button
                        onClick={() => setActiveTab("scan")}
                        className={`flex-1 py-3 text-sm font-semibold cursor-pointer rounded-xl transition-all ${activeTab === "scan" ? "bg-white text-indigo shadow-sm" : "text-graphite-60"}`}
                    >
                        Scan QR
                    </button>
                    <button
                        onClick={() => setActiveTab("code")}
                        className={`flex-1 py-3 text-sm font-semibold cursor-pointer rounded-xl transition-all ${activeTab === "code" ? "bg-white text-indigo shadow-sm" : "text-graphite-60"}`}
                    >
                        Enter Class Code
                    </button>
                </div>

                {activeTab === "scan" ? (
                    <div className="card w-[420px] px-8 py-10 flex flex-col items-center bg-white border border-graphite-5 rounded-[24px] shadow-sm mb-12 h-[300px] relative overflow-hidden">
                        {isScanning ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black rounded-[24px]">
                                <video ref={videoRef} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 border-4 border-indigo/50 m-8 rounded-xl pointer-events-none"></div>
                                <button
                                    onClick={stopScanner}
                                    className="absolute bottom-6 w-32 py-2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm rounded-xl font-semibold transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="w-12 h-12 bg-[#F0F0F5] text-indigo rounded-full flex items-center justify-center mb-5">
                                    <QRIcon />
                                </div>
                                <h2 className="text-xl font-extrabold mb-3">{qrValidated ? "QR Code Scanned!" : "Scan Teacher QR Code"}</h2>
                                <p className="text-sm font-medium text-graphite-60 text-center w-[280px] mb-8">
                                    {qrValidated ? "Successfully verified teacher connection." : "Point the tablet camera at the QR code your teacher provides."}
                                </p>

                                <button
                                    onClick={startScanner}
                                    className="w-full mt-auto py-3 cursor-pointer border-[1.5px] border-indigo text-indigo font-semibold rounded-2xl transition-all hover:bg-indigo-5"
                                >
                                    {qrValidated ? "Scan Again" : "Open Scanner"}
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="card w-[420px] px-8 py-10 flex flex-col items-center bg-white border border-graphite-5 rounded-[24px] shadow-sm mb-12 h-[300px]">
                        <div className="flex-1 flex flex-col items-center justify-center w-full">
                            <h2 className="text-xl font-extrabold mb-3">Enter Class Code</h2>
                            <p className="text-sm font-medium text-graphite-60 text-center w-[280px] mb-8">Ask your teacher for the 6-character class code.</p>

                            <div className="flex gap-2">
                                {code.map((char, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => { inputRefs.current[index] = el; }}
                                        type="text"
                                        maxLength={1}
                                        value={char}
                                        onChange={(e) => handleChange(index, e)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="w-[48px] h-[56px] bg-white rounded-[12px] text-center text-xl font-semibold text-indigo outline-none border border-graphite-10 focus:border-indigo transition-colors shadow-sm uppercase"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col items-center mb-12">
                    <p className="text-[10px] font-bold tracking-wider text-graphite-60 mb-2 uppercase">Pending connections</p>
                    <p className="text-sm font-medium italic text-graphite-40">None yet</p>
                </div>

                <button
                    disabled={!isComplete}
                    onClick={() => router.push("/")}
                    className={`w-[320px] py-4 rounded-2xl text-lg font-semibold mb-8 transition-all ${isComplete ? 'bg-indigo text-white cursor-pointer hover:bg-indigo-80' : 'bg-[#9A9BB5] text-white cursor-not-allowed'}`}
                >
                    Continue
                </button>
            </div>

            <p className="text-sm font-medium text-graphite-60 mt-auto">Your teacher can help you reset your PIN if you ever need to.</p>
        </div>
    )
}