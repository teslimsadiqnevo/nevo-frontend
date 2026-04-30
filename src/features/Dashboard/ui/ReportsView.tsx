'use client';

import { useState } from 'react';

const LESSON_COMPLETION = [
    { cls: 'JSS 1A', completed: 16, total: 20 },
    { cls: 'JSS 1B', completed: 14, total: 20 },
    { cls: 'JSS 2A', completed: 18, total: 20 },
    { cls: 'JSS 2B', completed: 12, total: 20 },
    { cls: 'JSS 3A', completed: 19, total: 20 },
    { cls: 'JSS 3B', completed: 15, total: 20 },
];

const TEACHER_ACTIVITY = [
    { name: 'Chioma Okafor', uploaded: 3, assigned: 8, lastActive: '2 hours ago' },
    { name: 'Ibrahim Musa', uploaded: 5, assigned: 12, lastActive: 'Today' },
    { name: 'Ngozi Eze', uploaded: 2, assigned: 5, lastActive: 'Yesterday' },
    { name: 'Tunde Balogun', uploaded: 4, assigned: 10, lastActive: '3 days ago' },
    { name: 'Fatima Hassan', uploaded: 6, assigned: 15, lastActive: 'Today' },
];

const CURRICULUM_COVERAGE = [
    { subject: 'Mathematics', lessons: 12, pct: 85 },
    { subject: 'English Language', lessons: 15, pct: 92 },
    { subject: 'Basic Science', lessons: 10, pct: 70 },
    { subject: 'Social Studies', lessons: 11, pct: 78 },
    { subject: 'Computer Studies', lessons: 8, pct: 55 },
    { subject: 'Yoruba Language', lessons: 9, pct: 62 },
];

