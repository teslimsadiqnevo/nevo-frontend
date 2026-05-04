'use client';

import type { ReactNode } from 'react';
import { StageShell } from '../StageShell';
import { useLessonTts } from '../../api/useLessonTts';
import type { LessonPaceDensity, Stage, ToolbarState } from '../../api/types';

type AudioModeProps = {
    stage: Stage;
    progress: number;
    onBack: () => void;
    onContinue: () => void;
    continueLabel: string;
    askContext?: string | null;
    toolbarState: ToolbarState;
    onToolbarChange: (state: ToolbarState) => void;
    headerAction?: ReactNode;
    paceDensity: LessonPaceDensity;
};

export function AudioMode({
    stage,
    progress,
    onBack,
    onContinue,
    continueLabel,
    askContext,
    toolbarState,
    onToolbarChange,
    headerAction,
    paceDensity,
}: AudioModeProps) {
    const content = stage.modes.audio;
    const label =
        toolbarState === 'simplified'
            ? stage.labelSimplified || stage.label
            : toolbarState === 'expanded'
              ? stage.labelExpanded || stage.label
              : stage.label;
    const body =
        toolbarState === 'simplified'
            ? content.bodySimplified
            : toolbarState === 'expanded'
              ? content.bodyExpanded
              : content.body;
    const isCalmDensity = paceDensity === 'calm';
    const { isLoading, isPlaying, error, togglePlayback, replay } = useLessonTts(body);

    return (
        <StageShell
            pillText={stage.pillText}
            label={label}
            body={
                <div className="flex flex-col">
                    {isCalmDensity ? (
                        <div className="flex flex-col items-center text-center">
                            {body
                                .split('. ')
                                .map((line) => line.trim())
                                .filter(Boolean)
                                .slice(0, 3)
                                .map((line, index) => (
                                    <p key={`${line}:${index}`} className="text-[20px] font-semibold leading-8 text-graphite">
                                        {line.endsWith('.') ? line : `${line}.`}
                                    </p>
                                ))}
                        </div>
                    ) : (
                        <p className="text-[15px] leading-6 text-graphite">{body}</p>
                    )}

                    {error ? (
                        <p className="mt-3 text-[12px] leading-5 text-[#B54708]">{error}</p>
                    ) : null}
                </div>
            }
            progress={progress}
            onBack={onBack}
            onContinue={onContinue}
            continueLabel={continueLabel}
            askContext={askContext}
            toolbarState={toolbarState}
            onToolbarChange={onToolbarChange}
            headerAction={headerAction}
            bodyWidthClassName={isCalmDensity ? 'w-full' : 'max-w-[700px]'}
            media={
                isCalmDensity ? (
                    <div className="flex flex-col items-center">
                        <button
                            type="button"
                            onClick={() => {
                                void togglePlayback();
                            }}
                            className="flex h-12 w-[140px] items-center justify-center rounded-full bg-lavender cursor-pointer border-none"
                        >
                            <div className="flex items-center gap-[4px]">
                                {Array.from({ length: 5 }).map((_, i) => {
                                    const heights = [12, 20, 16, 24, 12];
                                    return (
                                        <span
                                            key={i}
                                            className={`w-px rounded-full ${isPlaying ? 'bg-indigo animate-pulse' : 'bg-indigo/60'}`}
                                            style={{ height: `${heights[i]}px` }}
                                        />
                                    );
                                })}
                            </div>
                        </button>
                        <span className="mt-2 text-[13px] leading-5 text-lavender/50">
                            {isLoading ? 'Generating audio...' : isPlaying ? 'Audio playing' : 'Tap to listen'}
                        </span>
                    </div>
                ) : (
                    <div className="relative w-full rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center justify-center gap-6 px-4 py-3">
                        <button
                            type="button"
                            onClick={() => {
                                void togglePlayback();
                            }}
                            className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo cursor-pointer shrink-0 border-none"
                            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                        >
                            {isPlaying ? (
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <rect x="3" y="2" width="3" height="10" rx="1" fill="#F7F1E6" />
                                    <rect x="8" y="2" width="3" height="10" rx="1" fill="#F7F1E6" />
                                </svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M3 1.5L12 7L3 12.5V1.5Z" fill="#F7F1E6" />
                                </svg>
                            )}
                        </button>

                        <div className="flex-1 h-12 flex items-center justify-center gap-[2px]">
                            {Array.from({ length: toolbarState === 'expanded' ? 60 : 40 }).map((_, i) => {
                                const heights = [12, 24, 18, 32, 22, 36, 28, 16, 30, 20, 26, 14];
                                const h = heights[i % heights.length];
                                return (
                                    <div
                                        key={i}
                                        className={`rounded-full ${isPlaying ? 'bg-indigo' : 'bg-indigo/60'}`}
                                        style={{ width: toolbarState === 'expanded' ? '3px' : '2px', height: `${h}px` }}
                                    />
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                void replay();
                            }}
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-lavender-20 shrink-0 border-none cursor-pointer"
                            aria-label="Replay audio"
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path
                                    d="M5 6.5V11.5H7.5L11 14.5V3.5L7.5 6.5H5Z"
                                    stroke="#3B3F6E"
                                    strokeWidth="1.5"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M13.5 6C14.5 7 14.5 11 13.5 12"
                                    stroke="#3B3F6E"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>
                    </div>
                )
            }
        />
    );
}
