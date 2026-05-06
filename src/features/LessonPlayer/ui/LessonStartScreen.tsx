'use client';

import { type ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardPath } from '@/shared/lib';
import type { LessonPlayerData, LessonModeCard } from '../api/types';
import { STAGE_ORDER } from '../api/types';
import { LeaveLessonDialog } from './LeaveLessonDialog';

type LessonStartScreenProps = {
    lessonId: string;
    data: LessonPlayerData;
};

function StartCardIcon({ card }: { card: LessonModeCard }) {
    if (card.kind === 'image') {
        return card.imageUrl ? (
            <div
                className="w-12 h-12 rounded-lg bg-cover bg-center shrink-0"
                style={{ backgroundImage: `url(${card.imageUrl})` }}
            />
        ) : (
            <div className="w-12 h-12 rounded-lg shrink-0 bg-[linear-gradient(135deg,#467a19_0%,#91b825_35%,#d3dd3d_70%,#9bbd18_100%)]" />
        );
    }

    return (
        <div className="w-12 h-12 rounded-lg shrink-0 bg-lavender-10 flex items-center justify-center">
            {card.kind === 'audio' ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 9.5V14.5H8.5L13 18V6L8.5 9.5H5Z" fill="#9A9CCB" />
                    <path d="M16 9C17.3333 10 17.3333 14 16 15" stroke="#9A9CCB" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M18.5 7C20.8333 8.75 20.8333 15.25 18.5 17" stroke="#9A9CCB" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            ) : null}
            {card.kind === 'action' ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L18 8L14.5 11.5L17 14L14 17L11.5 14.5L8 18L2 12L12 2Z" fill="#9A9CCB" />
                </svg>
            ) : null}
            {card.kind === 'reading' ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M6 4.5C6 3.67157 6.67157 3 7.5 3H18V19.5H7.5C6.67157 19.5 6 20.1716 6 21V4.5Z" fill="#9A9CCB" />
                    <path d="M8.5 7.5H15.5" stroke="#F7F1E6" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M8.5 11H15.5" stroke="#F7F1E6" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            ) : null}
        </div>
    );
}

function MetaItem({
    icon,
    label,
    active = false,
}: {
    icon: ReactNode;
    label: string;
    active?: boolean;
}) {
    return (
        <div className="flex items-center gap-2">
            <span className={active ? 'text-lavender' : 'text-indigo/60'}>{icon}</span>
            <span className={active ? 'text-[13px] leading-5 text-lavender' : 'text-[13px] leading-5 text-graphite-60'}>
                {label}
            </span>
        </div>
    );
}

export function LessonStartScreen({ lessonId, data }: LessonStartScreenProps) {
    const router = useRouter();
    const [showLeaveDialog, setShowLeaveDialog] = useState(false);

    const activeMode = data.recommendedMode;
    const activeCard = data.start.cards[activeMode];

    const beginLesson = () => {
        router.push(`/lesson/${lessonId}/${STAGE_ORDER[0]}`);
    };

    const leaveLesson = () => {
        setShowLeaveDialog(false);
        router.push(getDashboardPath('student', 'lessons'));
    };

    return (
        <>
            <div className="flex min-h-screen justify-center bg-white px-0 py-0 sm:px-4 sm:py-6 lg:px-6 lg:py-10">
                <div className="relative flex min-h-screen w-full max-w-[1024px] items-center justify-center bg-parchment shadow-[0_0_0_1px_rgba(224,217,206,0.4)] sm:min-h-[900px]">
                    <button
                        type="button"
                        onClick={() => setShowLeaveDialog(true)}
                        className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center border-none bg-transparent cursor-pointer sm:left-5 sm:top-5"
                        aria-label="Leave lesson"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M15 5L8 12L15 19"
                                stroke="#3B3F6E"
                                strokeWidth="2.25"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>

                    <div className="w-full max-w-[597px] px-4 text-center sm:px-8">
                        <div className="inline-flex h-8 items-center rounded-2xl bg-lavender-20 px-4">
                            <span className="text-[12px] font-medium leading-4 text-indigo">{data.start.eyebrow}</span>
                        </div>

                        <h1 className="mt-4 text-[24px] font-bold leading-8 text-indigo">{data.start.title}</h1>
                        <p className="mt-3 text-[14px] leading-5 text-graphite-60">{data.start.subtitle}</p>

                        <div className="mt-8 flex flex-col items-center gap-2">
                            <MetaItem
                                icon={
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <circle cx="8" cy="8" r="5.5" stroke="currentColor" />
                                        <path d="M8 5V8.5L10.25 9.75" stroke="currentColor" strokeLinecap="round" />
                                    </svg>
                                }
                                label={data.start.durationLabel}
                            />
                            <MetaItem
                                icon={
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M4 3.5H12" stroke="currentColor" strokeLinecap="round" />
                                        <path d="M4 6.5H12" stroke="currentColor" strokeLinecap="round" />
                                        <path d="M4 9.5H9.5" stroke="currentColor" strokeLinecap="round" />
                                    </svg>
                                }
                                label={data.start.conceptsLabel}
                            />
                            <MetaItem
                                icon={
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M3 12.5V3.5L7.5 7.5L13 3.5V12.5H3Z" fill="currentColor" />
                                    </svg>
                                }
                                label={data.start.modeLabel}
                                active
                            />
                        </div>

                        <div className="mx-auto mt-8 flex w-full max-w-[280px] items-center gap-3 rounded-xl border border-[#E0D9CE] bg-white p-4 text-left">
                            <StartCardIcon card={activeCard} />
                            <div>
                                <p className="text-[13px] leading-[18px] text-graphite-70">{activeCard.detail}</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={beginLesson}
                            className="mx-auto mt-10 flex h-14 w-full max-w-[280px] items-center justify-center rounded-xl border-none bg-indigo text-[16px] font-semibold text-parchment cursor-pointer"
                        >
                            {data.start.primaryCta}
                        </button>

                        <button
                            type="button"
                            onClick={beginLesson}
                            className="mx-auto mt-3 flex items-center gap-1 bg-transparent border-none text-[12px] leading-4 text-indigo/50 cursor-pointer"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <circle cx="7" cy="7" r="5.75" stroke="currentColor" strokeWidth="0.875" />
                                <path d="M7 4.25V7L8.75 8.25" stroke="currentColor" strokeWidth="0.875" strokeLinecap="round" />
                            </svg>
                            <span>{data.start.secondaryCta}</span>
                        </button>
                    </div>
                </div>
            </div>

            <LeaveLessonDialog open={showLeaveDialog} onClose={leaveLesson} onConfirm={() => setShowLeaveDialog(false)} />
        </>
    );
}
