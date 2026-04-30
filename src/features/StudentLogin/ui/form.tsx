'use client'

import { Input, Icon } from "@/shared/ui";
import { useState, useRef, useEffect } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginStudent } from "../api/loginStudent";

export function StudentLoginForm() {
    const router = useRouter();
    const [firstName, setFirstName] = useState("");
    const [nevoID, setNevoID] = useState("");
    const [pin, setPin] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleKeyPress = (key: string) => {
        if (pin.length < 4 && !isLoading) {
            setPin(prev => prev + key);
            setError(null);
        }
    };

    const handleBackspace = () => {
        if (pin.length > 0 && !isLoading) {
            setPin(prev => prev.slice(0, -1));
            setError(null);
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        if (!firstName || !nevoID || pin.length < 4) {
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            const result = await loginStudent({
                firstName,
                nevoId: nevoID,
                pin,
            });

            if (result?.error) {
                setError(result.error);
                setIsLoading(false);
                setPin("");
            }
            // If successful, loginStudent triggers a redirect via NextAuth signIn
        } catch (err) {
            // NextAuth signIn with redirectTo throws a NEXT_REDIRECT "error"
            // which is expected — it means the redirect is happening.
            // Only show error for actual failures.
            setIsLoading(false);
        }
    };

    return (
        <form className="flex flex-col items-center justify-center w-[360px]" onSubmit={handleSubmit}>
             <div className="w-full flex flex-col gap-4 mb-4">
                 <input
                     type="text"
                     placeholder="Your first name"
                     value={firstName}
                     onChange={(e) => { setFirstName(e.target.value); setError(null); }}
                     className={`w-full bg-transparent border rounded-[8px] px-4 py-3 outline-none transition-colors text-[13px] font-medium placeholder:text-[#3B3F6E]/40 text-[#3B3F6E] ${error ? 'border-[#E57661]' : 'border-[#3B3F6E]/20 focus:border-[#3B3F6E]/50'}`}
                 />
                 <input
                     type="text"
                     placeholder="Your Nevo ID (e.g. NEVO-7K3P2)"
                     value={nevoID}
                     onChange={(e) => { setNevoID(e.target.value.toUpperCase()); setError(null); }}
                     autoCapitalize="characters"
                     className={`w-full bg-transparent border rounded-[8px] px-4 py-3 outline-none transition-colors text-[13px] font-medium placeholder:text-[#3B3F6E]/40 text-[#3B3F6E] ${error ? 'border-[#E57661]' : 'border-[#3B3F6E]/20 focus:border-[#3B3F6E]/50'}`}
                 />
             </div>

             <div className="w-full flex flex-col items-start gap-1.5 mb-1 relative min-h-[70px]">
                 <label className="text-[10px] font-bold text-[#3B3F6E]/80 uppercase tracking-wider">PIN</label>
                 
                 <div className="flex gap-[18px] self-center">
                     {[0, 1, 2, 3].map(i => {
                         const isFilled = i < pin.length;
                         const isError = error !== null;
                         const outerBorder = isError ? "border-[#E57661]" : "border-[#3B3F6E]/30";
                         const innerFill = isError ? "bg-[#3B3F6E]" : "bg-[#3B3F6E]";

                         return (
                             <div key={i} className={`w-[32px] h-[32px] rounded-full border flex items-center justify-center transition-all ${outerBorder}`}>
                                 {isFilled && (
                                     <div className={`w-[12px] h-[12px] rounded-full transition-all shadow-sm ${innerFill}`} />
                                 )}
                             </div>
                         )
                     })}
                 </div>
                 
                 <div className="h-[20px] w-full mt-2">
                     {error && (
                         <p className="text-[#E57661] text-[10.5px] font-medium text-center w-full">{error}</p>
                     )}
                 </div>
             </div>

             <div className="grid grid-cols-3 gap-x-2.5 gap-y-2.5 mb-6 w-[320px]">
                 {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(num => (
                     <button
                         key={num}
                         type="button"
                         onClick={() => handleKeyPress(num)}
                         className="h-[48px] flex items-center justify-center text-[15px] font-bold border border-[#3B3F6E]/10 rounded-[10px] bg-transparent active:bg-[#3B3F6E]/5 transition-colors text-[#3B3F6E] cursor-pointer"
                     >
                         {num}
                     </button>
                 ))}
                 <div /> {/* Empty */}
                 <button
                     type="button"
                     onClick={() => handleKeyPress("0")}
                     className="h-[48px] flex items-center justify-center text-[15px] font-bold border border-[#3B3F6E]/10 rounded-[10px] bg-transparent active:bg-[#3B3F6E]/5 transition-colors text-[#3B3F6E] cursor-pointer"
                 >
                     0
                 </button>
                 <button
                     type="button"
                     onClick={() => handleBackspace()}
                     className="h-[48px] flex items-center justify-center border border-[#3B3F6E]/10 rounded-[10px] bg-transparent active:bg-[#3B3F6E]/5 transition-colors text-[#3B3F6E] cursor-pointer"
                 >
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                         <path d="M21 4H10.5C9.7 4 9 4.4 8.5 5.1L3.9 11.3C3.5 11.8 3.5 12.5 3.9 13L8.5 19.3C9 19.9 9.7 20.4 10.5 20.4H21C22.1 20.4 23 19.5 23 18.4V6C23 4.9 22.1 4 21 4ZM18.7 15.3C19.1 15.7 19.1 16.3 18.7 16.7C18.3 17.1 17.7 17.1 17.3 16.7L14.5 13.9L11.7 16.7C11.3 17.1 10.7 17.1 10.3 16.7C9.9 16.3 9.9 15.7 10.3 15.3L13.1 12.5L10.3 9.7C9.9 9.3 9.9 8.7 10.3 8.3C10.7 7.9 11.3 7.9 11.7 8.3L14.5 11.1L17.3 8.3C17.7 7.9 18.3 7.9 18.7 8.3C19.1 8.7 19.1 9.3 18.7 9.7L15.9 12.5L18.7 15.3Z" fill="currentColor"/>
                     </svg>
                 </button>
             </div>

             <button
                 type="submit"
                 disabled={isLoading || !firstName || !nevoID || pin.length < 4}
                 className={`w-[320px] text-white font-bold rounded-2xl py-[14px] text-[14px] outline-none transition-all ${
                     !firstName || !nevoID || pin.length < 4
                         ? 'bg-[#8F90A6] cursor-not-allowed opacity-90'
                         : 'bg-[#3B3F6E] hover:opacity-90 active:scale-95 cursor-pointer'
                 }`}
             >
                 {isLoading ? 'Wait...' : 'Log in'}
             </button>

             <Link href="/login/student/forgot-pin" className="mt-4 text-[10px] text-[#A29ECA] font-medium cursor-pointer transition-colors hover:text-[#3B3F6E]">
                 Forgot your PIN?
             </Link>

             <Link href="/login/student/forgot-id" className="mt-3 text-[10px] text-[#A29ECA] font-medium cursor-pointer transition-colors hover:text-[#3B3F6E]">
                 Lost your ID?
             </Link>

             <button type="button" onClick={() => router.back()} className="mt-4 text-[#A29ECA] cursor-pointer transition-opacity hover:opacity-100 p-2">
                 <Icon type="back" width={16} height={16} />
             </button>

        </form>
    )
}