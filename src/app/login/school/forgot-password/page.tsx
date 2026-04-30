"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/shared/ui";

export default function SchoolForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [countdown, setCountdown] = useState(45);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isSent && countdown > 0) {
            timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [isSent, countdown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setIsSent(true);
            setCountdown(45);
        }, 1500);
    };

    const handleResend = () => {
        if (countdown > 0) return;
        setCountdown(45);
    };

    return (
        <div className="flex-1 w-full flex flex-col items-center p-6 bg-[#F6F5F2] min-h-screen relative">
            {!isSent && (
                <div className="w-full max-w-[1000px] flex items-center justify-start mx-auto mt-4 px-4 md:px-0">
                    <button type="button" onClick={() => router.back()} className="flex items-center gap-[6px] text-[#3B3F6E] hover:opacity-70 transition-opacity p-2 -ml-2 select-none cursor-pointer">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="font-bold text-[13px] mt-[1px]">Login</span>
                    </button>
                </div>
            )}

            {isSent && (
                 <div className="hidden lg:flex absolute top-[12vh] left-[26vw] items-center">
                    <button type="button" onClick={() => router.back()} className="flex items-center gap-[6px] text-[#A29ECA] hover:text-[#3B3F6E] transition-colors p-2 select-none cursor-pointer">
                        <span className="font-medium text-[12px] mt-[1px]">Login</span>
                    </button>
                 </div>
            )}

            <div className={`w-full max-w-[420px] mx-auto flex flex-col items-center justify-center flex-1 ${isSent ? 'mb-[15vh]' : 'mb-[10vh]'}`}>
                <div className="mb-[24px]">
                    <Icon type="default" width={113} height={34} />
                </div>
                
                <h1 className="font-bold text-[#3B3F6E] text-[20px] mb-[12px] text-center tracking-tight">
                    {isSent ? "Check your email" : "Reset your password"}
                </h1>
                
                <p className="text-[12.5px] text-graphite opacity-[55%] font-medium text-center max-w-[340px] leading-snug tracking-tight mb-[34px]">
                    {isSent ? (
                        <>We've sent a password reset link to<br/>{email}</>
                    ) : (
                        "Enter your admin email and we'll send a reset link."
                    )}
                </p>

                {isSent ? (
                    <div className="w-full flex justify-center flex-col gap-[34px] items-center">
                        <button 
                            type="button" 
                            onClick={handleResend}
                            disabled={countdown > 0}
                            className={`text-[12px] font-medium transition-colors ${countdown > 0 ? "text-graphite opacity-[45%] cursor-not-allowed tracking-tight" : "text-[#3B3F6E] hover:opacity-70 cursor-pointer tracking-tight"}`}
                        >
                            {countdown > 0 ? `Didn't receive it? Resend in 0:${countdown.toString().padStart(2, '0')}` : "Didn't receive it? Resend now"}
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => router.push('/login/school')}
                            className="w-[420px] font-bold rounded-[8px] py-[13px] text-[13px] outline-none transition-all shadow-[0px_1px_2px_rgba(0,0,0,0.02)] border border-[#3B3F6E]/20 bg-transparent text-[#3B3F6E] hover:bg-[#3B3F6E]/5 active:scale-[0.98] cursor-pointer"
                        >
                            Back to login
                        </button>
                    </div>
                ) : (
                    <form className="w-full flex justify-center flex-col gap-[22px] items-center" onSubmit={handleSubmit}>
                        <div className="w-full">
                            <input
                                type="email"
                                placeholder="Admin email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-transparent rounded-[8px] px-4 py-[14px] text-[13px] text-[#3B3F6E] font-medium outline-none transition-all placeholder:text-[#3B3F6E]/40 border border-[#3B3F6E]/20 focus:border-[#3B3F6E]/50"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!email.trim() || isLoading}
                            className={`w-full font-bold rounded-[8px] py-[13px] text-[13px] outline-none transition-all shadow-sm ${
                                !email.trim() || isLoading
                                    ? 'bg-[#9A9BB5] text-white cursor-not-allowed opacity-[0.9]'
                                    : 'bg-[#3B3F6E] hover:opacity-90 text-white cursor-pointer active:scale-[0.98]'
                            }`}
                        >
                            {isLoading ? 'Sending...' : 'Send reset link'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
