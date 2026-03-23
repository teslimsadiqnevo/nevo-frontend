'use client'
import { Input } from "@/shared/ui";
import { useState } from "react";
import { registerTeacher } from "../api/registerTeacher";
import { Icon } from "@/shared/ui";

export function TeacherForm({ onSuccess }: { onSuccess: () => void }) {
    const [fullName, setFullName] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [workEmail, setWorkEmail] = useState('');
    const [password, setPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const result = await registerTeacher({
            fullName,
            schoolName,
            workEmail,
            password
        });

        setIsLoading(false);

        if (result.error) {
            setError(result.error);
        } else {
            onSuccess();
        }
    };

    return (
        <div className="pt-12.5 flex flex-col gap-8 items-center justify-center pb-8.75">
            <header className="flex flex-col gap-2 items-center justify-center">
                <p className="font-semibold text-sm text-indigo">Step 1 of 2</p>
                <h1 className="font-bold text-4xl">Create your Teacher account</h1>
                <p className="font-medium text-lg text-graphite-70">Set up Nevo for your class in minutes.</p>
            </header>

            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                <Input label="Full name" placeholder="e.g., Sarah Jenkins" name="fullName" width={528} type="text" onChange={(e) => setFullName(e.target.value)} value={fullName} />
                <Input label="School name" placeholder="e.g., Lincoln High School" name="schoolName" width={528} type="text" onChange={(e) => setSchoolName(e.target.value)} value={schoolName} />
                <Input label="Work email" placeholder="e.g., name@school.edu" name="workEmail" width={528} type="email" onChange={(e) => setWorkEmail(e.target.value)} value={workEmail} />
                <Input label="Create Password" placeholder="e.g., ••••••••" name="password" width={528} type="password" onChange={(e) => setPassword(e.target.value)} value={password} />

                {error && (
                    <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-2xl w-[528px]">

                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-indigo text-white rounded-2xl cursor-pointer px-6 py-4 outline-none w-[528px] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                >
                    {isLoading ? 'Creating account...' : 'Continue'}
                </button>
            </form>
            <div className="flex flex-col items-center justify-center">
                <a href="/login/teacher" className="text-indigo font-medium text-sm">Already have an account? Sign in</a>
                <p className="font-medium pt-4.25 text-sm text-graphite-60">Nevo is built for clarity, not complexity.</p>
            </div>
        </div>
    )
}