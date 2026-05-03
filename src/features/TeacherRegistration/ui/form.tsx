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
        <form className="flex flex-col gap-4 w-full mx-auto" onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Your full name (i.e First Name and Surname)"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setError(null); }}
                className="w-full bg-transparent border border-[#3B3F6E]/20 focus:border-[#3B3F6E]/50 rounded-[10px] px-4 py-[14px] outline-none transition-colors text-[13.5px] font-medium placeholder:text-[#3B3F6E]/60"
            />

            <div className="flex flex-col gap-1 w-full">
                <input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    className={`w-full bg-transparent border rounded-[10px] px-4 py-[14px] outline-none transition-colors text-[13.5px] font-medium placeholder:text-[#3B3F6E]/60 ${error ? 'border-[#E57661] focus:border-[#E57661]' : 'border-[#3B3F6E]/20 focus:border-[#3B3F6E]/50'}`}
                />
                {error && (
                    <p className="text-[#E57661] text-[11px] font-medium mt-1 px-1">{error}</p>
                )}
            </div>

            <div className="flex flex-col gap-1 w-full mb-4 relative">
                <div className="relative flex items-center w-full">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(null); }}
                        className="w-full bg-transparent border border-[#3B3F6E]/20 focus:border-[#3B3F6E]/50 rounded-[10px] pl-4 pr-12 py-[14px] outline-none transition-colors text-[13.5px] font-medium placeholder:text-[#3B3F6E]/60"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 text-[#3B3F6E]/40 hover:text-[#3B3F6E] transition-colors cursor-pointer"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 5C7.3 5 3.3 8.3 1.5 12.5C3.3 16.7 7.3 20 12 20C16.7 20 20.7 16.7 22.5 12.5C20.7 8.3 16.7 5 12 5ZM12 17.5C9.2 17.5 7 15.3 7 12.5C7 9.7 9.2 7.5 12 7.5C14.8 7.5 17 9.7 17 12.5C17 15.3 14.8 17.5 12 17.5ZM12 9.5C10.3 9.5 9 10.8 9 12.5C9 14.2 10.3 15.5 12 15.5C13.7 15.5 15 14.2 15 12.5C15 10.8 13.7 9.5 12 9.5Z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
                <p className="text-[11px] text-graphite/40 font-medium px-1">At least 8 characters.</p>
            </div>

            <button
                type="submit"
                disabled={isLoading || !isComplete}
                className={`w-full text-white font-bold rounded-xl py-[14px] text-[14px] outline-none transition-all ${
                    !isComplete
                        ? 'bg-[#9A9BB5] cursor-not-allowed opacity-90'
                        : 'bg-[#3B3F6E] hover:opacity-90 active:scale-[0.98] cursor-pointer'
                }`}
            >
                {isLoading ? 'Wait...' : 'Create account'}
            </button>

            <p className="text-[11px] text-graphite-60 text-center mt-2 font-medium">
                Already have an account? <Link href="/login/teacher" className="text-[#A29ECA] hover:text-[#3B3F6E] transition-colors cursor-pointer">Sign in</Link>
            </p>
        </form>
    );
}