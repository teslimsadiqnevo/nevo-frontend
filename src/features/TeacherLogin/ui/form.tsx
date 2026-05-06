'use client'

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Icon } from "@/shared/ui";
import { getDashboardPath } from "@/shared/lib";

export function TeacherLoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isComplete = email.trim() !== '' && password !== '';
    const inviteToken = searchParams.get('invite_token') || '';
    const redirectParam = searchParams.get('redirect') || '';

    const normalizedRedirect = useMemo(() => {
        if (!redirectParam) return getDashboardPath('teacher', 'home');
        if (redirectParam.startsWith('/')) return redirectParam;
        if (typeof window === 'undefined') return getDashboardPath('teacher', 'home');
        try {
            const parsed = new URL(redirectParam);
            if (parsed.origin === window.location.origin) {
                return `${parsed.pathname}${parsed.search}${parsed.hash}`;
            }
        } catch {
            return getDashboardPath('teacher', 'home');
        }
        return getDashboardPath('teacher', 'home');
    }, [redirectParam]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isComplete || isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                loginType: "teacher",
                redirect: false,
                callbackUrl: normalizedRedirect,
            });

            if (result?.error) {
                setError("Invalid credentials. Please try again.");
                setIsLoading(false);
                return;
            }

            router.replace(result?.url || normalizedRedirect);
            router.refresh();
        } catch {
            setError("Something went wrong. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <form className="flex flex-col items-center w-full gap-[14px]" onSubmit={handleSubmit}>
            <div className="w-full flex flex-col gap-[14px]">
                <input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    className={`w-full bg-transparent border rounded-[10px] px-5 py-[14px] outline-none transition-colors text-[13px] font-medium placeholder:text-[#3B3F6E]/40 text-[#3B3F6E] ${
                        error ? "border-[#E57661]" : "border-[#3B3F6E]/20 focus:border-[#3B3F6E]/50"
                    }`}
                />
                <div className="relative w-full">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(null); }}
                        className={`w-full bg-transparent border rounded-[10px] pl-5 pr-12 py-[14px] outline-none transition-colors text-[13px] font-medium placeholder:text-[#3B3F6E]/40 text-[#3B3F6E] ${
                            error ? "border-[#E57661]" : "border-[#3B3F6E]/20 focus:border-[#3B3F6E]/50"
                        }`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3B3F6E]/50 hover:text-[#3B3F6E] transition-colors p-[2px] cursor-pointer"
                    >
                        <Icon type="eye" width={18} height={18} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="w-full flex justify-center mt-[-4px]">
                    <span className="text-[11px] font-medium text-[#E57661] tracking-wide">{error}</span>
                </div>
            )}

            <button
                type="submit"
                disabled={!isComplete || isLoading}
                className={`w-full font-bold rounded-[10px] py-[14px] text-[14px] outline-none transition-all mt-[18px] ${
                    !isComplete || isLoading
                        ? 'bg-[#9A9BB5] text-white cursor-not-allowed opacity-90'
                        : 'bg-[#3B3F6E] text-white hover:opacity-90 active:scale-[0.98] cursor-pointer'
                }`}
            >
                {isLoading ? 'Logging in...' : 'Log in'}
            </button>

            <Link href="/forgot-password" className="text-[11px] text-[#A29ECA] font-medium transition-colors hover:text-[#3B3F6E] cursor-pointer text-center mt-[10px]">
                Forgot your password?
            </Link>

            {inviteToken ? (
                <p className="text-[11px] text-[#3B3F6E]/60 text-center mt-2">
                    Sign in to accept your school invite and join your assigned class.
                </p>
            ) : null}

            <Link href="/register/teacher" className="text-[11px] text-[#A29ECA] font-medium transition-colors hover:text-[#3B3F6E] cursor-pointer text-center mt-6">
                Don&apos;t have an account? Sign up
            </Link>

            <div className="flex justify-center mt-[24px]">
                <button type="button" onClick={() => router.back()} className="text-[#3B3F6E] hover:scale-110 opacity-80 hover:opacity-100 transition-all p-2 cursor-pointer">
                    <Icon type="back" width={16} height={16} />
                </button>
            </div>
        </form>
    )
}
