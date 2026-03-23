import { Icon } from "@/shared/ui";
import Link from "next/link";

export function RegistrationConfirmation() {
    return (
        <div className="px-6 flex flex-col items-center justify-center">
            <div className="p-7 rounded-full mb-8 bg-lavender-15">
                <Icon type="checkmark" width={64} height={64} />
            </div>
            <header className="flex flex-col gap-4 mb-12 items-center justify-center">
                <h1 className="font-extrabold text-40px">You&apos;re set up.</h1>
                <p className="font-medium text-xl text-graphite-80">Now add your first class or connect students.</p>
            </header>
            <div className="flex flex-col items-center justify-center gap-4">
                <Link href="/dashboard" className="inline-flex items-center justify-center bg-indigo text-white rounded-2xl font-semibold text-lg cursor-pointer px-6 py-4 outline-none w-[512px]">Go to Teacher Dashboard</Link>
                <Link href="/dashboard" className="inline-flex items-center justify-center bg-transparent border-2 border-indigo-20 text-indigo rounded-2xl font-semibold text-lg cursor-pointer px-6 py-4 outline-none w-[512px]">Add Students</Link>
            </div>
        </div>
    )
}