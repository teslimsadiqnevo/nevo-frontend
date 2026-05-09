'use client';

import { Icon, NevoLogo, UserAvatar } from "@/shared/ui";
import { AskNevoDrawer } from "@/widgets/AskNevoDrawer";
import { getDashboardPath, type TeacherDashboardView } from "@/shared/lib";
import Link from "next/link";
import { useState } from "react";

const navItems = [
    { name: 'Dashboard', view: null },
    { name: 'Lessons', view: 'lessons' },
    { name: 'Students', view: 'students' },
    { name: 'Insights', view: 'insights' },
    { name: 'Connect', view: 'connect' },
] as const;

type SidebarUser = {
    name?: string | null;
    avatarUrl?: string | null;
};

export function TeacherSidebar({
    user,
    currentView = 'home',
}: {
    user?: SidebarUser | null;
    currentView?: string | null;
}) {
    const [showAskNevo, setShowAskNevo] = useState(false);
    const displayName = user?.name?.trim() || '';
    const isProfileActive = currentView === 'profile';
    const askPage = currentView || 'home';
    const askContext = `You are on Teacher Dashboard > ${
        currentView ? currentView.charAt(0).toUpperCase() + currentView.slice(1) : 'Home'
    }`;

    const buildHref = (view: TeacherDashboardView | null) => getDashboardPath('teacher', view || 'home');

    return (
        <aside className="fixed inset-y-0 left-0 z-30 flex h-[100dvh] w-[220px] min-w-[220px] flex-col overflow-hidden bg-[#3B3F6E]">
            <div className="px-6 pt-6 pb-6">
                <NevoLogo className="h-6 w-auto" width={80} height={24} variant="light" />
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto px-0">
                <div className="flex flex-col gap-1 pb-2">
                {navItems.map((item) => {
                    const isActive = (item.view || 'home') === (currentView || 'home');
                    return (
                        <Link
                            key={item.name}
                            href={buildHref(item.view)}
                            className={`relative flex h-12 w-[220px] items-center gap-[10px] px-0 pl-5 text-[14px] transition-all ${
                                isActive
                                    ? 'bg-[#4A5080] text-[#F7F1E6] font-medium'
                                    : 'text-[#F7F1E6]/50 font-medium hover:bg-white/8 hover:text-[#F7F1E6]/80'
                            }`}
                        >
                            {isActive ? <span className="absolute left-0 top-0 h-12 w-[3px] bg-[#F7F1E6]" /> : null}
                            <SidebarIcon name={item.name} active={isActive} />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
                </div>
            </nav>

            <div className="px-4 pb-3 pt-2">
                <button
                    type="button"
                    onClick={() => setShowAskNevo(true)}
                    className="flex justify-center items-center gap-2 w-full bg-[#4A5080] text-[#F7F1E6] py-[12px] rounded-[9999px] font-semibold text-[14px] border border-white/30 hover:bg-[#555B8B] transition-colors cursor-pointer"
                >
                    <Icon type="galaxy" width={16} height={16} className="invert brightness-200" />
                    <span>Ask Nevo</span>
                </button>
            </div>

            <div className="px-5 pb-4 pt-0">
                <Link
                    href={buildHref('profile')}
                    className={`flex items-center gap-[10px] rounded-xl py-2 transition-colors cursor-pointer ${
                        isProfileActive ? 'bg-white/15' : 'hover:bg-white/8'
                    }`}
                >
                    <UserAvatar
                        name={displayName || 'Teacher'}
                        avatarUrl={user?.avatarUrl}
                        size={32}
                        bg="#5D6199"
                        fg="#FFFFFF"
                        fontClassName="text-[11px] font-bold"
                    />
                    <span className="text-white/80 text-[13px] font-medium truncate">
                        {displayName || 'Teacher'}
                    </span>
                </Link>
            </div>

            <AskNevoDrawer
                open={showAskNevo}
                onClose={() => setShowAskNevo(false)}
                leftInset={220}
                page={askPage}
                context={askContext}
            />
        </aside>
    );
}

function SidebarIcon({ name, active }: { name: string; active: boolean }) {
    const opacity = active ? 1 : 0.5;
    const color = "#F7F1E6";

    switch (name) {
        case 'Dashboard':
            return (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" opacity={opacity}>
                    <rect x="2" y="2" width="7" height="7" rx="2" stroke={color} strokeWidth="1.5" fill={active ? "white" : "none"} fillOpacity={active ? 0.3 : 0}/>
                    <rect x="11" y="2" width="7" height="7" rx="2" stroke={color} strokeWidth="1.5" fill={active ? "white" : "none"} fillOpacity={active ? 0.3 : 0}/>
                    <rect x="2" y="11" width="7" height="7" rx="2" stroke={color} strokeWidth="1.5" fill={active ? "white" : "none"} fillOpacity={active ? 0.3 : 0}/>
                    <rect x="11" y="11" width="7" height="7" rx="2" stroke={color} strokeWidth="1.5" fill={active ? "white" : "none"} fillOpacity={active ? 0.3 : 0}/>
                </svg>
            );
        case 'Lessons':
            return (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" opacity={opacity}>
                    <rect x="3" y="2" width="14" height="16" rx="2" stroke={color} strokeWidth="1.5"/>
                    <line x1="7" y1="6" x2="13" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="7" y1="10" x2="13" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="7" y1="14" x2="11" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
            );
        case 'Students':
            return (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" opacity={opacity}>
                    <circle cx="7" cy="7" r="3" stroke={color} strokeWidth="1.5"/>
                    <path d="M2 17C2 14.2386 4.23858 12 7 12C9.76142 12 12 14.2386 12 17" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="14" cy="8" r="2.5" stroke={color} strokeWidth="1.5"/>
                    <path d="M13 17C13 14.7909 14.7909 13 17 13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
            );
        case 'Insights':
            return (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" opacity={opacity}>
                    <path d="M3 17L8 10L12 13L17 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            );
        case 'Connect':
            return (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" opacity={opacity}>
                    <path d="M3 15V5C3 3.89543 3.89543 3 5 3H15C16.1046 3 17 3.89543 17 5V12C17 13.1046 16.1046 14 15 14H7L3 17Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
                    <circle cx="7" cy="8.5" r="1" fill={color}/>
                    <circle cx="10" cy="8.5" r="1" fill={color}/>
                    <circle cx="13" cy="8.5" r="1" fill={color}/>
                </svg>
            );
        default:
            return null;
    }
}

