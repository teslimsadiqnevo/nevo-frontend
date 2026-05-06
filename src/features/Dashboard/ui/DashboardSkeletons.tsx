import type { ReactNode } from 'react';

function SkeletonBlock({
    className,
}: {
    className: string;
}) {
    return <div className={`animate-pulse rounded-[14px] bg-[#EAE1D3] ${className}`} />;
}

export function DashboardViewSkeleton({
    titleWidth = 'w-44',
    showToolbar = true,
    cardCount = 3,
    rowCount = 4,
}: {
    titleWidth?: string;
    showToolbar?: boolean;
    cardCount?: number;
    rowCount?: number;
}) {
    return (
        <div className="mx-auto flex w-full max-w-[1136px] flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-3">
                    <SkeletonBlock className={`h-8 ${titleWidth}`} />
                    <SkeletonBlock className="h-4 w-56" />
                </div>
                {showToolbar ? <SkeletonBlock className="h-11 w-36 rounded-[12px]" /> : null}
            </div>

            {cardCount > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: cardCount }).map((_, index) => (
                        <div
                            key={index}
                            className="rounded-[16px] border border-[#E0D9CE] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                        >
                            <SkeletonBlock className="mb-4 h-5 w-32" />
                            <SkeletonBlock className="mb-2 h-10 w-20" />
                            <SkeletonBlock className="h-4 w-40" />
                        </div>
                    ))}
                </div>
            ) : null}

            <div className="overflow-hidden rounded-[16px] border border-[#E0D9CE] bg-white">
                <div className="border-b border-[#E8E0D2] px-5 py-4">
                    <SkeletonBlock className="h-4 w-36" />
                </div>
                <div className="flex flex-col">
                    {Array.from({ length: rowCount }).map((_, index) => (
                        <div
                            key={index}
                            className={`grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_140px] items-center gap-4 px-5 py-4 ${
                                index < rowCount - 1 ? 'border-b border-[#E8E0D2]' : ''
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <SkeletonBlock className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                    <SkeletonBlock className="h-4 w-40" />
                                    <SkeletonBlock className="h-3 w-28" />
                                </div>
                            </div>
                            <SkeletonBlock className="h-4 w-32" />
                            <SkeletonBlock className="h-9 w-24 rounded-[10px]" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function TeacherDashboardOverviewSkeleton() {
    return (
        <div className="w-full max-w-[740px] animate-pulse">
            <div className="mb-8 space-y-3">
                <SkeletonBlock className="h-10 w-72" />
                <SkeletonBlock className="h-4 w-64" />
            </div>

            <section className="mb-8">
                <SkeletonBlock className="mb-4 h-5 w-28" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="rounded-2xl border border-[#E9E7E2] bg-transparent px-6 py-5">
                            <SkeletonBlock className="mb-3 h-10 w-16" />
                            <SkeletonBlock className="h-4 w-full max-w-[170px]" />
                        </div>
                    ))}
                </div>
            </section>

            <section className="mb-8">
                <SkeletonBlock className="mb-4 h-5 w-28" />
                <div className="flex flex-col gap-4 md:flex-row">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <SkeletonBlock key={index} className="h-12 flex-1 rounded-full" />
                    ))}
                </div>
            </section>

            <section>
                <SkeletonBlock className="mb-4 h-5 w-32" />
                <div className="overflow-hidden rounded-2xl border border-[#E9E7E2] bg-white">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className={`px-6 py-4 ${index < 3 ? 'border-b border-[#EEECEA]' : ''}`}
                        >
                            <SkeletonBlock className="mb-2 h-4 w-3/4" />
                            <SkeletonBlock className="h-3 w-28" />
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

export function SchoolDashboardOverviewSkeleton() {
    return (
        <div className="mx-auto flex w-full max-w-[1136px] flex-col gap-6 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="space-y-3">
                    <SkeletonBlock className="h-8 w-36" />
                    <SkeletonBlock className="h-4 w-48" />
                </div>
                <SkeletonBlock className="h-11 w-32 rounded-full" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="rounded-[12px] border border-[#E0D9CE] bg-white p-5">
                        <SkeletonBlock className="mb-4 h-4 w-32" />
                        <SkeletonBlock className="mb-3 h-10 w-20" />
                        <SkeletonBlock className="h-3 w-28" />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
                <div className="rounded-[12px] border border-[#E0D9CE] bg-white p-6 xl:col-span-3">
                    <SkeletonBlock className="mb-6 h-5 w-40" />
                    <SkeletonBlock className="h-[220px] w-full rounded-[18px]" />
                </div>
                <div className="rounded-[12px] border border-[#E0D9CE] bg-white p-6 xl:col-span-2">
                    <SkeletonBlock className="mb-6 h-5 w-40" />
                    <div className="space-y-5">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="space-y-2">
                                <SkeletonBlock className="h-4 w-28" />
                                <SkeletonBlock className="h-2 w-full rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="rounded-[12px] border border-[#E0D9CE] bg-white p-6">
                        <SkeletonBlock className="mb-5 h-5 w-44" />
                        <div className="space-y-4">
                            {Array.from({ length: 4 }).map((__, rowIndex) => (
                                <div key={rowIndex} className="space-y-2">
                                    <SkeletonBlock className="h-4 w-2/3" />
                                    <SkeletonBlock className="h-3 w-1/3" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function DetailViewSkeleton({
    backLabel,
    headerStats = 4,
    children,
}: {
    backLabel: string;
    headerStats?: number;
    children?: ReactNode;
}) {
    return (
        <div className="mx-auto flex w-full max-w-[1136px] flex-col gap-5 animate-pulse">
            <div className="flex items-center gap-2 text-[13px] font-medium text-[#3B3F6E]">
                <SkeletonBlock className="h-4 w-24" />
                <span className="sr-only">{backLabel}</span>
            </div>

            <div className="space-y-3">
                <SkeletonBlock className="h-8 w-56" />
                <SkeletonBlock className="h-4 w-64" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: headerStats }).map((_, index) => (
                    <div key={index} className="rounded-[16px] border border-[#E0D9CE] bg-white p-5">
                        <SkeletonBlock className="mb-3 h-4 w-28" />
                        <SkeletonBlock className="h-8 w-20" />
                    </div>
                ))}
            </div>

            {children ?? <SkeletonBlock className="h-[260px] w-full rounded-[20px]" />}
        </div>
    );
}

export function ModalFormSkeleton() {
    return (
        <div className="animate-pulse space-y-5">
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                    <SkeletonBlock className="h-4 w-28" />
                    <SkeletonBlock className="h-[52px] w-full rounded-[12px]" />
                </div>
            ))}
            <div className="space-y-2">
                <SkeletonBlock className="h-4 w-36" />
                <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <SkeletonBlock key={index} className="h-9 w-24 rounded-full" />
                    ))}
                </div>
            </div>
            <SkeletonBlock className="h-[56px] w-full rounded-[12px]" />
        </div>
    );
}
