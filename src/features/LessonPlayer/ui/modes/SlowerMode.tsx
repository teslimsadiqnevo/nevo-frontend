'use client';

import { useMemo, useState } from 'react';
import type { LearningMode } from '@/shared/store/useRegistrationStore';
import type { Stage, ToolbarState } from '../../api/types';
import { StageShell } from '../StageShell';

type SlowerModeProps = {
    stage: Stage;
    progress: number;
    onExit: () => void;
    onBack: () => void;
    askContext?: string | null;
    activeMode: LearningMode;
    onToolbarChange: (state: ToolbarState) => void;
};

function PauseModal({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/35" onClick={onClose} aria-hidden />
            <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-[24px] px-12 pt-10 pb-8 flex flex-col items-center gap-4">
                <p className="text-[20px] leading-8 text-graphite text-center">
                    You&apos;ve been going for a bit. Want a quick pause?
                </p>
                <button
                    type="button"
                    onClick={onClose}
                    className="h-[52px] px-8 rounded-xl bg-indigo text-parchment text-[16px] font-semibold cursor-pointer border-none"
                >
                    Take a pause
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-[15px] leading-[22px] text-lavender underline cursor-pointer bg-transparent border-none"
                >
                    Keep going
                </button>
                <span className="text-[12px] leading-4 text-graphite-40">You can come back any time.</span>
            </div>
        </div>
    );
}

export function SlowerMode({
    stage,
    progress,
    onExit,
    onBack,
    askContext,
    activeMode,
    onToolbarChange,
}: SlowerModeProps) {
    const [stepIndex, setStepIndex] = useState(0);
    const [showPauseModal, setShowPauseModal] = useState(false);

    const currentStep = stage.slowerSteps[Math.min(stepIndex, stage.slowerSteps.length - 1)];
    const isLastStep = currentStep?.isLastStep || stepIndex >= stage.slowerSteps.length - 1;

    const title = useMemo(() => {
        if (activeMode === 'audio') return 'LISTEN — ABSORB THE CONCEPT';
        if (activeMode === 'action') return 'PRACTICE — TRY IT YOURSELF';
        if (activeMode === 'reading') return 'ANALYSIS — KEY CONCEPT';
        return stage.labelSimplified || stage.label;
    }, [activeMode, stage]);

    const meta = (
        <div className="flex justify-end">
            <button
                type="button"
                onClick={() => setShowPauseModal(true)}
                className="flex items-center gap-2 px-3 h-8 rounded-full bg-lavender-20 text-indigo text-[12px] font-medium cursor-pointer border-none"
            >
                <span>Pause</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="3" y="2.5" width="2.25" height="9" rx="1.125" fill="rgba(59,63,110,0.7)" />
                    <rect x="8.75" y="2.5" width="2.25" height="9" rx="1.125" fill="rgba(59,63,110,0.7)" />
                </svg>
            </button>
        </div>
    );

    const media = (
        <div className="flex flex-col items-center justify-center min-h-[180px] rounded-2xl bg-white border border-[#E0D9CE] px-8 py-10">
            {activeMode === 'visual' ? (
                <>
                    <div className="w-full h-[180px] rounded-xl border border-[#E0D9CE] bg-[linear-gradient(135deg,#467a19_0%,#91b825_35%,#d3dd3d_70%,#9bbd18_100%)] overflow-hidden" />
                    <p className="mt-6 max-w-[680px] text-[18px] leading-[30px] text-graphite text-left">
                        {currentStep?.text}
                    </p>
                </>
            ) : null}

            {activeMode === 'audio' ? (
                <>
                    <div className="w-12 h-12 rounded-full bg-lavender flex items-center justify-center">
                        <div className="flex items-end gap-[2px] h-4">
                            <span className="w-1 h-3 rounded-full bg-indigo/80" />
                            <span className="w-1 h-4 rounded-full bg-indigo/80" />
                            <span className="w-1 h-3 rounded-full bg-indigo/80" />
                        </div>
                    </div>
                    <p className="mt-8 text-[20px] leading-8 font-semibold text-graphite text-center">
                        {currentStep?.text}
                    </p>
                    <div className="mt-6 flex items-center gap-[3px] h-8">
                        {Array.from({ length: 20 }).map((_, index) => (
                            <span
                                key={index}
                                className="w-[4px] rounded-full bg-lavender"
                                style={{ height: `${10 + ((index * 7) % 18)}px` }}
                            />
                        ))}
                    </div>
                </>
            ) : null}

            {activeMode === 'action' ? (
                <div className="w-full max-w-[840px] rounded-2xl bg-white border-l-4 border-l-lavender shadow-[0_1px_2px_rgba(0,0,0,0.05)] px-6 py-8 flex items-center gap-6">
                    <div className="w-14 h-14 rounded-full bg-indigo text-parchment flex items-center justify-center text-[28px] font-bold shrink-0">
                        {currentStep?.stepNumber}
                    </div>
                    <p className="text-[20px] leading-8 text-graphite">{currentStep?.text}</p>
                </div>
            ) : null}

            {activeMode === 'reading' ? (
                <div className="w-full max-w-[720px]">
                    <div className="rounded-2xl bg-white px-5 py-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.275px] text-lavender">
                            Key Term
                        </p>
                        <h3 className="mt-2 text-[22px] leading-[33px] font-bold text-indigo">
                            {stage.modes.reading.keyTerm}
                        </h3>
                    </div>
                    <p className="mt-5 text-[18px] leading-[30px] text-graphite">
                        {currentStep?.text}
                    </p>
                </div>
            ) : null}
        </div>
    );

    const body = (
        <div className="flex items-center justify-between gap-4">
            <div className="text-[13px] leading-5 text-graphite-40">
                Step {Math.min(stepIndex + 1, stage.slowerSteps.length)} of {stage.slowerSteps.length}
            </div>
            <button
                type="button"
                onClick={() => {
                    if (isLastStep) {
                        onToolbarChange('original');
                        return;
                    }
                    setStepIndex((current) => Math.min(current + 1, stage.slowerSteps.length - 1));
                }}
                className="h-11 px-5 rounded-full bg-indigo text-parchment text-[14px] font-semibold cursor-pointer border-none shadow-[0_4px_16px_rgba(59,63,110,0.25)]"
            >
                {isLastStep ? 'Resume lesson' : 'Next step'}
            </button>
        </div>
    );

    return (
        <>
            <StageShell
                pillText={stage.pillText}
                label={title}
                meta={meta}
                media={media}
                body={body}
                progress={progress}
                onExit={onExit}
                onBack={onBack}
                askContext={askContext}
                toolbarState="slower"
                onToolbarChange={onToolbarChange}
                bodyWidthClassName="w-full"
            />
            {showPauseModal ? <PauseModal onClose={() => setShowPauseModal(false)} /> : null}
        </>
    );
}
