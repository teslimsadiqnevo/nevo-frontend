'use client';

import { useState } from 'react';
import { AskNevoDrawer } from '@/widgets/AskNevoDrawer';

type AskNevoButtonProps = {
    context?: string | null;
};

export function AskNevoButton({ context }: AskNevoButtonProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-5 h-11 rounded-full bg-indigo text-parchment font-semibold text-[14px] shadow-[0_4px_16px_rgba(59,63,110,0.25)] cursor-pointer border-none"
            >
                <span className="text-[16px] leading-none">+</span>
                <span>Ask Nevo</span>
            </button>
            <AskNevoDrawer open={open} onClose={() => setOpen(false)} context={context} />
        </>
    );
}
