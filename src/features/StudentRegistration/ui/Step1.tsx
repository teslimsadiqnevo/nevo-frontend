'use client'

import { useState } from "react";
import { Icon } from "@/shared/ui";
import { useRegistrationStore } from "@/shared/store/useRegistrationStore";

export function Step1({ onNext }: { onNext: () => void }) {
    const { firstName: storeFirstName, age: storeAge, setFirstName, setAge } = useRegistrationStore();
    const [firstName, setLocalFirstName] = useState(storeFirstName);
    const [age, setLocalAge] = useState(storeAge);

    const isFormValid = firstName.trim() !== "" && age.trim() !== "";

    return (
        <div className="flex flex-col justify-center items-center">
            <a href="/register" className="icon p-2.5 pl-6 cursor-pointer mt-10 flex w-full justify-start">
                <Icon type="back" width={24} height={24} />
            </a>

            <main className="px-6 w-full flex flex-col items-center">
                <header className="pt-8 flex w-full flex-col gap-2 items-center justify-center pb-10">
                    <p className="font-semibold text-sm text-indigo opacity-60">Step 1 of 6</p>
                    <h1 className="font-extrabold text-[22px] text-indigo mt-3">Let's get started</h1>
                    <h2 className="font-medium text-sm text-graphite-70">Tell us a little about yourself.</h2>
                </header>

                <form className="flex w-full flex-col gap-4" onSubmit={(e) => {
                    e.preventDefault();
                    if (!isFormValid) return;
                    setFirstName(firstName);
                    setAge(age);
                    console.log("Step 1 complete - Data saved to Zustand store:", { firstName, age });
                    onNext();
                }}>
                    <input 
                        type="text" 
                        placeholder="Your Full name" 
                        value={firstName}
                        onChange={(e) => setLocalFirstName(e.target.value)}
                        className="w-full bg-transparent border border-indigo-20 rounded-xl px-5 py-4 outline-none focus:border-2 focus:border-indigo transition-colors"
                    />

                    <input 
                        type="number" 
                        placeholder="Your age" 
                        value={age}
                        onChange={(e) => setLocalAge(e.target.value)}
                        className="w-full bg-transparent border border-indigo-20 rounded-xl px-5 py-4 outline-none focus:border-2 focus:border-indigo transition-colors"
                    />
                    
                    <p className="font-medium text-xs text-graphite-50 pb-2">This helps Nevo adjust your experience.</p>
                    
                    <button 
                        type="submit" 
                        disabled={!isFormValid}
                        className={`w-full text-white font-semibold rounded-xl mt-4 cursor-pointer px-6 py-4 outline-none transition-opacity ${
                            isFormValid ? "bg-indigo hover:opacity-90" : "bg-indigo opacity-50 cursor-not-allowed"
                        }`}
                    >
                        Continue
                    </button>
                </form>
            </main>
        </div>
    )
}
