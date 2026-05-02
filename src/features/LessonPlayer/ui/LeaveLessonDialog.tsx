'use client';

type LeaveLessonDialogProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

export function LeaveLessonDialog({ open, onClose, onConfirm }: LeaveLessonDialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <button
                type="button"
                aria-label="Close leave lesson dialog"
                onClick={onClose}
                className="absolute inset-0 bg-black/40 cursor-pointer border-none"
            />

            <div className="relative w-full max-w-[400px] rounded-2xl bg-white px-7 pt-7 pb-8 shadow-[0_8px_32px_rgba(0,0,0,0.16)]">
                <h2 className="text-center text-[18px] font-semibold leading-[22px] text-graphite">
                    Leave this lesson?
                </h2>
                <p className="mt-4 text-center text-[14px] leading-[22px] text-graphite-60">
                    Your spot will be saved. You can come back and continue at any time.
                </p>

                <button
                    type="button"
                    onClick={onConfirm}
                    className="mt-6 h-[52px] w-full rounded-xl bg-indigo text-[15px] font-semibold text-parchment cursor-pointer border-none"
                >
                    Keep at it
                </button>

                <button
                    type="button"
                    onClick={onClose}
                    className="mt-4 w-full bg-transparent border-none text-[14px] leading-[21px] text-graphite-60 cursor-pointer"
                >
                    Leave lesson
                </button>
            </div>
        </div>
    );
}
