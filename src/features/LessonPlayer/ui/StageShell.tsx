'use client';

import { ReactNode } from 'react';
import type { ToolbarState } from '../api/types';
import { AskNevoButton } from './AskNevoButton';

type StageShellProps = {
    pillText: string;
    label: string;
    body: ReactNode;
    media?: ReactNode;
    meta?: ReactNode;
    progress: number;
    onBack: () => void;
    canGoBack?: boolean;
    askContext?: string | null;
    toolbarState: ToolbarState;
    onToolbarChange: (state: ToolbarState) => void;
    headerAction?: ReactNode;
    bodyWidthClassName?: string;
    continueLabel?: string;
    onContinue?: () => void;
    canGoForward?: boolean;
};

const TOOLBAR_BUTTONS: Array<{ label: string; state: ToolbarState }> = [
    { label: 'Simplify', state: 'simplified' },
    { label: 'Slower', state: 'slower' },
    { label: 'Expand', state: 'expanded' },
];

export function StageShell({
    pillText,
    label,
    body,
    media,
    meta,
    progress,
    onBack,
    canGoBack = true,
    askContext,
    toolbarState,
    onToolbarChange,
    headerAction,
    bodyWidthClassName = 'max-w-[700px]',
    continueLabel,
    onContinue,
    canGoForward = true,
}: StageShellProps) {
    const showStageNavigation = Boolean(continueLabel && onContinue);
    const backIsDisabled = !canGoBack;
    const forwardIsDisabled = !showStageNavigation || !canGoForward;

    return (
        <div className="relative mx-auto flex h-[900px] min-h-[900px] w-full max-w-[1024px] flex-col overflow-hidden bg-parchment shadow-[0_0_0_1px_rgba(224,217,206,0.4)]">
            <div className="flex min-h-16 items-center justify-between gap-3 px-6 py-2 lg:px-12">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center justify-center w-11 h-11 cursor-pointer bg-transparent border-none"
                    aria-label="Back"
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

                <div className="flex items-center gap-2 sm:gap-3">
                    {headerAction}
                    <div className="rounded-[20px] bg-lavender-20 px-3 py-2 sm:px-4">
                        <span className="text-[12px] font-medium leading-4 text-indigo">{pillText}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 flex-col px-6 pb-[133px] pt-6 lg:px-12 lg:pt-8">
                <h2 className="text-[13px] font-semibold leading-5 tracking-[0.325px] uppercase text-lavender">
                    {label}
                </h2>

                {meta ? <div className="mt-4">{meta}</div> : null}

                {media ? <div className="mt-6">{media}</div> : null}

                <div className={`mt-6 w-full ${bodyWidthClassName}`}>
                    {body}
                </div>

                <div className="mt-auto pt-9">
                    <div className="relative w-full h-1 rounded-full bg-[#E0D9CE]">
                        <div
                            className="absolute left-0 top-0 bottom-0 bg-indigo rounded-full"
                            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-center gap-3 pb-9 pt-9">
                    <button
                        type="button"
                        onClick={onBack}
                        disabled={backIsDisabled}
                        aria-label="Previous step"
                        className={[
                            'flex h-9 w-9 items-center justify-center rounded-full border-none bg-transparent transition-opacity',
                            backIsDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer opacity-100',
                        ].join(' ')}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                                d="M15 5L8 12L15 19"
                                stroke="#3B3F6E"
                                strokeWidth="2.25"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>

                    <button
                        type="button"
                        onClick={onContinue}
                        disabled={forwardIsDisabled}
                        aria-label={continueLabel ?? 'Next step'}
                        className={[
                            'flex h-9 w-9 items-center justify-center rounded-full border-none bg-transparent transition-opacity',
                            forwardIsDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer opacity-100',
                        ].join(' ')}
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                            className="rotate-180"
                        >
                            <path
                                d="M15 5L8 12L15 19"
                                stroke="#3B3F6E"
                                strokeWidth="2.25"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 w-full border-t border-[#E0D9CE] bg-parchment px-6 py-[15px] lg:px-12">
                <div className="grid min-h-[31px] grid-cols-[1fr_auto_1fr] items-center gap-6">
                    <div />

                    <div className="flex min-w-0 items-center justify-center gap-5">
                        {TOOLBAR_BUTTONS.map((button) => {
                            const isActive = toolbarState === button.state;
                            return (
                                <button
                                    key={button.state}
                                    type="button"
                                    onClick={() => onToolbarChange(button.state)}
                                    className={[
                                        'flex h-8 shrink-0 items-center justify-center rounded-full border px-4 text-[13px] font-normal leading-5 cursor-pointer transition-colors',
                                        isActive
                                            ? 'bg-indigo border-indigo text-parchment'
                                            : 'bg-transparent border-indigo text-indigo',
                                    ].join(' ')}
                                >
                                    {button.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex shrink-0 justify-end">
                        <AskNevoButton context={askContext} />
                    </div>
                </div>
            </div>
        </div>
    );
}
