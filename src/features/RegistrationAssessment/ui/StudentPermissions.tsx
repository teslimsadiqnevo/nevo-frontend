"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type PermissionStateValue = "idle" | "granted" | "denied";

type MediaPermissionName = "microphone" | "camera";

type PermissionCardProps = {
    type: MediaPermissionName;
    title: string;
    buttonLabel: string;
    state: PermissionStateValue;
    onRequest: () => void;
};

type PermissionsQueryResult = {
    state?: "granted" | "denied" | "prompt";
    onchange?: (() => void) | null;
};

function PermissionIcon({ type }: { type: MediaPermissionName }) {
    if (type === "microphone") {
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 14.5C10.3431 14.5 9 13.1569 9 11.5V7C9 5.34315 10.3431 4 12 4C13.6569 4 15 5.34315 15 7V11.5C15 13.1569 13.6569 14.5 12 14.5Z" fill="currentColor" />
                <path d="M18 11.5C18 14.8137 15.3137 17.5 12 17.5C8.68629 17.5 6 14.8137 6 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 17.5V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M9.5 20H14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        );
    }

    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="7" width="12" height="10" rx="2.5" fill="currentColor" />
            <path d="M16.5 10.2L20.0496 7.767C20.7145 7.311 21.625 7.787 21.625 8.59422V15.4058C21.625 16.213 20.7145 16.689 20.0496 16.233L16.5 13.8V10.2Z" fill="currentColor" />
        </svg>
    );
}

function PermissionCard({ type, title, buttonLabel, state, onRequest }: PermissionCardProps) {
    const resolvedButtonLabel = useMemo(() => {
        if (state === "granted") return "Allowed";
        if (state === "denied") return "Try again";
        return buttonLabel;
    }, [buttonLabel, state]);

    return (
        <div className="flex w-full items-center gap-4 rounded-[20px] border border-[#3B3F6E]/10 bg-[#FCFCFC] px-[25px] py-[25px] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-parchment text-indigo">
                <PermissionIcon type={type} />
            </div>

            <div className="min-w-0 flex-1 text-[14px] font-medium leading-6 text-graphite">
                {title}
            </div>

            <button
                type="button"
                onClick={onRequest}
                className={`h-10 shrink-0 rounded-xl px-4 text-center text-[12px] font-semibold transition-colors ${
                    state === "granted"
                        ? "bg-[#7DBF83]/18 text-[#2F6B3E]"
                        : "bg-indigo/10 text-indigo hover:bg-indigo/15"
                }`}
            >
                {resolvedButtonLabel}
            </button>
        </div>
    );
}

async function queryPermission(name: MediaPermissionName): Promise<PermissionStateValue> {
    if (typeof navigator === "undefined" || !("permissions" in navigator)) {
        return "idle";
    }

    try {
        const result = (await navigator.permissions.query({
            name: name as PermissionName,
        })) as PermissionsQueryResult;

        if (result.state === "granted" || result.state === "denied") {
            return result.state;
        }

        return "idle";
    } catch {
        return "idle";
    }
}

