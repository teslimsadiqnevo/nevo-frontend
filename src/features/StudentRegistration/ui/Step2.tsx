'use client'

import { useState } from "react";
import { Icon } from "@/shared/ui";

export function Step2({ onNext }: { onNext: () => void }) {
    const [micPermission, setMicPermission] = useState<"prompt" | "granted" | "denied">("prompt");
    const [camPermission, setCamPermission] = useState<"prompt" | "granted" | "denied">("prompt");

    const requestMic = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            setMicPermission("granted");
        } catch (err) {
            setMicPermission("denied");
            console.error("Microphone permission denied", err);
        }
    };

    const requestCam = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ video: true });
            setCamPermission("granted");
        } catch (err) {
            setCamPermission("denied");
            console.error("Camera permission denied", err);
        }
    };

    return (
        <div>
            <main className="px-4 flex flex-col mb-6.75 items-center justify-center">
                <header className="pt-8 flex flex-col gap-2 items-center justify-center pb-10">
                    <p className="font-semibold text-sm text-indigo">Step 2 of 3</p>
                    <h1 className="font-extrabold text-4xl">A little support for learning</h1>
                    <div className="flex flex-col max-w-[528px] text-center">
                        <h2 className="font-medium text-lg text-graphite-70">Nevo can use your microphone and camera to help with focus and engagement during lessons.</h2>
                        <h2 className="font-medium text-lg text-graphite-70">Nothing is recorded or shared.</h2>
                    </div>
                </header>

                <div className="flex flex-col gap-4">
                    <div className="bg-white p-6.25 w-[528px] border border-indigo-10 flex items-center justify-between gap-4 rounded-20px">
                        <div className="icon p-3 bg-parchment rounded-full">
                            <Icon type="microphone" width={24} height={24} />
                        </div>
                        <p className="font-medium w-[241px]">For voice guidance and spoken answers</p>
                        <button
                            onClick={requestMic}
                            disabled={micPermission === "granted"}
                            className={`rounded-xl px-4 py-2 font-semibold text-sm transition-colors ${micPermission === "granted" ? "bg-green-100 text-green-700" :
                                micPermission === "denied" ? "bg-red-100 text-red-700" :
                                    "bg-indigo-10 text-indigo hover:bg-indigo-20 cursor-pointer"
                                }`}
                        >
                            {micPermission === "granted" ? "Allowed" : micPermission === "denied" ? "Denied" : "Allow Microphone"}
                        </button>
                    </div>
                    <div className="bg-white p-6.25 w-[528px] border border-indigo-10 flex items-center justify-between gap-4 rounded-20px">
                        <div className="icon p-3 bg-parchment rounded-full">
                            <Icon type="video-camera" width={24} height={24} />
                        </div>
                        <p className="font-medium w-[256px]">For learning engagement support when needed</p>
                        <button
                            onClick={requestCam}
                            disabled={camPermission === "granted"}
                            className={`rounded-xl px-4 py-2 font-semibold text-sm transition-colors ${camPermission === "granted" ? "bg-green-100 text-green-700" :
                                camPermission === "denied" ? "bg-red-100 text-red-700" :
                                    "bg-indigo-10 text-indigo hover:bg-indigo-20 cursor-pointer"
                                }`}
                        >
                            {camPermission === "granted" ? "Allowed" : camPermission === "denied" ? "Denied" : "Allow Camera"}
                        </button>
                    </div>
                </div>

                <button type="submit" onClick={() => {
                    console.log("Step 2 complete - Camera/Mic permissions handled");
                    onNext();
                }} className="bg-indigo mt-10 text-white rounded-2xl cursor-pointer px-6 py-4 outline-none w-[528px]">Continue</button>

                <div className="flex flex-col items-center gap-1 mt-6">
                    <p className="text-graphite-60 text-sm font-medium">Permissions are asked once and saved.</p>
                    <p className="text-graphite-60 text-sm font-medium">Nevo is built for privacy and care.</p>
                </div>
            </main>
        </div>
    )
}
