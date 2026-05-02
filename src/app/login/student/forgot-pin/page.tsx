"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/shared/ui";

type ForgotPinResponse = {
    message?: string;
    detail?: string;
};

export default function ForgotPinPage() {
    const router = useRouter();
    const [nevoID, setNevoID] = useState("");
    const [schoolCode, setSchoolCode] = useState("");
    const [firstName, setFirstName] = useState("");
    const [result, setResult] = useState<ForgotPinResponse | null>(null);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleFindAccount = async () => {
        if (!nevoID.trim() || !schoolCode.trim()) return;

        setIsLoading(true);
        setError("");
        setResult(null);

        try {
            const res = await fetch("/api/auth/student/forgot-pin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nevo_id: nevoID.trim().toUpperCase(),
                    school_code: schoolCode.trim().toUpperCase(),
                    first_name: firstName.trim() || undefined,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(
                    data?.detail || data?.message || "We couldn't start a PIN reset for this account.",
                );
            }

            setResult(data);
        } catch (err: any) {
            setError(err?.message || "We couldn't start a PIN reset for this account.");
        } finally {
            setIsLoading(false);
        }
    };

    const canSubmit = nevoID.trim() && schoolCode.trim();

    return (
        <div className="flex-1 w-full flex flex-col justify-center items-center mt-12 mb-10 px-6">
            <header className="flex flex-col items-center justify-center gap-2 mb-8">
                <h1 className="font-extrabold text-[#3B3F6E] text-[22px]">Forgot your PIN?</h1>
                <p className="font-medium text-[13px] text-graphite-60 text-center max-w-[360px]">
                    Enter your Nevo ID and school code so we can help you start a PIN reset.
                </p>
            </header>

            {!result ? (
                <div className="flex flex-col items-center w-full max-w-[456px]">
                    <input
                        type="text"
                        placeholder="Your Nevo ID"
                        value={nevoID}
                        onChange={(e) => setNevoID(e.target.value.toUpperCase())}
                        autoCapitalize="characters"
                        className="w-full bg-transparent border border-[#3B3F6E]/20 focus:border-[#3B3F6E]/50 rounded-[8px] px-4 py-3 outline-none transition-colors text-[13px] font-medium placeholder:text-[#3B3F6E]/40 text-[#3B3F6E] mb-4"
                    />

                    <input
                        type="text"
                        placeholder="School code"
                        value={schoolCode}
                        onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                        autoCapitalize="characters"
                        className="w-full bg-transparent border border-[#3B3F6E]/20 focus:border-[#3B3F6E]/50 rounded-[8px] px-4 py-3 outline-none transition-colors text-[13px] font-medium placeholder:text-[#3B3F6E]/40 text-[#3B3F6E] mb-4"
                    />

                    <input
                        type="text"
                        placeholder="First name (optional)"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-transparent border border-[#3B3F6E]/20 focus:border-[#3B3F6E]/50 rounded-[8px] px-4 py-3 outline-none transition-colors text-[13px] font-medium placeholder:text-[#3B3F6E]/40 text-[#3B3F6E] mb-4"
                    />

                    {error ? (
                        <p className="w-full text-[12px] text-[#C0392B] font-medium mb-4">{error}</p>
                    ) : null}

                    <button
                        onClick={handleFindAccount}
                        disabled={!canSubmit || isLoading}
                        className={`w-full text-white font-bold rounded-xl py-[14px] text-[14px] outline-none transition-all ${
                            !canSubmit
                                ? "bg-[#9A9BB5] cursor-not-allowed opacity-90"
                                : "bg-[#3B3F6E] hover:opacity-90 active:scale-95 cursor-pointer"
                        }`}
                    >
                        {isLoading ? "Starting reset..." : "Find my account"}
                    </button>

                    <div className="flex items-center w-full gap-4 my-6">
                        <div className="h-px bg-[#3B3F6E]/10 flex-1"></div>
                        <span className="text-[11px] text-[#3B3F6E]/40 font-semibold">or</span>
                        <div className="h-px bg-[#3B3F6E]/10 flex-1"></div>
                    </div>

                    <div className="w-full border border-[#3B3F6E]/10 rounded-2xl p-4.5 text-left bg-[#3B3F6E]/[0.02]">
                        <h2 className="text-[15px] font-semibold text-[#3B3F6E] mb-2">Ask your teacher</h2>
                        <p className="text-[13px] text-graphite opacity-60">
                            Your teacher can also reset your PIN from their student list if you are already connected to their class.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="mt-6 text-[#3B3F6E] opacity-60 cursor-pointer transition-opacity hover:opacity-100 p-2"
                    >
                        <Icon type="back" width={16} height={16} />
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center w-full max-w-[360px] mt-6">
                    <p className="text-[13px] text-graphite-60 font-medium text-center mb-8 w-full">
                        {result.message || "We found your account and started the PIN reset process."}
                    </p>

                    <button
                        onClick={() => router.push("/login/student")}
                        className="w-full border border-[#3B3F6E]/30 text-[#3B3F6E] bg-transparent font-bold rounded-2xl py-[14px] text-[14px] outline-none transition-all hover:bg-[#3B3F6E]/5 active:scale-95 cursor-pointer mb-6"
                    >
                        Back to login
                    </button>

                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="text-[#3B3F6E] opacity-60 cursor-pointer transition-opacity hover:opacity-100 p-2"
                    >
                        <Icon type="back" width={16} height={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
