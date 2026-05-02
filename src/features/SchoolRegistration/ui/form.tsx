'use client';

import { useState } from 'react';
import { Input, Select } from '@/shared/ui';
import { registerSchool } from '../api/registerSchool';

export function SchoolForm({ onSuccess }: { onSuccess: () => void }) {
    const [adminName, setAdminName] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [password, setPassword] = useState('');
    const [state, setState] = useState('');
    const [schoolType, setSchoolType] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const result = await registerSchool({
            schoolName,
            adminName,
            adminEmail,
            password,
            state,
            schoolType,
        });

        setIsLoading(false);

        if (result.error) {
            setError(result.error);
            return;
        }

        onSuccess();
    };

    return (
        <div className="pt-12.5 flex flex-col gap-8 items-center justify-center pb-8.75">
            <header className="flex flex-col gap-2 items-center justify-center">
                <h1 className="font-bold text-40px">Set up Nevo for your School</h1>
                <p className="font-medium text-lg text-graphite-70">Create your school workspace and manage classes calmly.</p>
            </header>

            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                <Input label="School name" placeholder="e.g., Willow Creek Academy" name="schoolName" width={528} type="text" onChange={(event) => setSchoolName(event.target.value)} value={schoolName} />
                <Input label="School administrator name" placeholder="e.g., Alex Richardson" name="adminName" width={528} type="text" onChange={(event) => setAdminName(event.target.value)} value={adminName} />
                <Input label="Admin email" placeholder="name@school.edu" name="setAdminEmail" width={528} type="email" onChange={(event) => setAdminEmail(event.target.value)} value={adminEmail} />
                <Input label="Create password" placeholder="Enter a password" name="password" width={528} type="password" onChange={(event) => setPassword(event.target.value)} value={password} />
                <Input label="State" placeholder="e.g., Lagos State" name="state" width={528} type="text" onChange={(event) => setState(event.target.value)} value={state} />
                <Select
                    label="School type (Optional)"
                    name="schoolType"
                    value={schoolType}
                    width={528}
                    onChange={(event) => setSchoolType(event.target.value)}
                    options={[
                        { label: 'Select a type', value: '' },
                        { label: 'Elementary School', value: 'Elementary School' },
                        { label: 'Middle School', value: 'Middle School' },
                        { label: 'High School', value: 'High School' },
                        { label: 'K-12', value: 'K-12' },
                        { label: 'College / University', value: 'College / University' },
                        { label: 'Other', value: 'Other' },
                    ]}
                />

                {error ? (
                    <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-2xl w-[528px]">
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                ) : null}

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
            </div>
        </div>
    );
}
