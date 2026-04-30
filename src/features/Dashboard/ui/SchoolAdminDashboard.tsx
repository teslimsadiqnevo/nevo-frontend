'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SchoolAdminSidebar } from "@/widgets";
import { ClassesView } from './ClassesView';
import { TeachersView } from './TeachersView';
import { StudentsView } from './StudentsView';
import { ReportsView } from './ReportsView';
import { SettingsView } from './SettingsView';

export function SchoolAdminDashboard({ user }: { user?: any }) {
    const searchParams = useSearchParams();
    const currentView = searchParams?.get('view') || null;
    const [hasData, setHasData] = useState(true);

    const renderView = () => {
        switch (currentView) {
            case 'classes':
                return <ClassesView />;
            case 'teachers':
                return <TeachersView />;
            case 'students':
                return <StudentsView />;
            case 'reports':
                return <ReportsView />;
            case 'settings':
                return <SettingsView />;
            default:
                return hasData ? <AdminDashboardOverview user={user} /> : <AdminDashboardEmpty />;
        }
    };

    return (
        <div className="flex bg-[#F7F1E6] font-sans h-screen w-full overflow-hidden">
            <SchoolAdminSidebar user={user} />
            <main className="flex-1 px-[48px] py-[48px] overflow-y-auto relative">
                {renderView()}
                
                {!currentView && (
                    <button 
                      onClick={() => setHasData(!hasData)}
                      className="fixed bottom-6 right-6 px-4 py-2 bg-white text-[#3B3F6E] rounded-full text-[11px] font-bold shadow-[0_4px_12px_rgba(0,0,0,0.1)] z-50 border border-[#E9E7E2] hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Toggle Dev View
                    </button>
                )}
            </main>
        </div>
    );
}

