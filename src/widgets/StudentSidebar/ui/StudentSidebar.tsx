'use client';

import { Icon, UserAvatar } from "@/shared/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type SidebarUser = {
    name?: string | null;
    avatarUrl?: string | null;
};

const navItems = [
    { name: 'Home', view: null },
    { name: 'Lessons', view: 'lessons' },
    { name: 'Downloads', view: 'downloads' },
    { name: 'Progress', view: 'progress' },
    { name: 'Connect', view: 'connect' },
    { name: 'Profile', view: 'profile' },
] as const;

export function StudentSidebar({ user }: { user?: SidebarUser | null } = {}) {
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view') || null;
    const displayName = user?.name?.trim() || '';

    return (
        <aside className="w-[220px] min-w-[220px] bg-[#3B3F6E] flex flex-col h-full">
            {/* Logo */}
            <div className="px-6 pt-6 pb-5">
                <div className="flex items-center gap-2">
                    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 4C10 4 6 8 4 12C2 16 4 22 8 26C12 30 20 30 24 26C28 22 30 16 28 12C26 8 22 4 16 4Z" stroke="white" strokeWidth="2" fill="none"/>
                        <path d="M12 14C12 14 14 18 16 18C18 18 20 14 20 14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className="text-white text-xl font-bold tracking-tight">Nevo</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-1 px-0 flex-1">
                {navItems.map((item) => {
                    const isActive = item.view === currentView;
                    const role = searchParams.get('role');
                    const params = new URLSearchParams();
                    if (role) params.set('role', role);
                    if (item.view) params.set('view', item.view);
                    const href = params.toString() ? `/dashboard?${params.toString()}` : (role ? `/dashboard?role=${role}` : '/dashboard');
                    return (
                        <Link
                            key={item.name}
                            href={href}
                            className={`relative flex items-center gap-3 px-6 py-3.5 transition-all text-[14px] ${
                                isActive
                                    ? 'bg-[#4A5080] text-[#F7F1E6] font-medium'
                                    : 'text-white/60 font-medium hover:bg-white/8 hover:text-white/90'
                            }`}
                        >
                            <StudentSidebarIcon name={item.name} active={isActive} />
                            <span>{item.name}</span>
                            {isActive && <span className="absolute left-0 top-0 h-full w-[3px] bg-[#F7F1E6]" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Ask Nevo Button */}
            <div className="px-4 pb-6 pt-2">
                <button className="flex justify-center items-center gap-2 w-full bg-[#4A5080] text-[#F7F1E6] py-[12px] rounded-[20px] font-semibold text-[14px] border border-white/30 hover:bg-[#555B8B] transition-colors cursor-pointer backdrop-blur-sm">
                    <Icon type="galaxy" width={16} height={16} className="invert brightness-200" />
                    <span>Ask Nevo</span>
                </button>
            </div>
        </aside>
    );
}

function StudentSidebarIcon({ name, active }: { name: string; active: boolean }) {
    const opacity = active ? 1 : 0.7;
    const color = "white";

    switch (name) {
        case 'Home':
            return (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" opacity={opacity}>
                    <path d="M3 10L10 3L17 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 9V16C5 16.5523 5.44772 17 6 17H8.5V13C8.5 12.4477 8.94772 12 9.5 12H10.5C11.0523 12 11.5 12.4477 11.5 13V17H14C14.5523 17 15 16.5523 15 16V9" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={active ? "white" : "none"} fillOpacity={active ? 0.2 : 0}/>
                </svg>
            );
        case 'Lessons':
            return (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" opacity={opacity}>
                    <rect x="3" y="2" width="14" height="16" rx="2" stroke={color} strokeWidth="1.5"/>
                    <line x1="7" y1="6" x2="13" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="7" y1="10" x2="13" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="7" y1="14" x2="11" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
            );
        case 'Downloads':
            return (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" opacity={opacity}>
                    <path d="M10 3V13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M6 10L10 14L14 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 15V16C3 16.5523 3.44772 17 4 17H16C16.5523 17 17 16.5523 17 16V15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            );
        case 'Progress':
            return (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" opacity={opacity}>
                    <path d="M3 17L8 10L12 13L17 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            );
        case 'Connect':
            return (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" opacity={opacity}>
                    <path d="M3 15V5C3 3.89543 3.89543 3 5 3H15C16.1046 3 17 3.89543 17 5V12C17 13.1046 16.1046 14 15 14H7L3 17Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
                    <circle cx="7" cy="8.5" r="1" fill={color}/>
                    <circle cx="10" cy="8.5" r="1" fill={color}/>
                    <circle cx="13" cy="8.5" r="1" fill={color}/>
                </svg>
            );
        case 'Profile':
            return (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" opacity={opacity}>
                    <circle cx="10" cy="7" r="3.5" stroke={color} strokeWidth="1.5"/>
                    <path d="M3 18C3 14.6863 6.13401 12 10 12C13.866 12 17 14.6863 17 18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
            );
        default:
            return null;
    }
}
