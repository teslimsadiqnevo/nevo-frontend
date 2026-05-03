'use client'
import { useState } from "react";
import Link from "next/link";
import { registerTeacher } from "../api/registerTeacher";

export type TeacherRegistrationPayload = {
    fullName: string;
    schoolName: string;
    workEmail: string;
    password: string;
};

export function TeacherForm({ onSuccess }: { onSuccess: (payload: TeacherRegistrationPayload) => void }) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const payload: TeacherRegistrationPayload = {
                fullName,
                schoolName: "",
                workEmail: email,
                password,
            };
            const result = await registerTeacher(payload);

            setIsLoading(false);

            if (result.error) {
                setError(result.error);
            } else {
                onSuccess(payload);
            }
        } catch (err) {
            setIsLoading(false);
            setError("An unexpected error occurred. Please try again.");
        }
    };

    const isComplete = fullName.trim() !== "" && email.trim() !== "" && password.length >= 8;

    return (
        <form className="mx-auto flex w-full max-w-[976px] flex-col" onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setError(null); }}
                className="mb-4 h-14 w-full rounded-[12px] border border-[#3B3F6E]/40 bg-transparent px-[18px] text-[16px] leading-6 text-[#2B2B2F] outline-none transition-colors placeholder:text-[#2B2B2F] focus:border-[#3B3F6E]/60"
            />

            <div className="mb-4 flex w-full flex-col gap-[6px]">
                <input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    className={`h-14 w-full rounded-[12px] border bg-transparent px-[18px] text-[16px] leading-6 text-[#2B2B2F] outline-none transition-colors placeholder:text-[#2B2B2F] ${error ? 'border-[#E57661] focus:border-[#E57661]' : 'border-[#3B3F6E]/40 focus:border-[#3B3F6E]/60'}`}
                />
                {error && (
                    <p className="px-1 text-[12px] leading-4 text-[#E57661]">{error}</p>
                )}
            </div>

            <div className="mb-8 flex w-full flex-col gap-[6px]">
                <div className="relative flex items-center w-full">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(null); }}
                        className="h-14 w-full rounded-[12px] border border-[#3B3F6E]/40 bg-transparent pl-[18px] pr-14 text-[16px] leading-6 text-[#2B2B2F] outline-none transition-colors placeholder:text-[#2B2B2F] focus:border-[#3B3F6E]/60"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-[18px] text-[#3B3F6E] hover:opacity-80 transition-opacity cursor-pointer"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 5C7.3 5 3.3 8.3 1.5 12.5C3.3 16.7 7.3 20 12 20C16.7 20 20.7 16.7 22.5 12.5C20.7 8.3 16.7 5 12 5ZM12 17.5C9.2 17.5 7 15.3 7 12.5C7 9.7 9.2 7.5 12 7.5C14.8 7.5 17 9.7 17 12.5C17 15.3 14.8 17.5 12 17.5ZM12 9.5C10.3 9.5 9 10.8 9 12.5C9 14.2 10.3 15.5 12 15.5C13.7 15.5 15 14.2 15 12.5C15 10.8 13.7 9.5 12 9.5Z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
                <p className="px-1 text-[12px] leading-4 text-[#2B2B2F]/40">At least 8 characters.</p>
            </div>

            <button
                type="submit"
                disabled={isLoading || !isComplete}
                className={`h-[52px] w-full rounded-[12px] text-[16px] font-semibold leading-6 text-white outline-none transition-all ${
                    !isComplete
                        ? 'bg-[#9A9BB5] cursor-not-allowed opacity-90'
                        : 'bg-[#3B3F6E] hover:opacity-90 active:scale-[0.98] cursor-pointer'
                }`}
            >
                {isLoading ? 'Wait...' : 'Create account'}
            </button>

            <p className="mt-3 text-center text-[13px] leading-5 text-[#2B2B2F]/55">
                Already have an account? <Link href="/login/teacher" className="text-[#9A9CCB] hover:text-[#3B3F6E] transition-colors cursor-pointer">Sign in</Link>
            </p>
        </form>
    );
}
