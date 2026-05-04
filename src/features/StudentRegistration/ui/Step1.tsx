'use client'

import { useState } from "react";
import { Icon } from "@/shared/ui";
import { useRegistrationStore } from "@/shared/store/useRegistrationStore";
import Link from "next/link";

export function Step1({ onNext }: { onNext: () => void }) {
    const {
        firstName: storeFirstName,
        surname: storeSurname,
        age: storeAge,
        setFirstName,
        setSurname,
        setAge,
    } = useRegistrationStore();
    const [firstName, setLocalFirstName] = useState(storeFirstName);
    const [surname, setLocalSurname] = useState(storeSurname);
    const [age, setLocalAge] = useState(storeAge);

    const isFormValid =
        firstName.trim() !== "" && surname.trim() !== "" && age.trim() !== "";

    const inputClass =
        "w-full h-14 bg-transparent border border-indigo/40 rounded-xl px-5 text-[16px] leading-6 text-graphite outline-none focus:border-2 focus:border-indigo placeholder:text-graphite/30 transition-colors";

    return (
        <div className="w-full max-w-[1024px] mx-auto px-6 pt-12">
            <Link
                href="/register"
                className="flex w-11 h-11 items-center justify-center cursor-pointer"
                aria-label="Back"
            >
                <Icon type="back" width={24} height={24} />
            </Link>

            <main className="w-full flex flex-col items-center">
                <header className="pt-6 flex w-full flex-col gap-2 items-center justify-center">
                    <p className="font-normal text-[13px] leading-5 text-lavender">
                        Step 1 of 6
                    </p>
                    <h1 className="font-bold text-[22px] leading-[33px] text-indigo mt-10">
                        Let&apos;s get started
                    </h1>
                    <h2 className="font-normal text-sm leading-[21px] text-graphite/60">
                        Tell us a little about yourself.
                    </h2>
                </header>

                <form
                    className="w-full flex flex-col gap-5 mt-8"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!isFormValid) return;
                        const cleanFirstName = firstName.trim();
                        const cleanSurname = surname.trim();
                        const cleanAge = age.trim();
                        setFirstName(cleanFirstName);
                        setSurname(cleanSurname);
                        setAge(cleanAge);
                        onNext();
                    }}
                >
                    <input
                        type="text"
                        placeholder="Your first name"
                        value={firstName}
                        onChange={(e) => setLocalFirstName(e.target.value)}
                        className={inputClass}
                        autoComplete="given-name"
                    />

                    <input
                        type="text"
                        placeholder="Your surname"
                        value={surname}
                        onChange={(e) => setLocalSurname(e.target.value)}
                        className={inputClass}
                        autoComplete="family-name"
                    />

                    <input
                        type="number"
                        inputMode="numeric"
                        placeholder="Your age"
                        value={age}
                        onChange={(e) => setLocalAge(e.target.value)}
                        className={inputClass}
                    />

                    <p className="font-normal text-xs leading-[18px] text-graphite/40 -mt-2">
                        This helps Nevo adjust your experience.
                    </p>

                    <button
                        type="submit"
                        disabled={!isFormValid}
                        className={`w-full h-13 bg-indigo text-parchment font-semibold text-[16px] leading-6 rounded-xl mt-4 px-6 outline-none transition-opacity ${
                            isFormValid
                                ? "opacity-100 hover:opacity-90 cursor-pointer"
                                : "opacity-40 cursor-not-allowed"
                        }`}
                        style={{ height: 52 }}
                    >
                        Continue
                    </button>
                </form>
            </main>
        </div>
    );
}
