'use client';

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const navItems = [
    { name: 'Overview', view: null },
    { name: 'Classes', view: 'classes' },
    { name: 'Teachers', view: 'teachers' },
    { name: 'Students', view: 'students' },
    { name: 'Reports', view: 'reports' },
    { name: 'Settings', view: 'settings' },
] as const;

export function SchoolAdminSidebar({ user }: { user?: any }) {
    const searchParams = useSearchParams();
    const currentView = searchParams?.get('view') || null;

    return (
        <aside className="w-[200px] min-w-[200px] bg-[#FDFBF9] border-r border-[#E9E7E2] flex flex-col h-full">
            {/* Logo and School Name */}
            <div className="px-6 pt-8 pb-6">
                <div className="flex items-center gap-2 mb-4">
                    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 4C10 4 6 8 4 12C2 16 4 22 8 26C12 30 20 30 24 26C28 22 30 16 28 12C26 8 22 4 16 4Z" stroke="#3B3F6E" strokeWidth="2" fill="none"/>
                        <path d="M12 14C12 14 14 18 16 18C18 18 20 14 20 14" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className="text-[#3B3F6E] text-lg font-bold tracking-tight">Nevo</span>
                </div>
                <div className="text-[13px] font-medium text-[#3B3F6E] leading-snug">
                    Lagos International<br />Academy
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-1 px-3 flex-1 mt-4">
                {navItems.map((item) => {
                    const isActive = item.view === currentView;
                    const role = searchParams?.get('role');
                    const params = new URLSearchParams();
                    if (role) params.set('role', role);
                    if (item.view) params.set('view', item.view);
                    const href = params.toString() ? `/dashboard?${params.toString()}` : '/dashboard';
                    return (
                        <Link
                            key={item.name}
                            href={href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[13px] ${
                                isActive
                                    ? 'bg-[#EAE8F2] text-[#3B3F6E] font-semibold'
                                    : 'text-graphite-60 font-medium hover:bg-black/5 hover:text-[#3B3F6E]'
                            }`}
                        >
                            <SidebarIcon name={item.name} active={isActive} />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className="border-t border-[#E9E7E2] px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 w-full cursor-pointer group">
                    <div className="w-[30px] h-[30px] rounded-full bg-[#EAE8F2] flex items-center justify-center text-[#3B3F6E] text-[11px] font-bold shrink-0 transition-colors group-hover:bg-[#DFDCEB] uppercase">
                        {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : 'AD'}
                    </div>
                    <span className="text-[#3B3F6E] text-[12.5px] font-medium truncate flex-1">
                        {user?.name || 'Adebayo Okonkwo'}
                    </span>
                    <button className="text-graphite-40 cursor-pointer hover:text-[#3B3F6E] transition-colors shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.6.85 1 1.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        </aside>
    );
}

function SidebarIcon({ name, active }: { name: string; active: boolean }) {
    const opacity = active ? 1 : 0.6;
    const color = active ? "#3B3F6E" : "#8A8D9F";

    switch (name) {
        case 'Overview':
            return (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" opacity={opacity}>
                    <rect x="2" y="2" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.5"/>
                    <rect x="12" y="2" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.5"/>
                    <rect x="2" y="12" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.5"/>
                    <rect x="12" y="12" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.5"/>
                </svg>
            );
        case 'Classes':
            return (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" opacity={opacity}>
                    <rect x="3" y="5" width="14" height="12" rx="2" stroke={color} strokeWidth="1.5"/>
                    <path d="M6 3H14V5H6V3Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
                    <line x1="7" y1="10" x2="13" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
            );
        case 'Teachers':
            return (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" opacity={opacity}>
                    <path d="M10 2L12.44 7.06L18 7.82L13.91 11.66L14.96 17.11L10 14.41L5.04 17.11L6.09 11.66L2 7.82L7.56 7.06L10 2Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            );
        case 'Students':
            return (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" opacity={opacity}>
                    <circle cx="7" cy="7" r="3" stroke={color} strokeWidth="1.5"/>
                    <path d="M2 17C2 14.2386 4.23858 12 7 12C9.76142 12 12 14.2386 12 17" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="14" cy="8" r="2.5" stroke={color} strokeWidth="1.5"/>
                    <path d="M13 17C13 14.7909 14.7909 13 17 13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
            );
        case 'Reports':
            return (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" opacity={opacity}>
                    <rect x="4" y="3" width="12" height="14" rx="2" stroke={color} strokeWidth="1.5"/>
                    <line x1="7" y1="8" x2="13" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="7" y1="12" x2="11" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
            );
        case 'Settings':
            return (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" opacity={opacity}>
                    <circle cx="10" cy="10" r="3.5" stroke={color} strokeWidth="1.5"/>
                    <path d="M10 2V4M10 16V18M18 10H16M4 10H2M15.6569 4.34315L14.2426 5.75736M5.75736 14.2426L4.34315 15.6569M15.6569 15.6569L14.2426 14.2426M5.75736 5.75736L4.34315 4.34315" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            );
        default:
            return null;
    }
}
