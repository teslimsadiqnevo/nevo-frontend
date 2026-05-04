'use client';

import type { ReactNode } from 'react';
import { StageShell } from '../StageShell';
import type { LessonPaceDensity, Stage, StageKey, ToolbarState } from '../../api/types';

const RELATE_CHIPS = ['Coffee', 'Sink drain', 'Roundabout'];

type VisualModeProps = {
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

export function VisualMode({
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
}: VisualModeProps) {
    const content = stage.modes.visual;
    const stageKey: StageKey = stage.key;
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
    const fallbackPoints = body
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => sentence.trim())
        .filter(Boolean)
        .slice(0, 3);

    return (
        <StageShell
            pillText={stage.pillText}
            label={label}
            body={
                <p className={isCalmDensity ? 'text-[18px] leading-8 text-graphite' : 'text-[15px] leading-6 text-graphite'}>
                    {body}
                </p>
            }
            progress={progress}
            onBack={onBack}
            onContinue={onContinue}
            continueLabel={continueLabel}
            askContext={askContext}
            toolbarState={toolbarState}
            onToolbarChange={onToolbarChange}
            headerAction={headerAction}
            bodyWidthClassName={isCalmDensity ? 'max-w-[680px]' : 'max-w-[700px]'}
            media={
                <div
                    className={[
                        'relative w-full rounded-xl border-2 border-[#E0D9CE] overflow-hidden',
                        content.imageUrl ? 'bg-cover bg-center bg-graphite-10' : 'bg-[linear-gradient(135deg,#f1ece2_0%,#ebe4d7_45%,#e1d8c9_100%)]',
                        isCalmDensity ? 'h-[280px]' : 'h-[280px]',
                    ].join(' ')}
                    style={content.imageUrl ? { backgroundImage: `url(${content.imageUrl})` } : undefined}
                >
                    {!content.imageUrl ? (
                        <div className="absolute inset-0 flex flex-col justify-between p-6">
                            <div className="flex items-center justify-between">
                                <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-indigo">
                                    Visual focus
                                </span>
                                <span className="rounded-full bg-[#3B3F6E] px-3 py-1 text-[11px] font-semibold text-parchment">
                                    {stage.modes.reading.keyTerm}
                                </span>
                            </div>

                            <div className="mx-auto flex w-full max-w-[420px] flex-col gap-3">
                                {fallbackPoints.map((point, index) => (
                                    <div
                                        key={`${point}:${index}`}
                                        className="rounded-2xl bg-white/70 px-4 py-3 text-[13px] leading-5 text-graphite shadow-[0_12px_24px_rgba(59,63,110,0.08)]"
                                    >
                                        {point}
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end">
                                <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-2 text-[12px] text-indigo/80">
                                    Picture-led explanation for this concept
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {content.highlight ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div
                                className="rounded-full"
                                style={{
                                    width: content.highlight.size,
                                    height: content.highlight.size,
                                    background: 'rgba(254, 240, 138, 0.2)',
                                    border: '4px solid rgba(253, 224, 71, 0.6)',
                                }}
                            />
                        </div>
                    ) : null}

                    {content.marker ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative flex flex-col items-center">
                                <div className="absolute -top-16 px-3 py-[6px] bg-white rounded-full shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]">
                                    <span className="text-[11px] font-semibold leading-4 text-indigo whitespace-nowrap">
                                        {content.marker.label}
                                    </span>
                                </div>
                                <div className="w-0.5 h-12 bg-indigo" />
                            </div>
                        </div>
                    ) : null}

                    {stageKey === 'relate' ? (
                        <div className="absolute left-0 right-0 bottom-0 flex justify-center items-center gap-3 pb-6">
                            {RELATE_CHIPS.map((chip) => (
                                <div
                                    key={chip}
                                    className="flex items-center px-6 h-[46px] rounded-xl bg-parchment border border-[rgba(59,63,110,0.1)]"
                                >
                                    <span className="text-[14px] font-medium leading-5 text-indigo">
                                        {chip}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            }
        />
    );
}