function AdminDashboardOverview({ user }: { user?: any }) {
    return (
        <div className="w-full flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                    <h1 className="text-[22px] font-bold text-[#3B3F6E] tracking-tight">Overview</h1>
                    {user?.name && (
                        <p className="text-[14px] text-graphite-60">Welcome back, {user.name}</p>
                    )}
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-[#3B3F6E] rounded-[24px] bg-transparent text-[13px] font-semibold text-[#3B3F6E] hover:bg-black/5 transition-colors cursor-pointer">
                    This week
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 4.5L6 7.5L9 4.5" />
                    </svg>
                </button>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-4 gap-4">
                <StatCard 
                    number="847" 
                    label="Active students today" 
                />
                <StatCard 
                    number="1,234" 
                    label="Lessons completed this week" 
                />
                <StatCard 
                    number="42" 
                    label="Teachers active this week" 
                />
                <StatCard 
                    number="156" 
                    label="Topics where understanding is growing" 
                />
            </div>

            {/* Middle Section: Chart and Progress */}
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-white rounded-2xl p-6 border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <h2 className="text-[14px] font-bold text-[#3B3F6E] mb-6 tracking-tight">Engagement over time</h2>
                    <div className="w-full h-[220px] bg-[#FDFBF9] rounded-xl flex flex-col justify-between overflow-hidden pt-4 pb-2 relative">
                        {/* Mock Chart line */}
                        <div className="absolute inset-0 top-8 z-0">
                             <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="w-full h-full">
                                <path 
                                    d="M 0 140 C 150 140, 250 120, 350 125 C 450 130, 500 90, 600 95 C 700 100, 800 140, 900 150 C 950 155, 1000 145, 1000 145 L 1000 200 L 0 200 Z" 
                                    fill="#EAE8F2" 
                                    fillOpacity="0.4"
                                />
                                <path 
                                    d="M 0 140 C 150 140, 250 120, 350 125 C 450 130, 500 90, 600 95 C 700 100, 800 140, 900 150 C 950 155, 1000 145, 1000 145" 
                                    stroke="#3B3F6E" 
                                    strokeWidth="2" 
                                    fill="none" 
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                        <div className="flex-1" />
                        <div className="flex justify-between px-6 text-[11px] text-[#A29ECA] font-medium z-10">
                            <span>Mon</span>
                            <span>Tue</span>
                            <span>Wed</span>
                            <span>Thu</span>
                            <span>Fri</span>
                            <span>Sat</span>
                            <span>Sun</span>
                        </div>
                    </div>
                    <p className="text-[11px] text-[#A29ECA] font-medium mt-3">Daily active learners this week.</p>
                </div>
                
                <div className="col-span-1 bg-white rounded-2xl p-6 border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <h2 className="text-[14px] font-bold text-[#3B3F6E] mb-6 tracking-tight">Curriculum coverage</h2>
                    <div className="flex flex-col gap-5">
                        <ProgressBar label="Mathematics" total={8} current={6} />
                        <ProgressBar label="English Language" total={8} current={5} />
                        <ProgressBar label="Basic Science" total={8} current={7} />
                        <ProgressBar label="Social Studies" total={8} current={4} />
                        <ProgressBar label="Civic Education" total={8} current={3} />
                    </div>
                </div>
            </div>

            {/* Bottom Section: Success and Focus Areas */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <h2 className="text-[14px] font-bold text-[#3B3F6E] mb-6 tracking-tight">Concepts building well</h2>
                    <div className="flex flex-col gap-4">
                        <InsightRow type="success" text="Fractions and decimals in Mathematics" />
                        <InsightRow type="success" text="Past tense verbs in English Language" />
                        <InsightRow type="success" text="Plant structure in Basic Science" />
                        <InsightRow type="success" text="Nigerian geography in Social Studies" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <h2 className="text-[14px] font-bold text-[#3B3F6E] mb-6 tracking-tight">Where support may be needed</h2>
                    <div className="flex flex-col gap-4">
                        <InsightRow type="warning" text="Verb tenses in English Language" />
                        <InsightRow type="warning" text="Photosynthesis in Basic Science" />
                        <InsightRow type="warning" text="Map reading in Social Studies" />
                        <InsightRow type="warning" text="Federal system in Civic Education" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ number, label }: { number: string, label: string }) {
    return (
        <div className="bg-white rounded-2xl px-6 py-6 border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col gap-1">
            <span className="text-[32px] font-bold text-[#3B3F6E] tracking-tight">{number}</span>
            <span className="text-[13px] text-graphite-60 font-medium leading-snug">{label}</span>
        </div>
    );
}

function ProgressBar({ label, total, current }: { label: string, total: number, current: number }) {
    const percentage = (current / total) * 100;
    
    return (
        <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-[#3B3F6E]">{label}</span>
            <div className="flex items-center gap-3">
                <div className="flex-1 h-[6px] bg-[#EAE8F2] rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-[#3B3F6E] rounded-full" 
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <span className="text-[11px] font-medium text-[#A29ECA] shrink-0 w-[80px]">{current} of {total} units active</span>
            </div>
        </div>
    );
}

function InsightRow({ type, text }: { type: 'success' | 'warning', text: string }) {
    const isSuccess = type === 'success';
    const barColor = isSuccess ? 'bg-[#5A9B6A]' : 'bg-[#E59842]';
    const textColor = '#3B3F6E';

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`w-1 h-5 rounded-full ${barColor}`} />
                <span className={`text-[13px] font-medium text-[${textColor}]`}>{text}</span>
            </div>
            {isSuccess ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A9B6A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7" />
                    <path d="M7 7H17V17" />
                </svg>
            ) : (
                <span className="text-[#E59842] font-bold text-[16px] leading-none">!</span>
            )}
        </div>
    );
}

function AdminDashboardEmpty() {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full max-w-[800px] mx-auto -mt-10">
            {/* Visual Graphic */}
            <div className="w-[200px] h-[200px] bg-[#EBE9F1] rounded-full flex items-center justify-center mb-8 relative">
                {/* Simulated inner graphic */}
                <div className="w-[80px] h-[70px] bg-[#C1BCD9] rounded-2xl shadow-inner relative flex flex-col items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3B3F6E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
                        <path d="M20 6L9 17L4 12" />
                    </svg>
                    <div className="absolute bottom-[-10px] w-[50%] h-[12px] bg-[#A29ECA] rounded-[4px] opacity-70" />
                </div>
            </div>
            
            <p className="text-[14px] text-graphite-60 font-medium text-center mb-6 max-w-[320px] leading-relaxed">
                Invite teachers and enroll students to see your school&apos;s activity.
            </p>
            
            <div className="flex items-center gap-3">
                <button className="px-6 py-[10px] bg-[#3B3F6E] hover:bg-[#2C2F52] text-white rounded-lg font-semibold text-[13px] transition-colors cursor-pointer border border-transparent">
                    Add teachers
                </button>
                <button className="px-6 py-[10px] bg-transparent hover:bg-black/5 border border-[#3B3F6E] text-[#3B3F6E] rounded-lg font-semibold text-[13px] transition-colors cursor-pointer">
                    Enroll students
                </button>
            </div>
        </div>
    );
}
