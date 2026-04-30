'use client';

import { Icon } from "@/shared/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const navItems = [
    { name: 'Dashboard', view: null, icon: '📊' },
    { name: 'Lessons', view: 'lessons', icon: '📄' },
    { name: 'Students', view: 'students', icon: '👥' },
    { name: 'Insights', view: 'insights', icon: '📈' },
    { name: 'Connect', view: 'connect', icon: '💬' },
] as const;

export function TeacherSidebar({ user }: { user?: any }) {
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view') || null;

    return (
        <aside className="w-[200px] min-w-[200px] bg-[#3B3F6E] flex flex-col h-full">
            {/* Logo */}
            <div className="px-6 pt-8 pb-6">
                <div className="flex items-center gap-2">
                    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 4C10 4 6 8 4 12C2 16 4 22 8 26C12 30 20 30 24 26C28 22 30 16 28 12C26 8 22 4 16 4Z" stroke="white" strokeWidth="2" fill="none"/>
                        <path d="M12 14C12 14 14 18 16 18C18 18 20 14 20 14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className="text-white text-xl font-bold tracking-tight">Nevo</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-1 px-3 flex-1">
                {navItems.map((item) => {
                    const isActive = item.view === currentView;
                    const href = item.view ? `/dashboard?view=${item.view}` : '/dashboard';
                    return (
                        <Link
                            key={item.name}
                            href={href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[13px] ${
                                isActive
                                    ? 'bg-white/15 text-white font-semibold'
                                    : 'text-white/70 font-medium hover:bg-white/8 hover:text-white/90'
                            }`}
                        >
                            <SidebarIcon name={item.name} active={isActive} />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Ask Nevo Button */}
            {/* <div className="px-4 pb-4">
                <button className="flex justify-center items-center gap-2 w-full bg-white/15 text-white py-[12px] rounded-[20px] font-semibold text-[13px] hover:bg-white/20 transition-colors cursor-pointer backdrop-blur-sm">
                    <Icon type="galaxy" width={16} height={16} className="invert brightness-200" />
                    <span>Ask Nevo</span>
                </button>
            </div> */}

            {/* User Profile */}
            <div className="px-4 pb-6 pt-2">
                <Link
                    href="/dashboard?view=profile"
                    className="flex items-center gap-3 px-2 py-2 -mx-2 rounded-xl hover:bg-white/8 transition-colors cursor-pointer"
                >
                    <div className="w-8 h-8 rounded-full bg-[#5D6199] overflow-hidden flex items-center justify-center text-white text-xs font-bold uppercase">
                        {user?.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt="Teacher avatar"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : 'MA'
                        )}
                    </div>
                    <span className="text-white/80 text-[13px] font-medium truncate">
                        {user?.name || 'Mrs. Adeyemi'}
                    </span>
                </Link>
            </div>
        </aside>
    );
}

function SidebarIcon({ name, active }: { name: string; active: boolean }) {
    const opacity = active ? 1 : 0.7;
    const color = "white";

    switch (name) {
        case 'Dashboard':
            return (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" opacity={opacity}>
                    <rect x="2" y="2" width="7" height="7" rx="2" stroke={color} strokeWidth="1.5" fill={active ? "white" : "none"} fillOpacity={active ? 0.3 : 0}/>
                    <rect x="11" y="2" width="7" height="7" rx="2" stroke={color} strokeWidth="1.5" fill={active ? "white" : "none"} fillOpacity={active ? 0.3 : 0}/>
                    <rect x="2" y="11" width="7" height="7" rx="2" stroke={color} strokeWidth="1.5" fill={active ? "white" : "none"} fillOpacity={active ? 0.3 : 0}/>
                    <rect x="11" y="11" width="7" height="7" rx="2" stroke={color} strokeWidth="1.5" fill={active ? "white" : "none"} fillOpacity={active ? 0.3 : 0}/>
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
        case 'Students':
            return (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" opacity={opacity}>
                    <circle cx="7" cy="7" r="3" stroke={color} strokeWidth="1.5"/>
                    <path d="M2 17C2 14.2386 4.23858 12 7 12C9.76142 12 12 14.2386 12 17" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="14" cy="8" r="2.5" stroke={color} strokeWidth="1.5"/>
                    <path d="M13 17C13 14.7909 14.7909 13 17 13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
            );
        case 'Insights':
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
        default:
            return null;
    }
}
