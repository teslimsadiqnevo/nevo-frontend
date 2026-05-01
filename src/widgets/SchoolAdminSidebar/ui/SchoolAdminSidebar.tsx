'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSchoolSettings } from "@/features/Dashboard/api/school";
import { getInitials } from "@/shared/lib";

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
    const [schoolName, setSchoolName] = useState('Your School');

    useEffect(() => {
        let mounted = true;
        void (async () => {
            const res = await getSchoolSettings();
            if (!mounted) return;
            const data = 'data' in res ? res.data : null;
            if (data?.school_name) {
                setSchoolName(data.school_name);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const adminName = useMemo(() => {
        return user?.name || user?.full_name || user?.email || 'School Admin';
    }, [user]);

    const buildHref = (view: string | null) => {
        const params = new URLSearchParams();
        const role = searchParams?.get('role');
        if (role) params.set('role', role);
        if (view) params.set('view', view);
        const query = params.toString();
        return query ? `/dashboard?${query}` : '/dashboard';
    };

    return (
        <aside className="w-[220px] min-w-[220px] bg-[#FDFBF9] border-r border-[#E9E7E2] flex flex-col h-full">
            <div className="px-6 pt-8 pb-6">
                <div className="flex items-center gap-2 mb-4">
                    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 4C10 4 6 8 4 12C2 16 4 22 8 26C12 30 20 30 24 26C28 22 30 16 28 12C26 8 22 4 16 4Z" stroke="#3B3F6E" strokeWidth="2" fill="none"/>
                        <path d="M12 14C12 14 14 18 16 18C18 18 20 14 20 14" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className="text-[#3B3F6E] text-lg font-bold tracking-tight">Nevo</span>
                </div>
                <div className="text-[13px] font-medium text-[#3B3F6E] leading-snug break-words">
                    {schoolName}
                </div>
            </div>

            <nav className="flex flex-col gap-1 px-3 flex-1 mt-4">
                {navItems.map((item) => {
                    const isActive = item.view === currentView || (!item.view && !currentView);
                    return (
                        <Link
                            key={item.name}
                            href={buildHref(item.view)}
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

            <div className="border-t border-[#E9E7E2] px-4 py-4 flex items-center gap-3">
                <div className="w-[34px] h-[34px] rounded-full bg-[#EAE8F2] flex items-center justify-center text-[#3B3F6E] text-[12px] font-bold shrink-0 uppercase">
                    {getInitials(adminName)}
                </div>
                <div className="min-w-0">
                    <p className="text-[#3B3F6E] text-[12.5px] font-medium truncate">{adminName}</p>
                    <p className="text-graphite-40 text-[11px] truncate">{user?.email || 'School admin'}</p>
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
