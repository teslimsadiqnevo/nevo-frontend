'use client'

import { Input } from "@/shared/ui";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginTeacher } from "../api/loginTeacher";

export function TeacherLoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        const result = await loginTeacher({ email, password });
        
        setIsLoading(false);

        if (result.error) {
            setError(result.error);
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <form className="flex flex-col items-center justify-center gap-6" onSubmit={handleSubmit}>
            <Input label="Email" width={512} placeholder="e.g., name@school.edu" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
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

            <a href="/forgot-password" className="mt-4 text-sm text-[#3B3F6E] font-medium cursor-pointer transition-colors hover:text-indigo">
                Forgot password
            </a>

            <a href="/register/teacher" className="mt-2 text-sm text-[#3B3F6E] font-medium cursor-pointer transition-colors hover:text-indigo">
                New to Nevo? Create teacher account
            </a>
        </form>
    )
}
