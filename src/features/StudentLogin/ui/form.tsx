'use client'

import { useState } from "react";
import Link from "next/link";
import { loginStudent } from "@/features/StudentLogin/api/loginStudent";
import { clearClientSessionState } from "@/shared/lib";

export function StudentLoginForm() {
    const [firstName, setFirstName] = useState("");
    const [nevoIDSuffix, setNevoIDSuffix] = useState("");
    const [pin, setPin] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const normalizedNevoId = nevoIDSuffix ? `NEVO-${nevoIDSuffix}` : "";

    const handleKeyPress = (key: string) => {
        if (pin.length < 4 && !isLoading) {
            setPin((prev) => prev + key);
            setError(null);
        }
    };

    const handleBackspace = () => {
        if (pin.length > 0 && !isLoading) {
            setPin((prev) => prev.slice(0, -1));
            setError(null);
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!firstName.trim() || !normalizedNevoId || pin.length < 4 || isLoading) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await clearClientSessionState();
            const result = await loginStudent({
                firstName: firstName.trim(),
                nevoId: normalizedNevoId,
                pin,
            });

            if (result?.error) {
                setError("We couldn't find that account. Check your ID and try again.");
                setIsLoading(false);
                setPin("");
                return;
            }
        } catch {
            // NextAuth redirect via the server action throws NEXT_REDIRECT on success.
            setIsLoading(false);
        }
    };

    const handleNevoIdChange = (value: string) => {
        const cleaned = value
            .toUpperCase()
            .replace(/^NEVO-?/, "")
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 10);

        setNevoIDSuffix(cleaned);
        setError(null);
    };

    const hasError = error !== null;
    const canSubmit = Boolean(firstName.trim() && normalizedNevoId && pin.length === 4 && !isLoading);

    return (
        <form className="flex w-[456px] flex-col items-center" onSubmit={handleSubmit}>
            <div className="flex w-full flex-col gap-4">
                <input
                    type="text"
                    placeholder="Your first name"
                    value={firstName}
                    onChange={(e) => {
                        setFirstName(e.target.value);
                        setError(null);
                    }}
                    className={`h-14 w-full rounded-[12px] border bg-transparent px-4 text-[16px] text-[#2B2B2F] outline-none transition-all placeholder:text-[#2B2B2F]/55 focus:border-2 focus:border-[#3B3F6E] ${
                        hasError ? 'border-[#C0392B]' : 'border-[#3B3F6E]/40'
                    }`}
                />

                <div className={`flex h-14 w-full items-center rounded-[12px] border bg-transparent px-4 transition-all focus-within:border-2 focus-within:border-[#3B3F6E] ${
                    hasError ? 'border-[#C0392B]' : 'border-[#3B3F6E]/40'
                }`}>
                    <span className="mr-1 text-[16px] font-semibold text-[#2B2B2F]">NEVO-</span>
                    <input
                        type="text"
                        placeholder="(e.g. 7K3P2)"
                        value={nevoIDSuffix}
                        onChange={(e) => handleNevoIdChange(e.target.value)}
                        autoCapitalize="characters"
                        spellCheck={false}
                        className="h-full w-full bg-transparent text-[16px] text-[#2B2B2F] outline-none placeholder:text-[#2B2B2F]/55"
                    />
                </div>
            </div>

            <div className="mt-4 flex w-full flex-col items-start">
                <label className="mb-[11px] text-[14px] font-semibold leading-[21px] text-[#3B3F6E]/70">PIN</label>
                <div className="flex w-full justify-center gap-4">
                    {[0, 1, 2, 3].map((i) => {
                        const isFilled = i < pin.length;
                        return (
                            <div
                                key={i}
                                className={`flex h-[44px] w-[44px] items-center justify-center rounded-full border bg-transparent ${
                                    hasError ? 'border-[#C0392B]' : 'border-[#3B3F6E]/40'
                                }`}
                            >
                                {isFilled ? <div className="h-4 w-4 rounded-full bg-[#3B3F6E]" /> : null}
                            </div>
                        );
                    })}
                </div>
                {error ? (
                    <p className="mt-3 w-full text-left text-[13px] leading-5 text-[#C0392B]">
                        {error}
                    </p>
                ) : null}
            </div>

            <div className="mt-5 grid w-full grid-cols-3 gap-x-4 gap-y-4">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                    <button
                        key={num}
                        type="button"
                        onClick={() => handleKeyPress(num)}
                        className="flex h-16 items-center justify-center rounded-[12px] border border-[#E0D9CE] bg-transparent text-[20px] font-semibold text-[#3B3F6E] transition-colors active:bg-[#3B3F6E]/5 cursor-pointer"
                    >
                        {num}
                    </button>
                ))}
                <div />
                <button
                    type="button"
                    onClick={() => handleKeyPress("0")}
                    className="flex h-16 items-center justify-center rounded-[12px] border border-[#E0D9CE] bg-transparent text-[20px] font-semibold text-[#3B3F6E] transition-colors active:bg-[#3B3F6E]/5 cursor-pointer"
                >
                    0
                </button>
                <button
                    type="button"
                    onClick={handleBackspace}
                    className="flex h-16 items-center justify-center rounded-[12px] border border-[#E0D9CE] bg-transparent text-[#3B3F6E] transition-colors active:bg-[#3B3F6E]/5 cursor-pointer"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 4H10.5C9.7 4 9 4.4 8.5 5.1L3.9 11.3C3.5 11.8 3.5 12.5 3.9 13L8.5 19.3C9 19.9 9.7 20.4 10.5 20.4H21C22.1 20.4 23 19.5 23 18.4V6C23 4.9 22.1 4 21 4ZM18.7 15.3C19.1 15.7 19.1 16.3 18.7 16.7C18.3 17.1 17.7 17.1 17.3 16.7L14.5 13.9L11.7 16.7C11.3 17.1 10.7 17.1 10.3 16.7C9.9 16.3 9.9 15.7 10.3 15.3L13.1 12.5L10.3 9.7C9.9 9.3 9.9 8.7 10.3 8.3C10.7 7.9 11.3 7.9 11.7 8.3L14.5 11.1L17.3 8.3C17.7 7.9 18.3 7.9 18.7 8.3C19.1 8.7 19.1 9.3 18.7 9.7L15.9 12.5L18.7 15.3Z" fill="currentColor"/>
                    </svg>
                </button>
            </div>

            <button
                type="submit"
                disabled={!canSubmit}
                className={`mt-6 h-[52px] w-full rounded-[20px] text-[16px] font-semibold text-[#F7F1E6] transition-all ${
                    canSubmit ? 'bg-[#3B3F6E] hover:opacity-95 cursor-pointer' : 'bg-[#3B3F6E]/40 cursor-not-allowed'
                }`}
            >
                {isLoading ? 'Logging in...' : 'Log in'}
            </button>

            <Link
                href="/login/student/forgot-pin"
                className="mt-3 text-center text-[13px] leading-5 text-[#3B3F6E]/65 transition-colors hover:text-[#3B3F6E]"
            >
                Forgot your PIN?
            </Link>

            <Link
                href="/login/student/forgot-id"
                className="mt-2 text-center text-[13px] leading-5 text-[#3B3F6E]/65 transition-colors hover:text-[#3B3F6E]"
            >
                Lost your ID?
            </Link>
        </form>
    )
}
