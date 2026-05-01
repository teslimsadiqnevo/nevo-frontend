'use client';

type PaceChoice = 'slower' | 'steady' | 'faster';

type PaceAdjustmentOverlayProps = {
    selection: PaceChoice;
    onSelectionChange: (selection: PaceChoice) => void;
    onApply: () => void;
    onClose: () => void;
};

const OPTIONS: Array<{
    id: PaceChoice;
    label: string;
    icon: 'playback' | 'pause' | 'fast';
}> = [
    { id: 'slower', label: 'Slower', icon: 'playback' },
    { id: 'steady', label: 'This is fine', icon: 'pause' },
    { id: 'faster', label: 'Speed up', icon: 'fast' },
];

function OptionIcon({ icon, active }: { icon: 'playback' | 'pause' | 'fast'; active: boolean }) {
    const stroke = active ? '#F7F1E6' : '#2B2B2F';

    if (icon === 'pause') {
        return (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="4" y="3" width="2" height="10" rx="1" fill={stroke} />
                <rect x="10" y="3" width="2" height="10" rx="1" fill={stroke} />
            </svg>
        );
    }

    if (icon === 'fast') {
        return (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 4.5L8 8L3 11.5V4.5Z" fill={stroke} />
                <path d="M8 4.5L13 8L8 11.5V4.5Z" fill={stroke} />
            </svg>
        );
    }

    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M11.5 3.5L6.5 8L11.5 12.5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 3.5L3 8L8 12.5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function PaceAdjustmentOverlay({
    selection,
    onSelectionChange,
    onApply,
    onClose,
}: PaceAdjustmentOverlayProps) {
    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />

            <div className="absolute bottom-0 left-0 right-0 rounded-t-[20px] bg-parchment px-6 pb-8 pt-3">
                <div className="mx-auto flex max-w-[976px] flex-col items-center gap-2">
                    <div className="h-1 w-8 rounded-full bg-indigo/20" />

                    <div className="mt-3 flex h-8 w-8 items-center justify-center rounded-full bg-lavender-10">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <circle cx="9" cy="9" r="5.5" stroke="#9A9CCB" strokeWidth="1.125" />
                            <path d="M9 6.5V9.25L11 10.5" stroke="#9A9CCB" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    <h2 className="pt-1 text-[17px] font-semibold leading-[26px] text-indigo">Adjusting your pace?</h2>
                    <p className="text-center text-[14px] leading-[21px] text-graphite/65">
                        We can slow this lesson down, keep the current rhythm, or make it more compact.
                    </p>

                    <div className="mt-3 grid w-full grid-cols-3 gap-0 overflow-hidden rounded-xl">
                        {OPTIONS.map((option) => {
                            const active = selection === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => onSelectionChange(option.id)}
                                    className={[
                                        'flex h-[68px] flex-col items-center justify-center gap-1.5 border text-[14px] leading-5 cursor-pointer',
                                        active
                                            ? 'border-indigo bg-indigo text-parchment'
                                            : 'border-[rgba(59,63,110,0.4)] bg-parchment text-graphite',
                                    ].join(' ')}
                                >
                                    <OptionIcon icon={option.icon} active={active} />
                                    <span>{option.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={onApply}
                        className="mt-3 flex h-12 w-full items-center justify-center rounded-xl border-none bg-indigo text-[15px] font-semibold leading-[22px] text-parchment cursor-pointer"
                    >
                        Apply
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="border-none bg-transparent text-[13px] leading-5 text-indigo/55 cursor-pointer"
                    >
                        Keep current pace
                    </button>
                </div>
            </div>
        </div>
    );
}
