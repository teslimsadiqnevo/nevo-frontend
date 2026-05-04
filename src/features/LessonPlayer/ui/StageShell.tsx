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
        <div className="flex flex-col w-[1024px] min-h-[900px] bg-parchment mx-auto shadow-[0_0_0_1px_rgba(224,217,206,0.4)]">
            <div className="flex items-center justify-between h-16 px-12">
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

                <div className="flex items-center gap-3">
                    {headerAction}
                    <div className="px-4 py-2 rounded-[20px] bg-lavender-20">
                        <span className="text-[12px] font-medium leading-4 text-indigo">{pillText}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 px-12 pt-[31px] pb-6 flex flex-col">
                <h2 className="text-[13px] font-semibold leading-5 tracking-[0.325px] uppercase text-lavender">
                    {label}
                </h2>

                {meta ? <div className="mt-4">{meta}</div> : null}

                {media ? <div className="mt-6">{media}</div> : null}

                <div className={`mt-6 ${bodyWidthClassName}`}>
                    {body}
                </div>

                <div className="mt-auto pt-12">
                    <div className="relative w-full h-1 rounded-full bg-[#E0D9CE]">
                        <div
                            className="absolute left-0 top-0 bottom-0 bg-indigo rounded-full"
                            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="w-full min-h-[78px] bg-parchment border-t border-[#E0D9CE] px-10 py-4">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                    <div className="flex items-center">
                        {onContinue && continueLabel ? (
                            <button
                                type="button"
                                onClick={onContinue}
                                className="flex h-11 items-center justify-center rounded-full bg-indigo px-6 text-[14px] font-semibold text-parchment cursor-pointer border-none shadow-[0_12px_24px_rgba(59,63,110,0.18)]"
                            >
                                {continueLabel}
                            </button>
                        ) : null}
                    </div>

                    <div className="flex items-center justify-center gap-5">
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

                    <div className="flex justify-end">
                        <AskNevoButton context={askContext} />
                    </div>
                </div>
            </div>
        </div>
    );
}
