'use client';

import type { ReactNode } from 'react';
import { StageShell } from '../StageShell';
import type { Stage, ActionStep, LessonPaceDensity, ToolbarState } from '../../api/types';

type ActionModeProps = {
    stage: Stage;
    progress: number;
    onBack: () => void;
    askContext?: string | null;
    toolbarState: ToolbarState;
    onToolbarChange: (state: ToolbarState) => void;
    headerAction?: ReactNode;
    paceDensity: LessonPaceDensity;
};

const STEP_BG = {
    completed: 'bg-[rgba(45,106,79,0.08)]',
    active: 'bg-[rgba(59,63,110,0.06)] border border-[rgba(59,63,110,0.2)]',
    unread: 'bg-parchment border border-[rgba(59,63,110,0.08)]',
} as const;

const STEP_TEXT = {
    completed: 'text-graphite-60 line-through',
    active: 'text-graphite',
    unread: 'text-graphite-40',
} as const;

function StepRow({ index, step }: { index: number; step: ActionStep }) {
    return (
        <div className={`flex items-center gap-3 rounded-lg px-4 py-3 ${STEP_BG[step.state]}`}>
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white shrink-0 text-[12px] font-semibold text-indigo">
                {index + 1}
            </div>
            <div className="flex items-center justify-center w-6 h-6 shrink-0">
                {step.state === 'completed' ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" fill="#2D6A4F" />
                        <path
                            d="M4.5 8L7 10.5L11.5 6"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                ) : (
                    <div className="w-3 h-3 rounded-full border-[1.5px] border-graphite-40" />
                )}
            </div>
            <span className={`flex-1 text-[14px] leading-5 ${STEP_TEXT[step.state]}`}>
                {step.text}
            </span>
            {step.state === 'completed' ? (
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#2D6A4F] shrink-0">
                    Done
                </span>
            ) : null}
        </div>
    );
}

export function ActionMode({
    stage,
    progress,
    onBack,
    askContext,
    toolbarState,
    onToolbarChange,
    headerAction,
    paceDensity: _paceDensity,
}: ActionModeProps) {
    const content = stage.modes.action;
    const steps =
        toolbarState === 'simplified'
            ? content.stepsSimplified
            : toolbarState === 'expanded'
              ? content.stepsExpanded
              : content.steps;
    const label =
        toolbarState === 'simplified'
            ? stage.labelSimplified || stage.label
            : toolbarState === 'expanded'
              ? stage.labelExpanded || stage.label
              : stage.label;
    const activeIndex = steps.findIndex((s) => s.state === 'active');
    const stepNumber = activeIndex >= 0 ? activeIndex + 1 : steps.length;
    const totalSteps = steps.length;

    return (
        <StageShell
            pillText={stage.pillText}
            label={label}
            askContext={askContext}
            body={
                <div className="flex flex-col gap-2">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-lavender">
                        Step {stepNumber} of {totalSteps}
                    </span>
                </div>
            }
            progress={progress}
            onBack={onBack}
            toolbarState={toolbarState}
            onToolbarChange={onToolbarChange}
            headerAction={headerAction}
            media={
                <div className="w-full flex flex-col gap-4 overflow-y-auto">
                    {steps.map((step, idx) => (
                        <StepRow key={idx} index={idx} step={step} />
                    ))}
                </div>
            }
            bodyWidthClassName="w-full"
        />
    );
}
