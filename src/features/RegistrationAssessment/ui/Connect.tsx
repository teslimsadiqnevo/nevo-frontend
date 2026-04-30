"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BrowserQRCodeReader } from "@zxing/browser";
import { connectTeacher } from "../api/connectTeacher";
import { useRegistrationStore } from "@/shared/store/useRegistrationStore";

export function Connect() {
    const router = useRouter();
    const [code, setCode] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [teacherName, setTeacherName] = useState<string | null>(null);
    const { token } = useRegistrationStore();

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

    const performConnection = async (teacherId: string) => {
        if (!token) {
            setError("You must be registered to connect. Missing token.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const result = await connectTeacher({ teacherId, token });
            if (result.error) {
                setError(result.error);
                setIsConnected(false);
            } else {
                setIsConnected(true);
                if (result.data?.teacher_name || result.data?.teacher?.name) {
                    setTeacherName(result.data.teacher_name || result.data.teacher.name);
                }
            }
        } catch (err) {
            setError("Failed to connect to teacher.");
            setIsConnected(false);
        } finally {
            setIsLoading(false);
        }
    };

    const startScanner = async () => {
        try {
            setIsScanning(true);
            setError(null);
            codeReaderRef.current = new BrowserQRCodeReader();

            setTimeout(async () => {
                if (videoRef.current && codeReaderRef.current) {
                    await codeReaderRef.current.decodeFromVideoDevice(
                        undefined,
                        videoRef.current,
                        (result, decodeError, controls) => {
                            if (result) {
                                const scannedText = result.getText();
                                setCode(scannedText);
                                controls.stop();
                                setIsScanning(false);
                                performConnection(scannedText);
                            }
                            if (decodeError && decodeError.name !== 'NotFoundException') {
                                console.error('QR Decode error:', decodeError);
                            }
                        }
                    );
                }
            }, 100);
        } catch (err) {
            console.error("Failed to start scanner", err);
            setIsScanning(false);
            setError("Failed to access camera.");
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

    const handleConnect = () => {
        if (code.trim() !== "") {
            performConnection(code.trim());
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center w-full relative mt-8 mb-10">
            <h1 className="text-[22px] font-extrabold text-indigo mb-2">Connect to your teacher</h1>
            <p className="text-[13px] text-graphite-60 font-medium mb-8">Scan your teacher's QR code or enter their code.</p>

            {/* Scan QR Code Card */}
            <div className={`w-[480px] rounded-2xl border flex flex-col p-6 bg-transparent relative mb-4 transition-colors duration-300 ${isConnected && code === "QR-CODE-SCANNED" ? 'border-[#7DBF83]' : 'border-indigo/80'}`}>
                {isConnected && code === "QR-CODE-SCANNED" && (
                    <div className="absolute top-5 right-5 text-[#7DBF83]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" fill="currentColor"/>
                            <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                )}
                <div className="flex justify-between items-start">
                    <div className="flex flex-col items-start gap-1">
                        <div className="text-indigo mb-2 opacity-80">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="4" y="4" width="6" height="6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                <rect x="14" y="4" width="6" height="6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                <rect x="4" y="14" width="6" height="6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                <path d="M14 14H20V20H14V14Z" fill="currentColor" stroke="currentColor" strokeWidth="1"/>
                            </svg>
                        </div>
                        <h2 className="text-[15px] font-bold text-indigo">Scan QR code</h2>
                        <p className="text-[13px] text-graphite-60 font-medium">Point your camera at your teacher's QR code.</p>
                    </div>
                    <button onClick={startScanner} disabled={isConnected} className="px-[18px] py-[9px] bg-indigo text-white rounded-full text-[13px] font-bold active:scale-95 transition-all cursor-pointer hover:bg-opacity-90 disabled:opacity-50">
                        Open scanner
                    </button>
                </div>
            </div>

            {/* Enter Code Card */}
            <div className={`w-[480px] rounded-2xl border flex flex-col p-6 bg-transparent relative mb-6 transition-colors duration-300 ${(isConnected && code !== "QR-CODE-SCANNED") ? 'border-[#7DBF83]' : 'border-indigo/80'}`}>
                {(isConnected && code !== "QR-CODE-SCANNED") && (
                    <div className="absolute top-5 right-5 text-[#7DBF83]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" fill="currentColor"/>
                            <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                )}
                <div className="flex flex-col items-start gap-1">
                    <div className="text-indigo mb-2 opacity-80">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
                            <path d="M7 10H8M10 10H11M13 10H14M16 10H17M7 14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </div>
                    <h2 className="text-[15px] font-bold text-indigo">Enter teacher code</h2>
                    <p className="text-[13px] text-graphite-60 font-medium mb-4">Type the code your teacher gave you.</p>

                    <div className="flex gap-4 w-full">
                        <input
                            type="text"
                            placeholder="Enter code"
                            value={code === "QR-CODE-SCANNED" ? "" : code}
                            onChange={(e) => setCode(e.target.value)}
                            disabled={isConnected}
                            className="flex-1 bg-transparent border border-indigo/20 rounded-[12px] px-[18px] py-[14px] outline-none focus:border-indigo/50 transition-colors text-[14px] text-indigo font-medium placeholder:text-graphite-50 disabled:opacity-80"
                        />
                        <button
                            onClick={handleConnect}
                            disabled={!code || isConnected || isLoading}
                            className={`px-8 rounded-[12px] text-[14px] font-bold transition-all ${
                                !code || isConnected || isLoading ? 'bg-indigo opacity-80 text-white shadow-sm cursor-not-allowed' : 'bg-indigo text-white hover:opacity-90 active:scale-95 cursor-pointer'
                            }`}
                        >
                            {isLoading ? 'Connecting...' : 'Connect'}
                        </button>
                    </div>
                    {error && (
                        <p className="text-[12px] text-[#E57661] font-medium mt-2">{error}</p>
                    )}
                </div>
            </div>

            {isConnected ? (
                <div className="flex flex-col items-center w-full">
                    <p className="text-[13px] font-bold text-[#7DBF83] mb-6">Connected to {teacherName || "your teacher"}</p>
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="w-[480px] py-[18px] bg-indigo text-white rounded-[14px] text-[15px] font-bold hover:opacity-90 transition-all cursor-pointer"
                    >
                        Go to my dashboard
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => router.push("/dashboard")}
                    className="text-[13px] text-[#A29ECA] font-semibold underline underline-offset-4 hover:text-indigo transition-colors mt-2"
                >
                    Skip for now
                </button>
            )}

            {isScanning && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-[480px] h-[480px] overflow-hidden rounded-[32px] relative shadow-2xl">
                        <video ref={videoRef} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 border-4 border-white/50 m-10 rounded-2xl pointer-events-none"></div>
                        <button
                            onClick={stopScanner}
                            className="absolute bottom-6 left-1/2 -translate-x-1/2 px-10 py-3 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md rounded-full font-bold transition-all cursor-pointer box-border border border-white/30"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}