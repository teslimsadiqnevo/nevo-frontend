'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useLessonTts } from '../../api/useLessonTts';
import { StageShell } from '../StageShell';
import type { Stage, ActionStep, LessonPaceDensity, ToolbarState } from '../../api/types';

type ActionModeProps = {
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
    onContinue,
    continueLabel,
    askContext,
    toolbarState,
    onToolbarChange,
    headerAction,
}: ActionModeProps) {
    const content = stage.modes.action;
    const steps =
        toolbarState === 'simplified'
            ? content.stepsSimplified
            : toolbarState === 'expanded'
              ? content.stepsExpanded
              : content.steps;
    const baseActiveIndex = Math.max(0, steps.findIndex((s) => s.state === 'active'));
    const stepScopeKey = `${stage.key}:${toolbarState}:${steps.length}`;
    const [stepSession, setStepSession] = useState({
        scopeKey: stepScopeKey,
        index: baseActiveIndex >= 0 ? baseActiveIndex : 0,
    });
    const label =
        toolbarState === 'simplified'
            ? stage.labelSimplified || stage.label
            : toolbarState === 'expanded'
              ? stage.labelExpanded || stage.label
              : stage.label;
    const totalSteps = steps.length;

    const currentStepIndex =
        stepSession.scopeKey === stepScopeKey
            ? stepSession.index
            : baseActiveIndex >= 0
                ? baseActiveIndex
                : 0;

    const hydratedSteps = useMemo<ActionStep[]>(() => (
        steps.map((step, index) => ({
            ...step,
            state:
                index < currentStepIndex
                    ? 'completed'
                    : index === currentStepIndex
                        ? 'active'
                        : 'unread',
        }))
    ), [currentStepIndex, steps]);

    const currentStep = hydratedSteps[Math.min(currentStepIndex, hydratedSteps.length - 1)];
    const stepNumber = Math.min(currentStepIndex + 1, totalSteps);
    const stageCompletion = totalSteps > 0 ? Math.round((stepNumber / totalSteps) * 100) : 0;
    const { isLoading, isPlaying, error, togglePlayback, replay } = useLessonTts(currentStep?.text || '');
    const canMoveBackward = currentStepIndex > 0;
    const isFinalStep = currentStepIndex >= totalSteps - 1;

    const goToPreviousStep = () => {
        setStepSession({
            scopeKey: stepScopeKey,
            index: Math.max(0, currentStepIndex - 1),
        });
    };

    const completeCurrentStep = () => {
        if (isFinalStep) {
            onContinue();
            return;
        }

        setStepSession({
            scopeKey: stepScopeKey,
            index: Math.min(totalSteps - 1, currentStepIndex + 1),
        });
    };

    return (
        <StageShell
            pillText={stage.pillText}
            label={label}
            askContext={askContext}
            body={
                <div className="flex flex-col gap-3">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-lavender">
                        Step {stepNumber} of {totalSteps}
                    </span>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#E8E2D6]">
                        <div
                            className="h-full rounded-full bg-indigo transition-all duration-300"
                            style={{ width: `${stageCompletion}%` }}
                        />
                    </div>
                    <p className="text-[14px] leading-6 text-graphite-60">
                        Work through one action at a time. Mark each step done before moving forward.
                    </p>
                </div>
            }
            progress={progress}
            onBack={onBack}
            toolbarState={toolbarState}
            onToolbarChange={onToolbarChange}
            headerAction={headerAction}
            media={
                <div className="w-full flex flex-col gap-5">
                    <div className="rounded-[20px] border border-[rgba(59,63,110,0.12)] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-lavender">
                                    Current action
                                </p>
                                <h3 className="mt-2 text-[20px] font-semibold leading-7 text-indigo">
                                    Step {stepNumber}
                                </h3>
                            </div>
                            <div className="rounded-full bg-lavender-10 px-3 py-2 text-[12px] font-medium text-indigo">
                                {isFinalStep ? 'Final step' : `${totalSteps - stepNumber} step${totalSteps - stepNumber === 1 ? '' : 's'} left`}
                            </div>
                        </div>

                        <p className="mt-4 text-[16px] leading-7 text-graphite">
                            {currentStep?.text}
                        </p>

                        {error ? (
                            <p className="mt-3 text-[12px] leading-5 text-[#B54708]">{error}</p>
                        ) : null}

                        <div className="mt-5 flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={goToPreviousStep}
                                disabled={!canMoveBackward}
                                className={`flex h-11 items-center justify-center rounded-full px-5 text-[14px] font-medium border ${
                                    canMoveBackward
                                        ? 'cursor-pointer border-indigo text-indigo bg-transparent'
                                        : 'cursor-not-allowed border-[#D9D2C5] text-graphite-40 bg-[#F7F3EC]'
                                }`}
                            >
                                Previous step
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    void togglePlayback();
                                }}
                                className="flex h-11 items-center justify-center gap-2 rounded-full border border-indigo bg-white px-5 text-[14px] font-medium text-indigo cursor-pointer"
                            >
                                <span>{isLoading ? 'Generating audio...' : isPlaying ? 'Pause step audio' : 'Hear this step'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    void replay();
                                }}
                                className="flex h-11 items-center justify-center rounded-full border border-indigo bg-white px-5 text-[14px] font-medium text-indigo cursor-pointer"
                            >
                                Replay
                            </button>

                            <button
                                type="button"
                                onClick={completeCurrentStep}
                                className="flex h-11 w-full items-center justify-center rounded-full border-none bg-indigo px-6 text-[14px] font-semibold text-parchment shadow-[0_12px_24px_rgba(59,63,110,0.18)] cursor-pointer sm:ml-auto sm:w-auto"
                            >
                                {isFinalStep ? continueLabel : 'Mark step done'}
                            </button>
                        </div>
                    </div>

                    <div className="w-full flex flex-col gap-4 overflow-y-auto">
                        {hydratedSteps.map((step, idx) => (
                            <StepRow key={`${step.text}:${idx}`} index={idx} step={step} />
                        ))}
                    </div>
                </div>
            }
            bodyWidthClassName="w-full"
        />
    );
}
