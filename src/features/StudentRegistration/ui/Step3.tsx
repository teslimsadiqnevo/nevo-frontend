'use client'

import { HorizontalCard } from "@/widgets/HorizontalCard";

export function Step3({ onNext }: { onNext?: () => void }) {
    return (
        <div className="flex items-center justify-center">
            <main className="px-4 flex w-[592px] flex-col mb-6.75 items-center justify-center">
                <header className="pt-8 flex flex-col gap-2 items-center justify-center pb-10">
                    <p className="font-semibold text-sm text-indigo">Step 3 of 3</p>
                    <h1 className="font-extrabold text-4xl">Let’s set up learning your way</h1>
                    <h2 className="font-medium text-center text-lg text-graphite-70">Nevo will ask a few quick questions to understand how learning feels best for you. This takes about 2 minutes.</h2>
                </header>

                <div className="w-full flex flex-col mb-12 gap-4">
                    <HorizontalCard content="One question at a time" icon="number-one" className="w-full justify-start" />
                    <HorizontalCard content="No right or wrong answers" icon="checkmark" className="w-full justify-start" />
                    <HorizontalCard content="Nevo adapts lessons based on what you choose" icon="stars" className="w-full justify-start" />
                </div>

                <button onClick={onNext} className="bg-indigo mb-4 text-white rounded-2xl cursor-pointer px-6 py-4 outline-none w-full">Start Questions</button>
                <p className="text-graphite-60 text-sm font-medium">You can always change how Nevo supports you later.</p>
            </main>
        </div>
    )
}
