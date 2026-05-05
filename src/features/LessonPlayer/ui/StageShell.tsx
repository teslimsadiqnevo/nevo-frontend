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
    askContext?: string | null;
    toolbarState: ToolbarState;
    onToolbarChange: (state: ToolbarState) => void;
    headerAction?: ReactNode;
    bodyWidthClassName?: string;
    continueLabel?: string;
    onContinue?: () => void;
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
    askContext,
    toolbarState,
    onToolbarChange,
    headerAction,
    bodyWidthClassName = 'max-w-[700px]',
    continueLabel,
    onContinue,
}: StageShellProps) {
    return (
        <div className="mx-auto flex min-h-screen w-full max-w-[1024px] flex-col bg-parchment shadow-[0_0_0_1px_rgba(224,217,206,0.4)] sm:min-h-[900px]">
            <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-12">
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

            <div className="flex flex-1 flex-col px-4 pb-6 pt-6 sm:px-6 sm:pt-8 lg:px-12">
                <h2 className="text-[13px] font-semibold leading-5 tracking-[0.325px] uppercase text-lavender">
                    {label}
                </h2>

                {meta ? <div className="mt-4">{meta}</div> : null}

                {media ? <div className="mt-6">{media}</div> : null}

                <div className={`mt-6 w-full ${bodyWidthClassName}`}>
                    {body}
                </div>

                <div className="mt-auto pt-8 sm:pt-12">
                    <div className="relative w-full h-1 rounded-full bg-[#E0D9CE]">
                        <div
                            className="absolute left-0 top-0 bottom-0 bg-indigo rounded-full"
                            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="w-full min-h-[78px] border-t border-[#E0D9CE] bg-parchment px-4 py-4 sm:px-6 lg:px-10">
                <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                    <div className="flex items-center justify-center lg:justify-start">
                        {onContinue && continueLabel ? (
                            <button
                                type="button"
                                onClick={onContinue}
                                className="flex min-h-11 w-full items-center justify-center rounded-full border-none bg-indigo px-6 py-3 text-center text-[14px] font-semibold text-parchment shadow-[0_12px_24px_rgba(59,63,110,0.18)] cursor-pointer sm:w-auto"
                            >
                                {continueLabel}
                            </button>
                        ) : null}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
                    {TOOLBAR_BUTTONS.map((button) => {
                        const isActive = toolbarState === button.state;
                        return (
                            <button
                                key={button.state}
                                type="button"
                                onClick={() => onToolbarChange(button.state)}
                                className={[
                                    'flex justify-center items-center px-4 h-8 rounded-full border text-[13px] font-normal leading-5 cursor-pointer transition-colors',
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

                    <div className="flex justify-center lg:justify-end">
                        <AskNevoButton context={askContext} />
                    </div>
                </div>
            </div>
        </div>
    );
}
