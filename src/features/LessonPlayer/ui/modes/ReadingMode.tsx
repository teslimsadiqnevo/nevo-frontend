'use client';

import type { ReactNode } from 'react';
import { StageShell } from '../StageShell';
import { getRenderingPreferenceStyle } from '../renderingPreferences';
import type { LessonPaceDensity, Stage, ToolbarState } from '../../api/types';

type ReadingModeProps = {
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

export function ReadingMode({
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
}: ReadingModeProps) {
    const content = stage.modes.reading;
    const label =
        toolbarState === 'simplified'
            ? stage.labelSimplified || stage.label
            : toolbarState === 'expanded'
              ? stage.labelExpanded || stage.label
              : stage.label;
    const definition =
        toolbarState === 'simplified'
            ? content.definitionSimplified
            : toolbarState === 'expanded'
              ? content.definitionExpanded
              : content.definition;
    const formula =
        toolbarState === 'expanded'
            ? content.formulaExpanded || content.formula
            : content.formula;
    const renderingStyle = getRenderingPreferenceStyle(content.renderingPreferences);

    return (
        <StageShell
            pillText={stage.pillText}
            label={label}
            askContext={askContext}
            body={
                formula ? (
                    <div className="rounded-lg bg-graphite-5 px-4 py-3 font-mono text-[13px] text-graphite-80 whitespace-pre-line">
                        {formula}
                    </div>
                ) : (
                    <span className="text-[13px] text-graphite-60">Continue when ready.</span>
                )
            }
            progress={progress}
            onExit={onExit}
            onBack={onBack}
            onContinue={onContinue}
            continueLabel={continueLabel}
            toolbarState={toolbarState}
            onToolbarChange={onToolbarChange}
            headerAction={headerAction}
            media={
                <div className="w-full bg-parchment overflow-y-auto">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-lavender">
                        KEY TERM
                    </span>
                    <h3 className="mt-2 mb-3 text-[20px] font-semibold leading-7 text-graphite">
                        {content.keyTerm}
                    </h3>
                    <p className="text-[14px] leading-[22px] text-graphite-80" style={renderingStyle}>
                        {definition}
                    </p>
                </div>
            }
        />
    );
}
