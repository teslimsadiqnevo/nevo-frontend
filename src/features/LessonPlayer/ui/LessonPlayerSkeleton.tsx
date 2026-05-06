'use client';

type LessonPlayerSkeletonProps = {
    pillWidthClassName?: string;
};

export function LessonPlayerSkeleton({
    pillWidthClassName = 'w-20',
}: LessonPlayerSkeletonProps) {
    return (
        <div className="flex min-h-screen justify-center bg-parchment px-0 py-0">
            <div className="mx-auto flex min-h-[900px] w-full max-w-[1024px] flex-col bg-parchment shadow-[0_0_0_1px_rgba(224,217,206,0.4)]">
                <div className="flex min-h-16 items-center justify-between gap-3 px-6 py-2 lg:px-12">
                    <div className="h-11 w-11 rounded-full bg-[#EEE7DB]" />
                    <div className={`h-8 rounded-[20px] bg-[#E8E1D5] ${pillWidthClassName}`} />
                </div>

                <div className="flex flex-1 flex-col px-6 pb-0 pt-6 lg:px-12 lg:pt-8">
                    <div className="h-5 w-52 rounded-lg bg-[#E8E1D5]" />

                    <div className="mt-6 h-[280px] w-full rounded-xl bg-[#E8E1D5]" />

                    <div className="mt-8 max-w-[700px] space-y-4">
                        <div className="h-6 w-[90%] rounded-lg bg-[#EDE5D8]" />
                        <div className="h-6 w-full rounded-lg bg-[#EDE5D8]" />
                        <div className="h-6 w-[82%] rounded-lg bg-[#EDE5D8]" />
                    </div>

                    <div className="mt-auto pt-9">
                        <div className="relative h-1 w-full rounded-full bg-[#E0D9CE]">
                            <div className="absolute left-0 top-0 bottom-0 w-1/5 rounded-full bg-[#C9C1E4]" />
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-3 pb-9 pt-9">
                        <div className="h-9 w-9 rounded-full bg-[#EEE7DB]" />
                        <div className="h-9 w-9 rounded-full bg-[#EEE7DB]" />
                    </div>
                </div>

                <div className="w-full border-t border-[#E0D9CE] bg-parchment px-6 py-[15px] lg:px-12">
                    <div className="grid min-h-[31px] grid-cols-[1fr_auto_1fr] items-center gap-6">
                        <div />
                        <div className="flex items-center justify-center gap-5">
                            <div className="h-8 w-[81px] rounded-full bg-[#EEE7DB]" />
                            <div className="h-8 w-[74px] rounded-full bg-[#EEE7DB]" />
                            <div className="h-8 w-[78px] rounded-full bg-[#EEE7DB]" />
                        </div>
                        <div className="flex justify-end">
                            <div className="h-11 w-[126px] rounded-full bg-[#D8D1EE]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
