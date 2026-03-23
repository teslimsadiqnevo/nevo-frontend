'use client'

import { useState } from "react";
import { Input } from "@/shared/ui";
import { Select } from "@/shared/ui";

export function Step1({ onNext }: { onNext: () => void }) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [age, setAge] = useState("");

    return (
        <div>
            <main className="px-4 flex flex-col mb-6.75 items-center justify-center">
                <header className="pt-8 flex flex-col gap-2 items-center justify-center pb-10">
                    <p className="font-semibold text-sm text-indigo">Step 1 of 3</p>
                    <h1 className="font-extrabold text-4xl">Let&apos;s get to know you.</h1>
                    <h2 className="font-medium text-lg text-graphite-70">Just the basics — we&apos;ll keep this simple.</h2>
                </header>

                <form className="flex flex-col gap-6" onSubmit={(e) => {
                    e.preventDefault();
                    sessionStorage.setItem('nevo_registration_data', JSON.stringify({ firstName, lastName, age }));
                    console.log("Step 1 complete - Data saved to sessionStorage:", { firstName, lastName, age });
                    onNext();
                }}>
                    <Input label="First Name" placeholder="e.g., Lydia" name="firstName" value={firstName} width={528} type="text" onChange={(e) => setFirstName(e.target.value)} />
                    <Input label="Last Name" placeholder="e.g., Solomon" name="lastName" value={lastName} width={528} type="text" onChange={(e) => setLastName(e.target.value)} />
                    <Select label="Age" name="age" value={age} width={528} onChange={(e) => setAge(e.target.value)} options={[{ label: "Select age", value: "" }, { label: "16", value: "16" }, { label: "17", value: "17" }, { label: "18", value: "18" }, { label: "19", value: "19" }, { label: "20", value: "20" }, { label: "21", value: "21" }, { label: "22", value: "22" }, { label: "23", value: "23" }, { label: "24", value: "24" }, { label: "25", value: "25" }, { label: "26", value: "26" }, { label: "27", value: "27" }]} />
                    <button type="submit" className="bg-indigo text-white rounded-2xl cursor-pointer px-6 py-4 outline-none w-[528px]">Continue</button>
                </form>
                <p className="font-medium text-sm text-graphite-60 pt-6">No email needed yet. Nevo is designed to feel calm and easy.</p>
            </main>
        </div>
    )
}
