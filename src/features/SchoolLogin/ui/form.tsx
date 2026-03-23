'use client'

import { Input } from "@/shared/ui";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginSchool } from "../api/loginSchool";

export function SchoolLoginForm() {
    const router = useRouter();
    const [adminEmail, setAdminEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        const result = await loginSchool({ email: adminEmail, password });
        
        setIsLoading(false);

        if (result.error) {
            setError(result.error);
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <form className="flex flex-col items-center justify-center gap-6" onSubmit={handleSubmit}>
            <Input label="Admin email" width={512} placeholder="e.g., admin@school.edu" name="email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
            <Input label="Password" width={512} placeholder="••••••••" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

            {error && (
                <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-2xl w-[512px]">
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="bg-[#3B3F6E] text-white font-semibold rounded-2xl cursor-pointer py-4 outline-none w-[512px] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center mt-2"
            >
                {isLoading ? 'Signing in...' : 'Sign in'}
            </button>

            <a href="/register/school" className="mt-4 text-sm text-[#3B3F6E] font-medium cursor-pointer transition-colors hover:text-indigo">
                Set up a new school workspace
            </a>
        </form>
    )
}
