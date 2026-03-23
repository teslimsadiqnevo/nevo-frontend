'use client'

import { Input, Icon } from "@/shared/ui";
import { useState, useRef, useEffect } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { useRouter } from "next/navigation";
import { loginStudent } from "../api/loginStudent";

export function StudentLoginForm() {
    const router = useRouter();
    const [nevoID, setNevoID] = useState('')
    const [pin, setPin] = useState('')
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                        (result, err, controls) => {
                            if (result) {
                                controls.stop();
                                setNevoID(result.getText());
                                handleSubmit();
                            }
                            if (err && err.name !== 'NotFoundException') {
                                console.error('QR Decode error:', err);
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

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        const result = await loginStudent({ nevoId: nevoID, pin });
        
        stopScanner();
        setIsLoading(false);

        if (result.error) {
            setError(result.error);
        } else {
            // router.push('/dashboard');
            console.log(result);
        }
    };

    if (isScanning) {
        return (
            <div className="flex flex-col items-center justify-center gap-6 w-[512px] h-[340px] relative overflow-hidden bg-black rounded-[24px]">
                <video ref={videoRef} className="w-full h-full object-cover" />
                <div className="absolute inset-0 border-4 border-indigo/50 m-8 rounded-xl pointer-events-none"></div>
                
                {isLoading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl z-20">
                        <p className="text-white font-semibold text-lg animate-pulse">Signing in...</p>
                    </div>
                )}

                <button
                    onClick={stopScanner}
                    className="absolute bottom-6 w-48 py-3 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm rounded-xl font-semibold transition-all cursor-pointer z-10"
                >
                    Cancel Scan
                </button>
            </div>
        )
    }

    return (
        <form className="flex flex-col items-center justify-center gap-6" onSubmit={handleSubmit}>
            <Input label="Nevo ID" width={512} placeholder="e.g., NEVO-7K3P2" name="ID" type="text" value={nevoID} onChange={(e) => setNevoID(e.target.value) } />
            <Input label="4-digit PIN" width={512} placeholder="••••" name="pin" type="password" value={pin} onChange={(e) => setPin(e.target.value) } />

            {error && (
                <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-2xl w-[512px]">
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="bg-[#3B3F6E] text-white font-semibold rounded-2xl cursor-pointer py-4 outline-none w-[512px] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center mt-2"
            >
                {isLoading ? 'Signing in...' : 'Sign in'}
            </button>

            <button type="button" onClick={startScanner} className="flex items-center justify-center gap-2 mt-4 text-[#3B3F6E] text-sm font-medium cursor-pointer bg-transparent outline-none border-none">
                <Icon type="qr" width={20} height={20} />
                <span>Show my QR instead</span>
            </button>

            <div className="mt-8 text-sm text-[#3B3F6E] font-medium cursor-pointer transition-colors hover:text-indigo">
                Need help? Ask your teacher
            </div>
        </form>
    )
}