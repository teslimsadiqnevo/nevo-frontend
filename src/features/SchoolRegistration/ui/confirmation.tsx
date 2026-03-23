import { Icon } from "@/shared/ui";

export function RegistrationConfirmation() {
    return (
        <div className="px-6 mt-53 flex flex-col items-center justify-center">
            <div className="p-7 rounded-full mb-8 bg-lavender-15">
                <Icon type="checkmark" width={64} height={64} />
            </div>
            <header className="flex flex-col gap-4 mb-12 items-center justify-center">
                <h1 className="font-extrabold text-40px">School workspace created</h1>
                <p className="font-medium text-xl text-graphite-80">Next, add teachers and classes.</p>
            </header>
            <div className="flex flex-col items-center justify-center gap-4">
                <button className="bg-indigo text-white rounded-2xl font-semibold text-lg cursor-pointer px-6 py-4 outline-none w-[512px]">Go to School Dashboard</button>
                <button className="bg-transparent border-2 border-indigo-20 text-indigo rounded-2xl font-semibold text-lg cursor-pointer px-6 py-4 outline-none w-[512px]">Add Teachers</button>
            </div>
        </div>
    )
}
