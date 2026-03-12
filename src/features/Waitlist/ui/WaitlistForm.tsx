'use client'

import { Input } from "@/widgets";
import { useState } from "react";
import { joinWaitlist } from "../api/joinWaitlist";

export function WaitlistForm({ onSuccess }: { onSuccess: () => void }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('student');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const result = await joinWaitlist({
            name,
            email,
            role,
        });

        console.log("Waitlist result:", result);

        setIsLoading(false);

        if (result.error) {
            setError(result.error);
        } else if (result.success) {
            onSuccess();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] h-screen bg-[#4B4B4B] w-full py-10">
            <div className="bg-[#FAF9F6] rounded-3xl px-10 mb-1 py-12 max-w-[480px] w-full shadow-lg flex flex-col items-center">
                <header className="flex flex-col gap-3 items-center justify-center text-center">
                    <h1 className="font-bold text-3-4xl text-graphite leading-tight">Be first to experience<br />Nevo.</h1>
                    <p className="text-graphite-80 leading-relaxed">We&apos;re launching soon. Drop your email and we&apos;ll reach out when you&apos;re up.</p>
                </header>

                <form className="flex flex-col gap-6 w-full" onSubmit={handleSubmit}>
                    <Input 
                        label="Full name" 
                        placeholder="Enter your full name" 
                        name="name" 
                        type="text" 
                        onChange={(e) => setName(e.target.value)} 
                        value={name} 
                        width="full" 
                    />

                    <Input 
                        label="Email address" 
                        placeholder="your@email.com" 
                        name="email" 
                        type="email" 
                        onChange={(e) => setEmail(e.target.value)} 
                        value={email} 
                        width="full" 
                    />

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-graphite">I am a...</label>
                        <div className="flex gap-3 w-full">
                            <button type="button" onClick={() => setRole('student')} className={`flex-1 py-3 cursor-pointer rounded-xl font-medium text-sm transition-colors ${role === 'student' ? 'bg-[#FDF3E5] border border-[#E8D8C8] text-graphite' : 'bg-[#F2EDDF] text-graphite-70 hover:bg-[#EAE4D4]'}`}>Student</button>
                            <button type="button" onClick={() => setRole('teacher')} className={`flex-1 py-3 cursor-pointer rounded-xl font-medium text-sm transition-colors ${role === 'teacher' ? 'bg-[#FDF3E5] border border-[#E8D8C8] text-graphite' : 'bg-[#F2EDDF] text-graphite-70 hover:bg-[#EAE4D4]'}`}>Teacher</button>
                            <button type="button" onClick={() => setRole('school')} className={`flex-1 py-3 cursor-pointer rounded-xl font-medium text-sm transition-colors ${role === 'school' ? 'bg-[#FDF3E5] border border-[#E8D8C8] text-graphite' : 'bg-[#F2EDDF] text-graphite-70 hover:bg-[#EAE4D4]'}`}>School</button>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-2xl w-full">
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-indigo text-white rounded-full cursor-pointer mt-2 px-6 py-4 font-semibold outline-none w-full disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {isLoading ? 'Saving...' : 'Save my spot'}
                    </button>
                </form>

                <p className="pt-6 text-sm text-graphite-50">No spam. Just your launch invite.</p>
            </div>
        </div>
    )
}