export function ReportsView() {
    const [hasData, setHasData] = useState(true);

    return (
        <>
            <div className="w-full flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-[22px] font-bold text-[#3B3F6E] tracking-tight">Reports</h1>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-[10px] border border-[#E9E7E2] rounded-lg text-[13px] font-medium text-[#3B3F6E] bg-white hover:bg-black/5 transition-colors cursor-pointer">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="2" width="12" height="12" rx="2" />
                                <line x1="2" y1="6" x2="14" y2="6" />
                                <line x1="6" y1="2" x2="6" y2="6" />
                            </svg>
                            This month
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M3 4.5L6 7.5L9 4.5" />
                            </svg>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-[10px] border border-[#E9E7E2] rounded-lg text-[13px] font-medium text-graphite-40 bg-white hover:bg-black/5 transition-colors cursor-pointer">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 2v12M12 2v12M2 8h12" />
                                <rect x="2" y="4" width="12" height="8" rx="1" />
                            </svg>
                            Export PDF
                        </button>
                    </div>
                </div>

                {hasData ? (
                    <div className="grid grid-cols-2 gap-4">
                        {/* Student engagement */}
                        <div className="bg-white rounded-2xl p-6 border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                            <h2 className="text-[14px] font-bold text-[#3B3F6E] mb-6 tracking-tight">Student engagement</h2>
                            <div className="w-full h-[180px] bg-[#FDFBF9] rounded-xl flex flex-col justify-between overflow-hidden pt-4 pb-2 relative">
                                <div className="absolute inset-0 top-6 z-0">
                                    <svg viewBox="0 0 1000 180" preserveAspectRatio="none" className="w-full h-full">
                                        <path
                                            d="M 0 140 C 100 130, 200 120, 300 110 C 400 100, 450 80, 550 75 C 650 70, 700 85, 800 70 C 850 65, 900 60, 1000 55"
                                            stroke="#3B3F6E" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
                                        />
                                        <path
                                            d="M 0 140 C 100 130, 200 120, 300 110 C 400 100, 450 80, 550 75 C 650 70, 700 85, 800 70 C 850 65, 900 60, 1000 55 L 1000 180 L 0 180 Z"
                                            fill="#EAE8F2" fillOpacity="0.4"
                                        />
                                    </svg>
                                </div>
                                <div className="flex-1" />
                                <div className="flex justify-between px-4 text-[11px] text-[#A29ECA] font-medium z-10">
                                    <span>Jan 6</span>
                                    <span>Jan 11</span>
                                    <span>Jan 16</span>
                                    <span>Jan 21</span>
                                    <span>Jan 26</span>
                                    <span>Jan 31</span>
                                </div>
                            </div>
                            <p className="text-[11px] text-[#A29ECA] font-medium mt-3">Daily active learners.</p>
                        </div>

                        {/* Lesson completion */}
                        <div className="bg-white rounded-2xl p-6 border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                            <h2 className="text-[14px] font-bold text-[#3B3F6E] mb-5 tracking-tight">Lesson completion</h2>
                            <div className="flex flex-col gap-4">
                                {LESSON_COMPLETION.map(item => (
                                    <div key={item.cls} className="flex items-center gap-3">
                                        <span className="text-[12px] font-semibold text-[#3B3F6E] w-[50px] shrink-0">{item.cls}</span>
                                        <div className="flex-1 h-[8px] bg-[#EAE8F2] rounded-full overflow-hidden">
                                            <div className="h-full bg-[#3B3F6E] rounded-full" style={{ width: `${(item.completed / item.total) * 100}%` }} />
                                        </div>
                                        <span className="text-[11px] text-graphite-40 shrink-0 w-[140px]">{item.completed} of {item.total} lessons completed</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Teacher activity */}
                        <div className="bg-white rounded-2xl p-6 border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                            <h2 className="text-[14px] font-bold text-[#3B3F6E] mb-5 tracking-tight">Teacher activity</h2>
                            <table className="w-full">
                                <thead>
                                    <tr className="text-[11px] text-graphite-40 font-medium">
                                        <td className="pb-3">Teacher</td>
                                        <td className="pb-3">Uploaded</td>
                                        <td className="pb-3">Assigned</td>
                                        <td className="pb-3">Last active</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {TEACHER_ACTIVITY.map(t => (
                                        <tr key={t.name} className="border-t border-[#F0EDE6]">
                                            <td className="py-3 text-[13px] font-medium text-[#3B3F6E]">{t.name}</td>
                                            <td className="py-3 text-[13px] text-[#3B3F6E]">{t.uploaded}</td>
                                            <td className="py-3 text-[13px] text-[#3B3F6E]">{t.assigned}</td>
                                            <td className="py-3 text-[12px] text-graphite-40">{t.lastActive}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Curriculum coverage */}
                        <div className="bg-white rounded-2xl p-6 border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                            <h2 className="text-[14px] font-bold text-[#3B3F6E] mb-5 tracking-tight">Curriculum coverage</h2>
                            <div className="flex flex-col gap-4">
                                {CURRICULUM_COVERAGE.map(item => (
                                    <div key={item.subject} className="flex items-center gap-3">
                                        <span className="text-[12px] font-medium text-[#3B3F6E] w-[120px] shrink-0">{item.subject}</span>
                                        <div className="flex-1 h-[8px] bg-[#EAE8F2] rounded-full overflow-hidden">
                                            <div className="h-full bg-[#3B3F6E] rounded-full" style={{ width: `${item.pct}%` }} />
                                        </div>
                                        <span className="text-[11px] text-graphite-40 shrink-0 px-2 py-[2px] bg-[#EAE8F2] rounded-full">{item.lessons} active lessons</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {['Student engagement', 'Lesson completion', 'Teacher activity', 'Curriculum coverage'].map(title => (
                            <div key={title} className="bg-white rounded-2xl p-6 border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.02)] min-h-[240px] flex flex-col">
                                <h2 className="text-[14px] font-bold text-[#3B3F6E] mb-4 tracking-tight">{title}</h2>
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <div className="w-[48px] h-[40px] bg-[#EAE8F2] rounded-lg mb-3" />
                                    <p className="text-[13px] text-graphite-40">No data for selected period.</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button
                onClick={() => setHasData(!hasData)}
                className="fixed bottom-6 right-6 px-4 py-2 bg-white text-[#3B3F6E] rounded-full text-[11px] font-bold shadow-[0_4px_12px_rgba(0,0,0,0.1)] z-50 border border-[#E9E7E2] hover:bg-gray-50 transition-colors cursor-pointer"
            >
                Toggle Empty/Populated
            </button>
        </>
    );
}
