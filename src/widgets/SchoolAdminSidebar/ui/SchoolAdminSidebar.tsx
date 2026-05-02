'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSchoolSettings } from "@/features/Dashboard/api/school";
import { getInitials } from "@/shared/lib";
import { NevoLogo } from "@/shared/ui";

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
    const [schoolName, setSchoolName] = useState('Lagos International Academy');

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
        <aside className="w-[240px] min-w-[240px] h-full bg-[#FCFCFC] border-r border-[#E0D9CE] flex flex-col">
            <div className="px-6 pt-6 pb-8">
                <NevoLogo className="h-8 w-auto" width={172} height={32} />
                <p className="mt-3 max-w-[170px] text-[14px] font-semibold leading-[20px] text-[#3B3F6E]">
                    {schoolName}
                </p>
            </div>

            <nav className="flex-1 px-0">
                <div className="flex flex-col gap-1">
                    {navItems.map((item) => {
                        const isActive = item.view === currentView || (!item.view && !currentView);

                        return (
                            <Link
                                key={item.name}
                                href={buildHref(item.view)}
                                className={`group relative flex h-12 items-center gap-3 px-4 text-[15px] font-medium transition-colors ${
                                    isActive
                                        ? 'bg-[rgba(59,63,110,0.08)] text-[#3B3F6E]'
                                        : 'text-[#2B2B2F] hover:bg-[rgba(59,63,110,0.04)]'
                                }`}
                            >
                                {isActive ? <span className="absolute left-0 top-0 h-12 w-[3px] bg-[#3B3F6E]" /> : null}
                                <SidebarIcon name={item.name} active={isActive} />
                                <span className={isActive ? 'font-medium' : 'opacity-80'}>{item.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <div className="mt-auto border-t border-[#E0D9CE] px-4 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(59,63,110,0.15)] text-[13px] font-semibold uppercase text-[#3B3F6E]">
                        {getInitials(adminName)}
                    </div>
                    <p className="min-w-0 flex-1 truncate text-[13px] font-normal text-[#2B2B2F]">
                        {adminName}
                    </p>
                    <div className="opacity-40">
                        <SidebarIcon name="Settings" active={false} small />
                    </div>
                </div>
            </div>
        </aside>
    );
}

function SidebarIcon({ name, active, small = false }: { name: string; active: boolean; small?: boolean }) {
    const size = small ? 16 : 20;
    const color = active ? '#3B3F6E' : '#2B2B2F';
    const opacity = active ? 1 : 0.72;

    switch (name) {
        case 'Overview':
            return (
                <svg width={size} height={size} viewBox="0 0 20 20" fill="none" opacity={opacity}>
                    <rect x="2.5" y="2.5" width="5.5" height="5.5" rx="1" stroke={color} strokeWidth="1.25" />
                    <rect x="12" y="2.5" width="5.5" height="5.5" rx="1" stroke={color} strokeWidth="1.25" />
                    <rect x="2.5" y="12" width="5.5" height="5.5" rx="1" stroke={color} strokeWidth="1.25" />
                    <rect x="12" y="12" width="5.5" height="5.5" rx="1" stroke={color} strokeWidth="1.25" />
                </svg>
            );
        case 'Classes':
            return (
                <svg width={size} height={size} viewBox="0 0 20 20" fill="none" opacity={opacity}>
                    <path d="M3.75 6.25H16.25V15.25C16.25 16.0784 15.5784 16.75 14.75 16.75H5.25C4.42157 16.75 3.75 16.0784 3.75 15.25V6.25Z" stroke={color} strokeWidth="1.25" />
                    <path d="M6 4.25V6.25H14V4.25" stroke={color} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );
        case 'Teachers':
            return (
                <svg width={size} height={size} viewBox="0 0 20 20" fill="none" opacity={opacity}>
                    <path d="M10 2.75L12.163 7.13L17 7.833L13.5 11.244L14.326 16.083L10 13.808L5.674 16.083L6.5 11.244L3 7.833L7.837 7.13L10 2.75Z" stroke={color} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );
        case 'Students':
            return (
                <svg width={size} height={size} viewBox="0 0 20 20" fill="none" opacity={opacity}>
                    <circle cx="7.25" cy="7" r="2.5" stroke={color} strokeWidth="1.25" />
                    <path d="M2.75 15.75C2.75 13.4028 4.65279 11.5 7 11.5H7.5C9.84721 11.5 11.75 13.4028 11.75 15.75" stroke={color} strokeWidth="1.25" strokeLinecap="round" />
                    <circle cx="14.25" cy="8" r="2" stroke={color} strokeWidth="1.25" />
                    <path d="M13 15.5C13.3918 14.0372 14.5654 13 16 13" stroke={color} strokeWidth="1.25" strokeLinecap="round" />
                </svg>
            );
        case 'Reports':
            return (
                <svg width={size} height={size} viewBox="0 0 20 20" fill="none" opacity={opacity}>
                    <path d="M6 2.75H11.75L15.5 6.5V16C15.5 16.6904 14.9404 17.25 14.25 17.25H6C5.30964 17.25 4.75 16.6904 4.75 16V4C4.75 3.30964 5.30964 2.75 6 2.75Z" stroke={color} strokeWidth="1.25" />
                    <path d="M11.75 2.75V6.5H15.5" stroke={color} strokeWidth="1.25" strokeLinejoin="round" />
                    <path d="M7.5 10H12.5M7.5 13H11" stroke={color} strokeWidth="1.25" strokeLinecap="round" />
                </svg>
            );
        case 'Settings':
            return (
                <svg width={size} height={size} viewBox="0 0 20 20" fill="none" opacity={opacity}>
                    <circle cx="10" cy="10" r="2.75" stroke={color} strokeWidth="1.25" />
                    <path d="M10 3V4.5M10 15.5V17M17 10H15.5M4.5 10H3M14.95 5.05L13.9 6.1M6.1 13.9L5.05 14.95M14.95 14.95L13.9 13.9M6.1 6.1L5.05 5.05" stroke={color} strokeWidth="1.25" strokeLinecap="round" />
                </svg>
            );
        default:
            return null;
    }
}
