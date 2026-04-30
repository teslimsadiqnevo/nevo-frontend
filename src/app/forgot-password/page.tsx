"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/shared/ui";
import { forgotTeacherPassword, resendTeacherVerification } from "@/features/TeacherLogin/api/teacherAuth";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [status, setStatus] = useState<"input" | "check">("input");
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const result = await forgotTeacherPassword(email.trim());
        setIsLoading(false);
        if (result.error) {
            setError(result.error);
            return;
        }
        setStatus("check");
        setCountdown(45);
    };

    const handleResend = async () => {
        if (!email.trim() || countdown > 0) return;
        const result = await resendTeacherVerification(email.trim());
        if (result.error) {
            setError(result.error);
            return;
        }
        setError(null);
        setCountdown(45);
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (status === "check" && countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [status, countdown]);

    return (
        <div className="flex-1 w-full flex flex-col p-6 bg-[#F6F5F2] min-h-screen relative">
            <div className="w-full max-w-7xl mx-auto flex md:px-6 mt-4">
                <button type="button" onClick={() => router.push('/login/teacher')} className="flex items-center gap-2 text-[#3B3F6E] opacity-70 hover:opacity-100 transition-opacity p-2 -ml-2 cursor-pointer">
                    <Icon type="back" width={16} height={16} />
                    <span className="font-bold text-[14px]">Sign in</span>
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[400px] mx-auto pb-[15vh]">
                {status === "input" ? (
                    <form className="flex flex-col items-center w-full" onSubmit={handleSubmit}>
                        <div className="mb-[28px] flex items-center justify-center">
                            <svg width="72" height="72" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C12 19.8 13.8 18 16 18H52C53.6569 18 55 19.3431 55 21C55 22.6569 53.6569 24 52 24H16C14.8954 24 14 23.1046 14 22V22Z" fill="#A29ECA"/>
                                <path d="M16 18H48C50.2091 18 52 19.7909 52 22V42C52 44.2091 50.2091 46 48 46H16C13.7909 46 12 44.2091 12 42V22C12 19.7909 13.7909 18 16 18Z" stroke="#3B3F6E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 22L32 36L52 22" stroke="#3B3F6E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M52 30H64M58 26L64 30L58 34" stroke="#A29ECA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M52 22H64M58 18L64 22L58 26" stroke="#3B3F6E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-0" />
                                <g transform="translate(4,4)">
                                <path d="M48 26H58M54 22L58 26L54 30" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </g>
                            </svg>
                        </div>
                        
                        <h1 className="font-extrabold text-[#3B3F6E] text-[22px] mb-[6px] text-center">Reset your password</h1>
                        <p className="text-[13px] text-graphite opacity-60 font-medium mb-[28px] text-center max-w-[340px] leading-relaxed">
                            Enter the email address linked to your Nevo account. We'll send you a reset link.
                        </p>

                        <div className="w-full flex flex-col gap-2">
                            <input 
                                type="email" 
                                placeholder="Your email address" 
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                                className={`w-full bg-transparent border rounded-[10px] px-5 py-[14px] outline-none transition-colors text-[13px] font-medium placeholder:text-[#3B3F6E]/40 text-[#3B3F6E] ${
                                    error ? "border-[#E57661]" : "border-[#3B3F6E]/20 focus:border-[#3B3F6E]/50"
                                }`}
                            />
                            {error && (
                                <span className="text-[10px] font-bold text-[#E57661] ml-2 tracking-wide">{error}</span>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={email.trim() === "" || isLoading}
                            className={`w-full font-bold rounded-[10px] py-[14px] text-[14px] outline-none transition-all mt-[18px] shadow-sm ${
                                email.trim() === ""
                                    ? 'bg-[#9A9BB5] text-white cursor-not-allowed opacity-90'
                                    : 'bg-[#3B3F6E] hover:opacity-90 text-white cursor-pointer active:scale-[0.98]'
                            }`}
                        >
                            {isLoading ? 'Sending link...' : 'Send reset link'}
                        </button>
                    </form>
                ) : (
                    <div className="flex flex-col items-center w-full">
                        <div className="w-[68px] h-[68px] rounded-full bg-[#76B97A] flex items-center justify-center mb-6">
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 14L12 20L22 8" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        
                        <h1 className="font-extrabold text-[#3B3F6E] text-[22px] mb-[6px] text-center">Check your inbox</h1>
                        <p className="text-[13px] text-graphite font-medium mb-10 text-center max-w-[340px] leading-relaxed">
                            <span className="opacity-60">We sent a reset link to </span><br/>
                            <span className="text-[#3B3F6E] font-bold">{email}</span>
                            <span className="opacity-60">.</span>
                        </p>

                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={countdown > 0}
                            className={`w-full font-bold rounded-[10px] py-[14px] text-[14px] outline-none transition-all border ${
                                countdown === 0
                                    ? "border-[#3B3F6E]/40 text-[#3B3F6E] bg-transparent hover:bg-[#3B3F6E]/5 active:scale-[0.98] cursor-pointer"
                                    : "border-[#3B3F6E]/15 text-[#3B3F6E]/40 bg-transparent cursor-not-allowed"
                            }`}
                        >
                            Resend email
                        </button>

                        {countdown > 0 && (
                            <div className="flex flex-col items-center mt-3 gap-[2px]">
                                <p className="text-[11px] font-bold text-graphite opacity-60">This may take a minute.</p>
                                <p className="text-[11px] font-bold text-graphite opacity-60">You can resend in {countdown}s.</p>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => router.push('/login/teacher')}
                            className={`text-[11px] text-graphite opacity-60 font-bold transition-colors hover:text-[#3B3F6E] hover:opacity-100 cursor-pointer text-center border-b border-transparent hover:border-current ${countdown > 0 ? "mt-[18px]" : "mt-6"}`}
                        >
                            Back to sign in
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
