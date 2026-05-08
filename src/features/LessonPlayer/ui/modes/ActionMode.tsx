'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { queueLessonTtsPreloadBatch, useLessonTts } from '../../api/useLessonTts';
import { StageShell } from '../StageShell';
import type { ActionStep, LessonPaceDensity, Stage, ToolbarState } from '../../api/types';

type ActionModeProps = {
    stage: Stage;
    progress: number;
    onExit: () => void;
    onBack: () => void;
    onContinue: () => void;
    continueLabel: string;
    askContext?: string | null;
    toolbarState: ToolbarState;
    onToolbarChange: (state: ToolbarState) => void;
    headerAction?: ReactNode;
    paceDensity: LessonPaceDensity;
};

function ActionAudioButton({ text }: { text: string }) {
    const { isLoading, isPlaying, togglePlayback } = useLessonTts(text);

    return (
        <button
            type="button"
            onClick={() => {
                void togglePlayback();
            }}
            aria-label={isLoading ? 'Generating step audio' : isPlaying ? 'Pause step audio' : 'Play step audio'}
            className="flex h-8 w-8 shrink-0 items-center justify-center border-none bg-transparent text-lavender-40 transition-opacity hover:opacity-80 cursor-pointer"
        >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path
                    d="M14 10.5L10 13.75H7V18.25H10L14 21.5V10.5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                />
                <path
                    d="M19 12.5C20.2667 13.6333 21 15.2 21 16.9C21 18.6 20.2667 20.1667 19 21.3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <path
                    d="M21.75 9.5C23.7167 11.3 24.8 13.8333 24.8 16.5C24.8 19.1667 23.7167 21.7 21.75 23.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>
        </button>
    );
}

function StepBadge({ index }: { index: number }) {
    return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo text-[13px] font-bold leading-5 text-parchment">
            {index + 1}
        </div>
    );
}

function ActionInstructionRow({
    index,
    step,
    isPrimary,
    isCompleted,
    onSelect,
}: {
    index: number;
    step: ActionStep;
    isPrimary: boolean;
    isCompleted: boolean;
    onSelect: () => void;
}) {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onSelect}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect();
                }
            }}
            className={[
                'relative flex min-h-16 w-full items-start gap-4 rounded-xl px-4 py-4 text-left transition-colors cursor-pointer',
                isPrimary
                    ? 'border border-[#E0D9CE] bg-transparent'
                    : 'border border-[#E0D9CE] bg-transparent hover:bg-[rgba(255,255,255,0.28)]',
            ].join(' ')}
        >
            {isPrimary ? <div className="absolute bottom-0 left-0 top-0 w-[3px] rounded-l-xl bg-indigo" /> : null}

            <div className={isPrimary ? 'pl-3' : ''}>
                <StepBadge index={index} />
            </div>
            <ActionAudioButton text={step.text} />
            <p
                className={[
                    'flex-1 pt-[2px] text-[15px] leading-[22px]',
                    isCompleted ? 'text-graphite/60' : 'text-graphite',
                ].join(' ')}
            >
                {step.text}
            </p>
        </div>
    );
}

function getDisplayedSteps(stage: Stage, toolbarState: ToolbarState) {
    const content = stage.modes.action;

    if (toolbarState === 'simplified') return content.stepsSimplified;
    if (toolbarState === 'expanded') return content.stepsExpanded;
    return content.steps;
}

export function ActionMode({
    stage,
    progress,
    onExit,
    onBack,
    onContinue,
    continueLabel,
    askContext,
    toolbarState,
    onToolbarChange,
    headerAction,
}: ActionModeProps) {
    const steps = getDisplayedSteps(stage, toolbarState);
    const baseActiveIndex = Math.max(0, steps.findIndex((step) => step.state === 'active'));
    const stepScopeKey = `${stage.key}:${toolbarState}:${steps.length}`;
    const [stepSession, setStepSession] = useState({
        scopeKey: stepScopeKey,
        index: baseActiveIndex,
    });
    const currentIndex = stepSession.scopeKey === stepScopeKey ? stepSession.index : baseActiveIndex;
    const totalSteps = Math.max(1, steps.length);
    const resolvedIndex = Math.max(0, Math.min(currentIndex, totalSteps - 1));
    const hydratedSteps = useMemo<ActionStep[]>(
        () =>
            steps.map((step, index) => ({
                ...step,
                state:
                    index < resolvedIndex
                        ? 'completed'
                        : index === resolvedIndex
                          ? 'active'
                          : 'unread',
            })),
        [resolvedIndex, steps],
    );
    const goToPrevious = () => {
        if (resolvedIndex > 0) {
            setStepSession({
                scopeKey: stepScopeKey,
                index: resolvedIndex - 1,
            });
            return;
        }

        onBack();
    };
    const goToNext = () => {
        if (resolvedIndex < totalSteps - 1) {
            setStepSession({
                scopeKey: stepScopeKey,
                index: resolvedIndex + 1,
            });
            return;
        }

        onContinue();
    };
    const canGoBack = resolvedIndex > 0;
    const canGoForward = resolvedIndex < totalSteps - 1 || Boolean(onContinue);
    const currentLabel =
        toolbarState === 'simplified'
            ? stage.labelSimplified || stage.label
            : toolbarState === 'expanded'
              ? stage.labelExpanded || stage.label
              : stage.label;

    useEffect(() => {
        const priorityEntries = hydratedSteps
            .slice(resolvedIndex, Math.min(hydratedSteps.length, resolvedIndex + 2))
            .map((step, offset) => ({
                text: step.text,
                cacheKey: `${stage.key}:action-step:${resolvedIndex + offset}:${toolbarState}`,
                priority: 'high' as const,
            }));

        const backgroundEntries = hydratedSteps
            .map((step, index) => ({ step, index }))
            .filter(({ index }) => index < resolvedIndex || index > resolvedIndex + 1)
            .map(({ step, index }) => ({
                text: step.text,
                cacheKey: `${stage.key}:action-step:${index}:${toolbarState}`,
                priority: 'low' as const,
            }));

        void queueLessonTtsPreloadBatch([...priorityEntries, ...backgroundEntries]);
    }, [hydratedSteps, resolvedIndex, stage.key, toolbarState]);

    return (
        <StageShell
            pillText={stage.pillText}
            label={currentLabel}
            askContext={askContext}
            progress={progress}
            onExit={onExit}
            onBack={goToPrevious}
            canGoBack={canGoBack}
            toolbarState={toolbarState}
            onToolbarChange={onToolbarChange}
            headerAction={headerAction}
            continueLabel={continueLabel}
            onContinue={goToNext}
            canGoForward={canGoForward}
            bodyWidthClassName="max-w-[928px]"
            meta={
                <div className="flex justify-end pt-[15px]">
                    <span className="text-[13px] leading-5 text-indigo/60">
                        Step {resolvedIndex + 1} of {totalSteps}
                    </span>
                </div>
            }
            body={
                <div className="max-w-[928px] pt-4">
                    <div className="flex flex-col gap-4">
                        {hydratedSteps.map((step, index) => (
                            <ActionInstructionRow
                                key={`${step.text}:${index}`}
                                index={index}
                                step={step}
                                isPrimary={index === resolvedIndex}
                                isCompleted={index < resolvedIndex}
                                onSelect={() =>
                                    setStepSession({
                                        scopeKey: stepScopeKey,
                                        index,
                                    })
                                }
                            />
                        ))}
                    </div>
                </div>
            }
        />
    );
}