export function StudentPermissions({ onNext }: { onNext: () => void }) {
    const [microphoneState, setMicrophoneState] = useState<PermissionStateValue>("idle");
    const [cameraState, setCameraState] = useState<PermissionStateValue>("idle");

    useEffect(() => {
        let isMounted = true;

        const syncPermissions = async () => {
            const [nextMicrophoneState, nextCameraState] = await Promise.all([
                queryPermission("microphone"),
                queryPermission("camera"),
            ]);

            if (!isMounted) return;

            setMicrophoneState(nextMicrophoneState);
            setCameraState(nextCameraState);
        };

        void syncPermissions();

        return () => {
            isMounted = false;
        };
    }, []);

    const requestPermission = async (type: MediaPermissionName) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(
                type === "microphone" ? { audio: true } : { video: true },
            );
            stream.getTracks().forEach((track) => track.stop());

            if (type === "microphone") {
                setMicrophoneState("granted");
            } else {
                setCameraState("granted");
            }
        } catch {
            if (type === "microphone") {
                setMicrophoneState("denied");
            } else {
                setCameraState("denied");
            }
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-parchment">
            <header className="flex h-20 w-full items-center justify-between px-12">
                <Link href="/register/student" className="flex items-center gap-3 text-indigo">
                    <span className="sr-only">Nevo</span>
                    <svg width="73" height="22" viewBox="0 0 113 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[22px] w-[73px]">
                        <path d="M16.4025 0.601562C11.8898 0.601562 8.23837 4.253 8.23837 8.76566C8.23837 14.4507 12.6698 16.1252 14.6527 18.1081C16.6356 20.091 17.529 22.074 17.529 24.2962C17.529 26.5183 15.7875 28.3268 13.5653 28.3268C11.3432 28.3268 9.53469 26.5183 9.53469 24.2962C9.53469 23.1637 10.0081 22.0038 10.8745 21.2176L8.65235 18.9954C7.21856 20.3498 6.3999 22.2371 6.3999 24.2962C6.3999 28.4078 9.69583 31.7037 13.8075 31.7037C17.9191 31.7037 21.2151 28.4078 21.2151 24.2962C21.2151 18.6111 16.7836 16.9366 14.8008 14.9538C12.8179 12.9709 11.9245 10.9879 11.9245 8.76566C11.9245 6.54352 13.733 4.73502 15.9551 4.73502C18.1773 4.73502 19.9858 6.54352 19.9858 8.76566C19.9858 9.89813 19.5124 11.0581 18.646 11.8442L20.8681 14.0664C22.3019 12.7121 23.1206 10.8248 23.1206 8.76566C23.1206 4.65399 19.8247 1.35806 15.713 1.35806L16.4025 0.601562Z" fill="currentColor"/>
                        <path d="M37.8341 0.601562C33.3215 0.601562 29.6701 4.253 29.6701 8.76566C29.6701 14.4507 34.1015 16.1252 36.0844 18.1081C38.0673 20.091 38.9607 22.074 38.9607 24.2962C38.9607 26.5183 37.1522 28.3268 34.9301 28.3268C32.7079 28.3268 30.8994 26.5183 30.8994 24.2962C30.8994 23.1637 31.3728 22.0038 32.2392 21.2176L30.0171 18.9954C28.5833 20.3498 27.7646 22.2371 27.7646 24.2962C27.7646 28.4078 31.0606 31.7037 35.1722 31.7037C39.2839 31.7037 42.5798 28.4078 42.5798 24.2962C42.5798 18.6111 38.1484 16.9366 36.1655 14.9538C34.1827 12.9709 33.2892 10.9879 33.2892 8.76566C33.2892 6.54352 35.0977 4.73502 37.3199 4.73502C39.542 4.73502 41.3505 6.54352 41.3505 8.76566C41.3505 9.89813 40.8771 11.0581 40.0107 11.8442L42.2329 14.0664C43.6667 12.7121 44.4853 10.8248 44.4853 8.76566C44.4853 4.65399 41.1894 1.35806 37.0778 1.35806L37.8341 0.601562Z" fill="currentColor"/>
                        <path d="M57.8711 8.34229L67.5198 24.1646V8.34229H72.0902V31.0808H67.5387L57.8522 15.1828V31.0808H53.2817V8.34229H57.8711Z" fill="currentColor"/>
                        <path d="M86.5851 31.4568C79.6949 31.4568 74.8213 26.4524 74.8213 19.7671C74.8213 13.0817 79.6949 8.07739 86.5851 8.07739C93.4752 8.07739 98.3488 13.0817 98.3488 19.7671C98.3488 26.4524 93.4752 31.4568 86.5851 31.4568ZM86.5851 27.2838C90.5789 27.2838 93.6086 24.3295 93.6086 19.7671C93.6086 15.2046 90.5789 12.2504 86.5851 12.2504C82.5723 12.2504 79.5426 15.2046 79.5426 19.7671C79.5426 24.3295 82.5723 27.2838 86.5851 27.2838Z" fill="currentColor"/>
                        <path d="M112.261 8.34229H117.078L108.815 31.0808H103.658L95.3945 8.34229H100.382L106.252 25.6186L112.261 8.34229Z" fill="currentColor"/>
                    </svg>
                </Link>

                <div className="flex h-12 w-12 items-center justify-center rounded-full text-indigo">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.3335 18.6667V13.3333C5.3335 7.44229 10.1091 2.66667 16.0002 2.66667C21.8912 2.66667 26.6668 7.44229 26.6668 13.3333V18.6667" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
                        <path d="M5.3335 18.6667C5.3335 21.6122 7.72131 24 10.6668 24H11.3335V13.3333H10.6668C7.72131 13.3333 5.3335 15.7212 5.3335 18.6667Z" fill="currentColor" />
                        <path d="M26.6665 18.6667C26.6665 21.6122 24.2787 24 21.3332 24H20.6665V13.3333H21.3332C24.2787 13.3333 26.6665 15.7212 26.6665 18.6667Z" fill="currentColor" />
                    </svg>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center px-4 pb-10 pt-8">
                <div className="text-center text-[13px] font-normal text-lavender">Step 2 of 6</div>

                <div className="mt-8 flex w-full flex-col items-center">
                    <h1 className="text-center text-[22px] font-bold leading-[45px] text-graphite">
                        A little support for learning
                    </h1>

                    <div className="mt-2 px-4 text-center text-[14px] leading-8 text-graphite/70">
                        <p>Nevo can use your microphone and camera to help with focus and engagement during lessons.</p>
                        <p>Nothing is recorded or shared.</p>
                    </div>
                </div>

                <div className="mt-10 flex w-full flex-col gap-4">
                    <PermissionCard
                        type="microphone"
                        title="For voice guidance and spoken answers"
                        buttonLabel="Allow Microphone"
                        state={microphoneState}
                        onRequest={() => void requestPermission("microphone")}
                    />
                    <PermissionCard
                        type="camera"
                        title="For learning engagement support when needed"
                        buttonLabel="Allow Camera"
                        state={cameraState}
                        onRequest={() => void requestPermission("camera")}
                    />
                </div>

                <button
                    type="button"
                    onClick={onNext}
                    className="mt-10 h-14 w-full rounded-2xl bg-indigo text-[18px] font-semibold text-[#FCFCFC] shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-opacity hover:opacity-95"
                >
                    Continue
                </button>

                <div className="mt-6 flex flex-col items-center gap-1 text-center text-[14px] font-medium text-graphite/60">
                    <p>Permissions are asked once and saved.</p>
                    <p>Nevo is built for privacy and care.</p>
                </div>
            </main>
        </div>
    );
}
