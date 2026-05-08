"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginSchool } from "../api/loginSchool";
import { clearClientSessionState } from "@/shared/lib";

export function SchoolLoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await clearClientSessionState();
            const result = await loginSchool({
                email,
                password,
            });

            if (result?.error) {
                setError(result.error);
                setIsLoading(false);
            }
            // If successful, loginSchool triggers a redirect via NextAuth signIn
        } catch (err) {
            // NextAuth signIn with redirectTo throws a NEXT_REDIRECT "error"
            // which is expected — it means the redirect is happening.
            setIsLoading(false);
        }
    };

    const isComplete = email.trim() !== '' && password.trim() !== '';
    const hasError = error !== null;

    return (
        <form className="flex flex-col items-center w-full" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 w-full">
                {/* Email Input */}
                <div className="w-full relative">
                    <input
                        type="email"
                        placeholder="Admin email address"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (error) setError(null);
                        }}
                        className={`w-full bg-transparent rounded-[8px] px-4 py-[14px] text-[13px] text-[#3B3F6E] font-medium outline-none transition-all placeholder:text-[#3B3F6E]/40 ${hasError
                                ? 'border border-[#E57661] focus:border-[#E57661] bg-[#E57661]/[0.02]'
                                : 'border border-[#3B3F6E]/20 focus:border-[#3B3F6E]/50'
                            }`}
                    />
                </div>

                {/* Password Input */}
                <div className="w-full relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (error) setError(null);
                        }}
                        className={`w-full bg-transparent rounded-[8px] pl-4 pr-12 py-[14px] text-[13px] text-[#3B3F6E] font-medium outline-none transition-all placeholder:text-[#3B3F6E]/40 ${hasError
                                ? 'border border-[#E57661] focus:border-[#E57661] bg-[#E57661]/[0.02]'
                                : 'border border-[#3B3F6E]/20 focus:border-[#3B3F6E]/50'
                            }`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3B3F6E]/50 hover:text-[#3B3F6E] transition-colors focus:outline-none cursor-pointer"
                    >
                        {showPassword ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 5C5.63636 5 2 12 2 12C2 12 5.63636 19 12 19C18.3636 19 22 12 22 12C22 12 18.3636 5 12 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.94 17.94C16.2306 18.6436 14.1491 19 12 19C5.63636 19 2 12 2 12C2 12 3.63515 9.17294 6.06 7.06M9.9 4.24C10.5843 4.08419 11.288 4 12 4C18.3636 4 22 11 22 11C22 11 20.3648 13.8271 17.94 15.94M14.1213 14.1213C13.5587 14.6839 12.8251 15 12 15C10.3431 15 9 13.6569 9 12C9 11.1749 9.31607 10.4413 9.87868 9.87868M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {hasError && (
                <div className="w-full mt-[10px] flex justify-center">
                    <p className="text-[11px] text-[#E57661] font-medium tracking-tight">Incorrect email or password. Try again.</p>
                </div>
            )}

            <button
                type="submit"
                disabled={!isComplete || isLoading}
                className={`w-full font-bold rounded-[8px] py-[13px] text-[13px] outline-none transition-all shadow-sm ${hasError ? 'mt-[14px]' : 'mt-[22px]'
                    } ${!isComplete || isLoading
                        ? 'bg-[#9A9BB5] text-white cursor-not-allowed opacity-[0.9]'
                        : 'bg-[#3B3F6E] hover:opacity-90 text-white cursor-pointer active:scale-[0.98]'
                    }`}
            >
                {isLoading ? 'Log in...' : 'Log in'}
            </button>

            <Link href="/login/school/forgot-password" className="mt-[18px] text-[11.5px] text-[#A29ECA] hover:text-[#3B3F6E] font-medium transition-colors">
                Forgot your password?
            </Link>

            <Link href="/register/school" className="mt-6 text-[11.5px] text-[#A29ECA] hover:text-[#3B3F6E] font-medium transition-colors">
                Don&apos;t have an account? Sign up
            </Link>
        </form>
    )
}
