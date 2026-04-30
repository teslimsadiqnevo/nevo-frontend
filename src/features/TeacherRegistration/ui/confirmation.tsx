"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export function RegistrationConfirmation({
    email,
    nextPath = "/register/teacher/workspace",
}: {
    email: string;
    nextPath?: string;
}) {
    const router = useRouter();
    const displayEmail = useMemo(() => email || "your email", [email]);

    const [resendCooldown, setResendCooldown] = useState<number>(0);
    const [resending, setResending] = useState<boolean>(false);
    const [resendError, setResendError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    useEffect(() => {
        // Keep a pending "user" object for resend on other tabs (verify-email page).
        // Do not mark the user verified here; only backend token validation should do that.
        try {
            const existingRaw = localStorage.getItem("user");
            const existing = existingRaw ? JSON.parse(existingRaw) : null;
            if (!existing || existing?.emailVerified !== true) {
                localStorage.setItem(
                    "user",
                    JSON.stringify({
                        ...(existing || {}),
                        email,
                        role: existing?.role || "TEACHER",
                        emailVerified: false,
                    }),
                );
            }
        } catch {
            // Ignore localStorage errors (private mode etc.)
        }
        // Push on mount if the token already exists.
        try {
            const accessToken = localStorage.getItem("access_token");
            if (accessToken) router.push(nextPath);
        } catch {
            // ignore
        }

        const onStorage = (e: StorageEvent) => {
            if (e.key !== "access_token") return;
            if (e.newValue) {
                router.push(nextPath);
            }
        };

        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, [email, nextPath, router]);

    useEffect(() => {
        if (resendCooldown <= 0) return;

        const t = window.setInterval(() => {
            setResendCooldown((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => window.clearInterval(t);
    }, [resendCooldown]);

    const handleResend = async () => {
        setResendError(null);
        setNotice(null);
        if (resendCooldown > 0 || resending) return;

        const emailToSend = email;
        if (!emailToSend) {
            setResendError("Missing email address. Please go back and register again.");
            return;
        }

        setResending(true);
        try {
                const res = await fetch(`/api/auth/teacher/resend-verification`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailToSend }),
            });

            if (!res.ok) {
                setResendError("Could not resend verification email. Please try again.");
                return;
            }

            setResendCooldown(60);
            setNotice("Email resent. Check your inbox.");
        } catch {
            setResendError("Could not resend verification email. Please try again.");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="flex-1 w-full flex flex-col items-center p-6 max-w-[360px] mx-auto" style={{ marginTop: '0px' }}>
            <div className="w-[104px] h-[104px] bg-[#3B3F6E]/5 rounded-full flex items-center justify-center mb-8">
                <svg width="44" height="36" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4H36C38.2 4 40 5.8 40 8V24C40 26.2 38.2 28 36 28H4C1.8 28 0 26.2 0 24V8C0 5.8 1.8 4 4 4Z" stroke="#3B3F6E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M40 8L20 21L0 8" stroke="#3B3F6E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>

            <h1 className="font-extrabold text-[#3B3F6E] text-[20px] mb-4 text-center">Check your email</h1>
            
            <p className="text-[14px] text-[#3B3F6E] opacity-90 font-medium text-center mb-10 leading-relaxed text-wrap">
                We sent a verification link to <br/>
                <span className="font-bold">{displayEmail}</span>.<br/>
                Click the link to confirm your <br/>account.
            </p>

            <button
                type="button"
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
                className={`w-full py-[14px] rounded-[10px] font-bold text-[14px] outline-none transition-all border ${
                    resendCooldown > 0 || resending
                        ? "border-[#3B3F6E]/15 text-[#3B3F6E]/40 cursor-not-allowed"
                        : "border-[#3B3F6E]/30 text-[#3B3F6E] hover:bg-[#3B3F6E]/2 active:scale-[0.98] cursor-pointer"
                }`}
            >
                {resending
                  ? "Sending..."
                  : resendCooldown > 0
                    ? (() => {
                        const minutes = Math.floor(resendCooldown / 60);
                        const seconds = resendCooldown % 60;
                        return `Resend in ${minutes}:${seconds.toString().padStart(2, "0")}`;
                      })()
                    : "Resend email"}
            </button>

            {notice && (
                <div className="flex flex-col items-center mt-5 gap-2.5 text-center">
                    <p className="text-[12px] text-[#A29ECA] font-medium">{notice}</p>
                </div>
            )}

            {resendError && (
                <p className="mt-2 text-[11px] text-[#E57661] text-center font-medium">
                    {resendError}
                </p>
            )}
        </div>
    );
}