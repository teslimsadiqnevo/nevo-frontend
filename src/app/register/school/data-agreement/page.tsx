"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/shared/ui";
import Link from "next/link";
import { getSchoolOnboardingStatus, updateSchoolConsent } from "@/features/Dashboard/api/school";

export default function DataAgreementPage() {
    const router = useRouter();
    const [isChecked, setIsChecked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        void (async () => {
            const res = await getSchoolOnboardingStatus();
            if (!mounted) return;
            if ("error" in res && res.error) {
                if (/unauthorized/i.test(res.error)) {
                    router.replace("/register/school/verify-email");
                    return;
                }
                setError(res.error);
            } else {
                const data = "data" in res ? res.data : null;
                if (data?.data_protection_consent) {
                    router.replace("/register/school/camera-setup");
                    return;
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
        const res = await updateSchoolConsent("data_protection", true);
        if ("error" in res && res.error) {
            setError(res.error);
            setIsLoading(false);
            return;
        }
        router.push("/register/school/camera-setup");
    };

    if (pageLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#F6F5F2] text-[#3B3F6E] text-sm">Loading setup...</div>;
    }

    return (
        <div className="flex-1 w-full flex flex-col items-center justify-center p-6 bg-[#F6F5F2] min-h-screen relative">
            <div className="absolute top-8 left-8 md:top-10 md:left-10">
                <Link href="/">
                    <Icon type="default" width={113} height={34} />
                </Link>
            </div>

            <div className="flex flex-col items-center w-full max-w-[620px] pb-10 mt-10">
                <h1 className="font-extrabold text-[#3B3F6E] text-[22px] mb-[6px] text-center tracking-tight">Before you continue</h1>
                <p className="text-[13px] text-graphite opacity-60 font-medium mb-8 text-center">Please review how Nevo handles your school's data.</p>
                
                <div className="w-full bg-white rounded-xl border border-[#3B3F6E]/15 p-8 flex flex-col gap-8 shadow-sm">
                    {/* Item 1 */}
                    <div className="flex gap-4">
                        <div className="shrink-0 mt-1">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM10.93 16L7.4 12.47L8.81 11.06L10.93 13.17L15.16 8.94L16.57 10.35L10.93 16Z" fill="#3B3F6E"/>
                            </svg>
                        </div>
                        <div className="flex flex-col gap-2">
                            <h3 className="font-bold text-[13px] text-[#3B3F6E]">What we collect</h3>
                            <p className="text-[12px] text-graphite opacity-60 leading-relaxed font-medium">
                                We collect learning interaction data to personalise each student's experience. 
                                We never sell student data to third parties.
                            </p>
                        </div>
                    </div>

                    {/* Item 2 */}
                    <div className="flex gap-4">
                        <div className="shrink-0 mt-1">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM9 6C9 4.34 10.34 3 12 3C13.66 3 15 4.34 15 6V8H9V6ZM18 20H6V10H18V20ZM12 17C13.1 17 14 16.1 14 15C14 13.9 13.1 13 12 13C10.9 13 10 15C10 16.1 10.9 17 12 17Z" fill="#3B3F6E"/>
                            </svg>
                        </div>
                        <div className="flex flex-col gap-2">
                            <h3 className="font-bold text-[13px] text-[#3B3F6E]">How it's protected</h3>
                            <p className="text-[12px] text-graphite opacity-60 leading-relaxed font-medium">
                                All data is encrypted in transit and at rest. Student data is only accessible to 
                                their assigned teachers and school admins.
                            </p>
                        </div>
                    </div>

                    {/* Item 3 */}
                    <div className="flex gap-4">
                        <div className="shrink-0 mt-1">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16.5 13C17.88 13 18.99 11.88 18.99 10.5C18.99 9.12 17.88 8 16.5 8C15.12 8 14 9.12 14 10.5C14 11.88 15.12 13 16.5 13ZM7.5 13C8.88 13 9.99 11.88 9.99 10.5C9.99 9.12 8.88 8 7.5 8C6.12 8 5 9.12 5 10.5C5 11.88 6.12 13 7.5 13ZM16.5 15C14.67 15 11 15.92 11 17.75V19H22V17.75C22 15.92 18.33 15 16.5 15ZM7.5 15C5.67 15 2 15.92 2 17.75V19H9.5V17.75C9.5 16.92 9.87 15.99 10.54 15.32C9.42 15.11 8.35 15 7.5 15Z" fill="#3B3F6E"/>
                            </svg>
                        </div>
                        <div className="flex flex-col gap-2">
                            <h3 className="font-bold text-[13px] text-[#3B3F6E]">Your responsibility</h3>
                            <p className="text-[12px] text-graphite opacity-60 leading-relaxed font-medium">
                                By proceeding, your school confirms it has obtained appropriate consent from 
                                parents or guardians for student data processing, in line with applicable law.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="w-full flex items-start gap-4 mt-8 px-2 cursor-pointer group" onClick={() => setIsChecked(!isChecked)}>
                    <div className={`mt-0.5 w-[20px] h-[20px] rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isChecked ? "bg-[#3B3F6E] border-[#3B3F6E]" : "border-[#3B3F6E]/40 group-hover:border-[#3B3F6E]/60"
                    }`}>
                        {isChecked && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 12L10 17L20 7" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        )}
                    </div>
                    <p className="text-[13px] text-graphite font-medium leading-relaxed opacity-80 pt-px select-none">
                        I confirm our school has obtained appropriate parental/guardian consent for student data processing.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!isChecked || isLoading}
                    className={`w-full font-bold rounded-[10px] py-[14px] text-[14px] outline-none transition-all mt-6 shadow-sm ${
                        !isChecked || isLoading
                            ? 'bg-[#9A9BB5] text-white cursor-not-allowed opacity-90'
                            : 'bg-[#3B3F6E] text-white hover:opacity-90 active:scale-[0.98] cursor-pointer'
                    }`}
                >
                    {isLoading ? 'Creating workspace...' : 'Create school workspace'}
                </button>

                {error ? (
                    <p className="text-[11px] text-[#E57661] font-bold text-center mt-4">{error}</p>
                ) : null}

                <p className="text-[11px] text-graphite opacity-60 font-bold text-center mt-4">
                    Questions? <a href="/privacy" className="underline hover:text-[#3B3F6E] transition-colors">Read our full Privacy Policy</a>
                </p>
            </div>
        </div>
    );
}
