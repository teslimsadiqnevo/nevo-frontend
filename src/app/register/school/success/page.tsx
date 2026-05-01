"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSchoolOnboardingStatus } from "@/features/Dashboard/api/school";

export default function SchoolSuccessPage() {
    const router = useRouter();
    const [schoolName, setSchoolName] = useState("Your school");

    useEffect(() => {
        let mounted = true;
        void (async () => {
            const res = await getSchoolOnboardingStatus();
            if (!mounted) return;
            const data = "data" in res ? res.data : null;
            if (data?.school_name) {
                setSchoolName(data.school_name);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div className="flex-1 w-full flex flex-col items-center justify-center p-6 bg-[#F6F5F2] min-h-screen relative overflow-x-hidden">
            <div className="flex flex-col items-center justify-center w-full max-w-[620px] mx-auto pb-[5vh]">
                
                {/* Central Identity Mark */}
                <div className="w-[100px] h-[100px] bg-[#EAF2E4] rounded-full flex items-center justify-center mb-8 shadow-sm">
                    <div className="text-[#7DBF83]">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                </div>

                <h1 className="font-bold text-[#3B3F6E] text-[26px] tracking-tight mb-3">Your school is ready.</h1>
                <p className="text-[14.5px] text-graphite opacity-60 mb-[42px] text-center max-w-[420px] tracking-tight leading-relaxed">
                    {schoolName} is now set up on Nevo. Here's what to do next.
                </p>

                {/* Cards Block */}
                <div className="w-full max-w-[580px] flex flex-col gap-3.5 mb-10">
                    
                    {/* Card 1 */}
                    <div className="w-full bg-white rounded-xl border border-indigo/15 hover:border-indigo/40 transition-colors p-[18px] md:px-6 md:py-5 flex items-center justify-between cursor-pointer shadow-[0px_2px_4px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-[18px]">
                            <div className="shrink-0 text-indigo opacity-70">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M20 8V14M23 11H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <div className="flex flex-col items-start gap-1">
                                <h3 className="font-bold text-[14px] text-[#3B3F6E]">Invite your teachers</h3>
                                <p className="text-[12.5px] text-graphite opacity-[55%] font-medium">Send invites so teachers can start uploading lessons.</p>
                            </div>
                        </div>
                        <span className="text-[12.5px] text-[#A29ECA] font-medium shrink-0 ml-4">Do this now</span>
                    </div>

                    {/* Card 2 */}
                    <div className="w-full bg-white rounded-xl border border-indigo/15 hover:border-indigo/40 transition-colors p-[18px] md:px-6 md:py-5 flex items-center justify-between cursor-pointer shadow-[0px_2px_4px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-[18px]">
                            <div className="shrink-0 text-indigo opacity-70">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22 19C22 19.5304 21.7893 20.0391 21.4142 20.4142C21.0391 20.7893 20.5304 21 20 21H4C3.46957 21 2.96086 20.7893 2.58579 20.4142C2.21071 20.0391 2 19.5304 2 19V5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H9L11 6H20C20.5304 6 21.0391 6.21071 21.4142 6.58579C21.7893 6.96086 22 7.46957 22 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M12 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M9 14H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <div className="flex flex-col items-start gap-1">
                                <h3 className="font-bold text-[14px] text-[#3B3F6E]">Create your first class</h3>
                                <p className="text-[12.5px] text-graphite opacity-[55%] font-medium">Set up classes and assign teachers to them.</p>
                            </div>
                        </div>
                        <span className="text-[12.5px] text-[#A29ECA] font-medium shrink-0 ml-4">Do this now</span>
                    </div>

                    {/* Card 3 */}
                    <div className="w-full bg-white rounded-xl border border-indigo/15 hover:border-indigo/40 transition-colors p-[18px] md:px-6 md:py-5 flex items-center justify-between cursor-pointer shadow-[0px_2px_4px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-[18px]">
                            <div className="shrink-0 text-indigo opacity-70">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                    <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                    <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                    <path d="M14 14H21V21H14V14Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <div className="flex flex-col items-start gap-1">
                                <h3 className="font-bold text-[14px] text-[#3B3F6E]">Share your school code</h3>
                                <p className="text-[12.5px] text-graphite opacity-[55%] font-medium">Students and teachers need this to join your school.</p>
                            </div>
                        </div>
                        <span className="text-[12.5px] text-[#A29ECA] font-medium shrink-0 ml-4">View code</span>
                    </div>

                </div>

                {/* Final Nav */}
                <div className="w-full max-w-[580px]">
                    <button
                        type="button"
                        onClick={() => router.push('/dashboard')}
                        className="w-full font-bold rounded-[8px] py-[15px] text-[14px] outline-none transition-all shadow-sm bg-[#3B3F6E] hover:opacity-90 text-white cursor-pointer active:scale-[0.98]"
                    >
                        Go to dashboard
                    </button>
                </div>

            </div>
        </div>
    );
}
