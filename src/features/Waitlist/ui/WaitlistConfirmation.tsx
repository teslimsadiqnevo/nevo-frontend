import { Icon } from "@/shared/ui";

export function WaitlistConfirmation() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] h-screen bg-[#4B4B4B] w-full py-10">
            <div className="bg-[#FAF9F6] rounded-3xl p-10 max-w-[480px] w-full shadow-lg flex flex-col items-center">
                <div className="p-4 rounded-full mb-8 bg-[#EDF7ED] flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.5 12.5L10 18L19.5 6" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>

                <header className="flex flex-col gap-3 items-center justify-center text-center mb-8">
                    <h1 className="font-bold text-3xl text-graphite tracking-tight">You&apos;re on the list.</h1>
                    <p className="font-medium text-[15px] text-graphite-70 max-w-[280px] leading-relaxed">We&apos;ll be in touch soon. Keep an eye on your inbox.</p>
                </header>

                <a href="/" className="bg-[#3A3D68] text-white rounded-2xl cursor-pointer px-6 py-4 font-semibold outline-none w-full flex justify-center items-center">
                    Close
                </a>
            </div>
        </div>
    )
}
