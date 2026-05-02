"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/shared/ui";

type ForgotIdResponse = {
    nevo_id?: string;
    message?: string;
    detail?: string;
};

export default function ForgotIdPage() {
    const router = useRouter();
    const [schoolCode, setSchoolCode] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [age, setAge] = useState("");
    const [result, setResult] = useState<ForgotIdResponse | null>(null);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleFindId = async () => {
        if (!schoolCode.trim() || !firstName.trim()) return;

        setIsLoading(true);
        setError("");
        setResult(null);

        try {
            const res = await fetch("/api/auth/student/forgot-id", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    school_code: schoolCode.trim().toUpperCase(),
                    first_name: firstName.trim(),
                    last_name: lastName.trim() || undefined,
                    age: age ? Number(age) : undefined,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(
                    data?.detail || data?.message || "We couldn't find a matching student ID.",
                );
            }

            setResult(data);
        } catch (err: any) {
            setError(err?.message || "We couldn't find a matching student ID.");
        } finally {
            setIsLoading(false);
        }
    };

    const canSubmit = schoolCode.trim() && firstName.trim();

    return (
        <div className="flex-1 w-full flex flex-col items-center mt-6 mb-10 px-6 max-w-2xl mx-auto">
            <div className="w-full mb-8">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="text-[#3B3F6E] opacity-70 hover:opacity-100 transition-opacity p-2 -ml-2 cursor-pointer"
                >
                    <Icon type="back" width={16} height={16} />
                </button>
            </div>

            <header className="flex flex-col gap-3 mb-8 w-full">
                <h1 className="font-extrabold text-[#3B3F6E] text-[20px] text-left">Lost your ID?</h1>
                <p className="font-medium text-[12px] opacity-70 text-graphite text-left max-w-md">
                    Enter your school code and name so we can look up your Nevo ID.
                </p>
            </header>

            {!result ? (
                <div className="flex flex-col w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                            type="text"
                            placeholder="School code"
                            value={schoolCode}
                            onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                            autoCapitalize="characters"
                            className="w-full bg-transparent border border-[#3B3F6E]/20 focus:border-[#3B3F6E]/50 rounded-[8px] px-4 py-[14px] outline-none transition-colors text-[13.5px] font-medium placeholder:text-[#3B3F6E]/60 text-[#3B3F6E]"
                        />
                        <input
                            type="text"
                            placeholder="First name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full bg-transparent border border-[#3B3F6E]/20 focus:border-[#3B3F6E]/50 rounded-[8px] px-4 py-[14px] outline-none transition-colors text-[13.5px] font-medium placeholder:text-[#3B3F6E]/60 text-[#3B3F6E]"
                        />
                        <input
                            type="text"
                            placeholder="Last name (optional)"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full bg-transparent border border-[#3B3F6E]/20 focus:border-[#3B3F6E]/50 rounded-[8px] px-4 py-[14px] outline-none transition-colors text-[13.5px] font-medium placeholder:text-[#3B3F6E]/60 text-[#3B3F6E]"
                        />
                        <input
                            type="number"
                            min="1"
                            placeholder="Age (optional)"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className="w-full bg-transparent border border-[#3B3F6E]/20 focus:border-[#3B3F6E]/50 rounded-[8px] px-4 py-[14px] outline-none transition-colors text-[13.5px] font-medium placeholder:text-[#3B3F6E]/60 text-[#3B3F6E]"
                        />
                    </div>

                    {error ? (
                        <p className="text-[12px] text-[#C0392B] font-medium mb-4">{error}</p>
                    ) : null}

                    <button
                        onClick={handleFindId}
                        disabled={!canSubmit || isLoading}
                        className={`w-full text-white font-bold rounded-xl py-[14px] text-[14px] outline-none transition-all ${
                            !canSubmit
                                ? "bg-[#9A9BB5] cursor-not-allowed opacity-90"
                                : "bg-[#3B3F6E] hover:opacity-90 active:scale-[0.98] cursor-pointer"
                        }`}
                    >
                        {isLoading ? "Looking up your ID..." : "Find my ID"}
                    </button>

                    <div className="flex items-center w-full gap-4 my-7">
                        <div className="h-px bg-[#3B3F6E]/10 flex-1"></div>
                        <span className="text-[11px] text-[#3B3F6E]/40 font-semibold lowercase">or</span>
                        <div className="h-px bg-[#3B3F6E]/10 flex-1"></div>
                    </div>

                    <div className="w-full border border-[#3B3F6E]/10 rounded-xl p-5 bg-[#3B3F6E]/[0.02]">
                        <h2 className="text-[14px] font-bold text-[#3B3F6E] mb-2">Ask your teacher</h2>
                        <p className="text-[12px] text-graphite opacity-60 font-medium">
                            Your teacher can also find your Nevo ID from their student list if you already belong to a class.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col w-full gap-4">
                    <div className="w-full border border-[#3B3F6E]/15 rounded-[12px] p-5 flex items-center justify-between">
                        <div className="flex flex-col items-start gap-1">
                            <span className="font-bold text-[13.5px] text-[#3B3F6E]">Your Nevo ID</span>
                            <span className="font-medium text-[12px] text-graphite opacity-70">
                                {result.message || "We found a matching student account."}
                            </span>
                            <span className="font-bold text-[13px] text-[#2B2B2F] uppercase tracking-wide">
                                {result.nevo_id}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push("/login/student")}
                        className="w-full text-white font-bold rounded-xl py-[14px] text-[14px] bg-[#3B3F6E] hover:opacity-90 active:scale-[0.98] cursor-pointer transition-all"
                    >
                        Back to login
                    </button>
                </div>
            )}
        </div>
    );
}
