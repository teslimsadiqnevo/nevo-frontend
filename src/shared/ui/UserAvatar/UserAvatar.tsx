'use client';

import { useEffect, useState } from 'react';
import { getInitials } from '@/shared/lib';

type UserAvatarProps = {
    name?: string | null;
    avatarUrl?: string | null;
    size?: number;
    className?: string;
    /** Fallback bg used behind initials. */
    bg?: string;
    /** Fallback text color used for initials. */
    fg?: string;
    fontClassName?: string;
};

function isUsableUrl(url?: string | null): url is string {
    if (!url) return false;
    if (typeof url !== 'string') return false;
    if (url.startsWith('blob:')) return false;
    return true;
}

export function UserAvatar({
    name,
    avatarUrl,
    size = 32,
    className = '',
    bg = '#5D6199',
    fg = '#FFFFFF',
    fontClassName = 'text-xs font-bold',
}: UserAvatarProps) {
    const [broken, setBroken] = useState(false);

    useEffect(() => {
        setBroken(false);
    }, [avatarUrl]);

    const showImage = isUsableUrl(avatarUrl) && !broken;
    const initials = getInitials(name);

    return (
        <div
            className={`rounded-full overflow-hidden flex items-center justify-center uppercase shrink-0 ${className}`}
            style={{ width: size, height: size, background: bg, color: fg }}
        >
            {showImage ? (
                <img
                    src={avatarUrl as string}
                    alt={name ? `${name} avatar` : 'Avatar'}
                    className="w-full h-full object-cover"
                    onError={() => setBroken(true)}
                />
            ) : (
                <span className={fontClassName}>{initials}</span>
            )}
        </div>
    );
}
