"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSchoolOnboardingStatus, updateSchoolConsent } from "@/features/Dashboard/api/school";

export default function CameraSetupPage() {
    const router = useRouter();
    const [selectedOption, setSelectedOption] = useState<"enable" | "later" | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        void (async () => {
            const res = await getSchoolOnboardingStatus();
            if (!mounted) return;
            if ("error" in res && res.error) {
                setError(res.error);
            } else {
                const data = "data" in res ? res.data : null;
                if (!data?.data_protection_consent) {
                    router.replace("/register/school/data-agreement");
                    return;
                }
                if (typeof data?.camera_consent === "boolean") {
                    setSelectedOption(data.camera_consent ? "enable" : "later");
                }
            }
            setPageLoading(false);
        })();
        return () => {
            mounted = false;
        };
    }, [router]);

    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);
        const res = await updateSchoolConsent("camera", selectedOption === "enable");
        if ("error" in res && res.error) {
            setError(res.error);
            setIsLoading(false);
            return;
        }
        router.push("/register/school/ready");
    };

    if (pageLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#F6F5F2] text-[#3B3F6E] text-sm">Loading setup...</div>;
    }

    return (
        <div className="flex-1 w-full flex flex-col items-center p-6 bg-[#F6F5F2] min-h-screen relative">
            <div className="w-full max-w-[1000px] flex items-center justify-between mx-auto md:px-6 mt-4">
                <button type="button" onClick={() => router.back()} className="flex items-center gap-[6px] text-[#3B3F6E] hover:opacity-70 transition-opacity p-2 -ml-2 select-none cursor-pointer">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="font-bold text-[14px] mt-[1px]">Setup</span>
                </button>
                <span className="font-bold text-[13px] text-[#A29ECA] mr-2">Setup 2 of 3</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[620px] mx-auto pb-[15vh]">
                <h1 className="font-black text-[#3B3F6E] text-[24px] tracking-tight">Nevo's Learning Camera</h1>
                
                <div className="mt-8 mb-8 flex justify-center">
                    <div className="w-[66px] h-[66px] rounded-full bg-gradient-to-br from-[#FDDCDF]/80 to-[#F1B9C7] flex items-center justify-center relative overflow-hidden shadow-sm">
                        <div className="absolute inset-0 bg-[#FDDCDF]/20 mix-blend-overlay"></div>
                        <svg className="z-10 relative drop-shadow-sm" width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 8C2.89543 8 2 8.89543 2 10V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V10C22 8.89543 21.1046 8 20 8H16L15 5H9L8 8H4Z" fill="#3B3F6E"/>
                            <circle cx="12" cy="14" r="3" fill="#DFA1AD"/>
                        </svg>
                    </div>
                </div>

                <p className="text-[13px] text-graphite opacity-60 font-medium mb-[34px] text-center max-w-[500px] leading-relaxed">
                    Nevo can use students' device cameras to detect learning signals — like signs of confusion — to improve adaptation accuracy. No video is ever recorded or stored. Only a yes/no signal is processed, on-device.
                </p>

                <div className="w-full flex flex-col gap-[12px] mb-10 px-5">
                    <div className="flex items-start gap-[14px]">
                        <div className="shrink-0 mt-0.5 text-[#3B3F6E] opacity-60">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 14L8 19L21 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <p className="text-[12.5px] font-medium text-graphite opacity-60 leading-snug tracking-tight mt-[1px]">Processed entirely on device — nothing leaves the student's tablet</p>
                    </div>
                    <div className="flex items-start gap-[14px]">
                        <div className="shrink-0 mt-0.5 text-[#3B3F6E] opacity-60">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 14L8 19L21 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <p className="text-[12.5px] font-medium text-graphite opacity-60 leading-snug tracking-tight mt-[1px]">Students can disable it individually at any time</p>
                    </div>
                    <div className="flex items-start gap-[14px]">
                        <div className="shrink-0 mt-0.5 text-[#3B3F6E] opacity-60">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 14L8 19L21 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <p className="text-[12.5px] font-medium text-graphite opacity-60 leading-snug tracking-tight mt-[1px]">Works without it — this enhances Nevo, it does not gate it</p>
                    </div>
                </div>

                <div className="w-full flex flex-col md:flex-row gap-4 mb-7 justify-center px-4">
                    {/* Card 1 */}
                    <div 
                        onClick={() => setSelectedOption("enable")}
                        className={`w-full md:w-[280px] rounded-[10px] p-6 flex flex-col items-start cursor-pointer border transition-all ${
                            selectedOption === "enable" 
                            ? "border-[#3B3F6E] bg-[#3B3F6E]/[0.02]" 
                            : "border-[#3B3F6E]/20 bg-transparent hover:border-[#3B3F6E]/40"
                        }`}
                    >
                        <div className="w-full flex justify-between items-start mb-3">
                            <h3 className="font-bold text-[14px] text-[#3B3F6E]">Enable for our school</h3>
                            <div className={`w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                selectedOption === "enable" ? "border-[#3B3F6E] bg-[#3B3F6E]" : "border-[#B1AFCD]"
                            }`}>
                                {selectedOption === "enable" && (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5 12L10 17L20 7" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                )}
                            </div>
                        </div>
                        <p className="text-[12.5px] text-graphite font-medium opacity-60 leading-relaxed pr-6 tracking-tight">
                            Students will be prompted to allow camera access individually during onboarding.
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div 
                        onClick={() => setSelectedOption("later")}
                        className={`w-full md:w-[280px] rounded-[10px] p-6 flex flex-col items-start cursor-pointer border transition-all ${
                            selectedOption === "later" 
                            ? "border-[#3B3F6E] bg-[#3B3F6E]/[0.02]" 
                            : "border-[#3B3F6E]/20 bg-transparent hover:border-[#3B3F6E]/40"
                        }`}
                    >
                        <div className="w-full flex justify-between items-start mb-[14px]">
                            <h3 className="font-bold text-[14px] text-[#A29ECA]">Not right now</h3>
                            <div className={`w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                selectedOption === "later" ? "border-[#3B3F6E] bg-[#3B3F6E]" : "border-[#B1AFCD]"
                            }`}>
                                {selectedOption === "later" && (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5 12L10 17L20 7" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                )}
                            </div>
                        </div>
                        <p className="text-[12.5px] text-[#A29ECA] font-medium opacity-80 leading-relaxed pr-4 tracking-tight">
                            You can enable this later in school settings.
                        </p>
                    </div>
                </div>

                <div className="w-full px-4 max-w-[610px]">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={selectedOption === null || isLoading}
                        className={`w-full font-bold rounded-[8px] py-[13px] text-[14px] outline-none transition-all shadow-sm ${
                            selectedOption === null || isLoading
                                ? 'bg-[#9A9BB5] text-white cursor-not-allowed opacity-[0.85]'
                                : 'bg-[#3B3F6E] hover:opacity-90 text-white cursor-pointer active:scale-[0.98]'
                        }`}
                    >
                        {isLoading ? 'Saving...' : 'Continue'}
                    </button>
                    {error ? (
                        <p className="text-[11px] text-[#E57661] font-bold text-center mt-4">{error}</p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
