'use client'
import { Input, Select } from "@/shared/ui";
import { useState } from "react";
import { registerSchool } from "../api/registerSchool";

export function SchoolForm({ onSuccess }: { onSuccess: () => void }) {
    const [adminName, setAdminName] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [password, setPassword] = useState('');
    const [schoolType, setSchoolType] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const result = await registerSchool({
            schoolName,
            adminName,
            adminEmail,
            password,
            schoolType
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
                <h1 className="font-bold text-40px">Set up Nevo for your School</h1>
                <p className="font-medium text-lg text-graphite-70">Create your school workspace and manage classes calmly.</p>
            </header>

            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                <Input label="School name" placeholder="e.g., Willow Creek Academy" name="schoolName" width={528} type="text" onChange={(e) => setSchoolName(e.target.value)} value={schoolName} />
                <Input label="School administrator name" placeholder="e.g., Alex Richardson" name="adminName" width={528} type="text" onChange={(e) => setAdminName(e.target.value)} value={adminName} />
                <Input label="Admin email" placeholder="name@school.edu" name="setAdminEmail" width={528} type="email" onChange={(e) => setAdminEmail(e.target.value)} value={adminEmail} />
                <Input label="Create Password" placeholder="••••••••" name="password" width={528} type="password" onChange={(e) => setPassword(e.target.value)} value={password} />
                <Select 
                    label="School type (Optional)" 
                    name="schoolType" 
                    value={schoolType} 
                    width={528} 
                    onChange={(e) => setSchoolType(e.target.value)} 
                    options={[
                        { label: "Select a type", value: "" }, 
                        { label: "Elementary School", value: "Elementary School" }, 
                        { label: "Middle School", value: "Middle School" }, 
                        { label: "High School", value: "High School" }, 
                        { label: "K-12", value: "K-12" }, 
                        { label: "College / University", value: "College / University" }, 
                        { label: "Other", value: "Other" }
                    ]} 
                />

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
                    {isLoading ? 'Creating account...' : 'Create School Workspace'}
                </button>
            </form>
            <div className="flex flex-col items-center justify-center">
                <a href="/login/school" className="text-indigo font-medium text-sm">Already have an account? Sign in</a>
                {/* <p className="font-medium pt-4.25 text-sm text-graphite-60">Nevo is built for clarity, not complexity.</p> */}
            </div>
        </div>
    )
}
