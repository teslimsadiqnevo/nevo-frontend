"use client";

import { useEffect, useMemo, useState } from "react";

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
            <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center px-4 pb-10 pt-16">
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
