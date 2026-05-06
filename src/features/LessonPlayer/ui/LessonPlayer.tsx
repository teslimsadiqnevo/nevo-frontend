'use client';

import { type ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { type LearningMode } from '@/shared/store/useRegistrationStore';
import { getDashboardPath, useApiTokenExpiryRedirect } from '@/shared/lib';
import { AskNevoDrawer } from '@/widgets/AskNevoDrawer';
import { useLessonPlayer } from '../api/useLessonPlayer';
import { STAGE_ORDER, type StageKey, type ToolbarState } from '../api/types';
import { VisualMode } from './modes/VisualMode';
import { AudioMode } from './modes/AudioMode';
import { ActionMode } from './modes/ActionMode';
import { ReadingMode } from './modes/ReadingMode';
import { LeaveLessonDialog } from './LeaveLessonDialog';
import { PaceAdjustmentOverlay } from './PaceAdjustmentOverlay';
import { LessonReflectionOverlay } from './LessonReflectionOverlay';
import { LessonReorientationOverlay } from './LessonReorientationOverlay';
import type { LessonPaceDensity } from '../api/types';

type LessonPlayerProps = {
    lessonId: string;
    stage: StageKey;
};

export function LessonPlayer({ lessonId, stage }: LessonPlayerProps) {
    useApiTokenExpiryRedirect('student');
    const router = useRouter();
    const { data, loading, error } = useLessonPlayer(lessonId);
    const [showLeaveDialog, setShowLeaveDialog] = useState(false);
    const [showPaceOverlay, setShowPaceOverlay] = useState(false);
    const [showReflectionOverlay, setShowReflectionOverlay] = useState(false);
    const [showReorientationOverlay, setShowReorientationOverlay] = useState(false);
    const [showAskNevoDrawer, setShowAskNevoDrawer] = useState(false);
    const [paceSelection, setPaceSelection] = useState<'slower' | 'steady' | 'faster'>('slower');
    const [paceDensity, setPaceDensity] = useState<LessonPaceDensity>('standard');
    const [sessionAutoAdapt, setSessionAutoAdapt] = useState<boolean | null>(null);
    const [manualMode, setManualMode] = useState<LearningMode | null>(null);
    const backendAutoAdapt = data?.adaptAutomatically ?? true;
    const isAutoAdaptActive = sessionAutoAdapt ?? backendAutoAdapt;
    const activeMode: LearningMode =
        isAutoAdaptActive
            ? data?.recommendedMode ?? 'visual'
            : manualMode ?? data?.recommendedMode ?? 'visual';
    const scopeKey = `${lessonId}:${stage}:${activeMode}:${isAutoAdaptActive ? '1' : '0'}`;
    const [toolbarSession, setToolbarSession] = useState<{ scopeKey: string; state: ToolbarState }>({
        scopeKey,
        state: 'original',
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-parchment">
                <span className="text-[14px] text-graphite-60">Loading lesson...</span>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-parchment">
                <span className="text-[14px] text-graphite-60">{error ?? 'Lesson not found'}</span>
            </div>
        );
    }

    const stageIndex = STAGE_ORDER.indexOf(stage);
    if (stageIndex === -1) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-parchment">
                <span className="text-[14px] text-graphite-60">Unknown stage</span>
            </div>
        );
    }

    const currentStage = data.stages.find((current) => current.key === stage) ?? data.stages[stageIndex];
    const progress = ((stageIndex + 1) / STAGE_ORDER.length) * 100;
    const askContext = `You're on: ${data.title} · Section ${stageIndex + 1}`;
    const nextStage = stageIndex < STAGE_ORDER.length - 1 ? data.stages[stageIndex + 1] : null;
    const continueLabel = nextStage ? `Continue to ${nextStage.pillText}` : 'Take final check';
    const toolbarState = toolbarSession.scopeKey === scopeKey ? toolbarSession.state : 'original';
    const headerAction: ReactNode =
        stageIndex < STAGE_ORDER.length - 1 ? (
            <button
                type="button"
                onClick={() => router.push(`/lesson/${lessonId}/micro-quiz?index=${Math.min(stageIndex, 2)}`)}
                className="px-3 py-[6px] rounded-[20px] bg-lavender-20 text-[12px] font-medium leading-4 text-indigo cursor-pointer border-none"
            >
                Quick check
            </button>
        ) : null;

    const goToPrevStage = () => {
        if (stageIndex === 0) {
            setShowLeaveDialog(true);
            return;
        }

        const previousStage = STAGE_ORDER[stageIndex - 1];
        router.push(`/lesson/${lessonId}/${previousStage}`);
    };

    const goToNextStage = () => {
        if (stageIndex < STAGE_ORDER.length - 1) {
            const nextStageKey = STAGE_ORDER[stageIndex + 1];
            router.push(`/lesson/${lessonId}/${nextStageKey}`);
            return;
        }

        router.push(`/lesson/${lessonId}/assessment`);
    };

    const onToolbarChange = (nextState: ToolbarState) => {
        if ((nextState === 'simplified' || nextState === 'slower') && toolbarState === nextState) {
            setShowReflectionOverlay(true);
            return;
        }

        if (nextState === 'slower') {
            setPaceSelection(paceDensity === 'calm' ? 'slower' : 'steady');
            setShowPaceOverlay(true);
            return;
        }

        setToolbarSession({
            scopeKey,
            state: toolbarState === nextState ? 'original' : nextState,
        });
    };

    const shellProps = {
        stage: currentStage,
        progress,
        onBack: goToPrevStage,
        askContext,
        toolbarState,
        onToolbarChange,
        headerAction,
        paceDensity,
        continueLabel,
        onContinue: goToNextStage,
    };

    const applyPaceSelection = () => {
        const nextDensity: LessonPaceDensity = paceSelection === 'slower' ? 'calm' : 'standard';
        const nextToolbarState: ToolbarState = paceSelection === 'slower' ? 'slower' : 'original';

        setPaceDensity(nextDensity);
        setToolbarSession({
            scopeKey,
            state: nextToolbarState,
        });
        setShowPaceOverlay(false);
    };

    const handleReflectionSelect = (optionId: string) => {
        if (optionId === 'thinking') {
            setShowReflectionOverlay(false);
            return;
        }

        if (optionId === 'simpler') {
            setShowReflectionOverlay(false);
            setShowReorientationOverlay(true);
            return;
        }

        setShowReflectionOverlay(false);
        goToNextStage();
    };

    const handleReorientationSelect = (optionId: string) => {
        if (optionId === 'skip') {
            setShowReorientationOverlay(false);
            goToNextStage();
            return;
        }

        setSessionAutoAdapt(false);
        setManualMode(optionId === 'action' ? 'action' : 'visual');
        setShowReorientationOverlay(false);
    };

    return (
        <>
            <div className="flex min-h-screen justify-center bg-white px-0 py-0 sm:px-4 sm:py-6 lg:px-6 lg:py-10">
                <div className="relative w-full">
                    {activeMode === 'visual' ? <VisualMode {...shellProps} /> : null}
                    {activeMode === 'audio' ? <AudioMode {...shellProps} /> : null}
                    {activeMode === 'action' ? <ActionMode {...shellProps} /> : null}
                    {activeMode === 'reading' ? <ReadingMode {...shellProps} /> : null}

                    {showReflectionOverlay ? (
                        <LessonReflectionOverlay data={data.reflection} onSelect={handleReflectionSelect} />
                    ) : null}

                    {showReorientationOverlay ? (
                        <LessonReorientationOverlay
                            data={data.reorientation}
                            onSelect={handleReorientationSelect}
                            onAskNevo={() => {
                                setShowReorientationOverlay(false);
                                setShowAskNevoDrawer(true);
                            }}
                        />
                    ) : null}
                </div>
            </div>

            <LeaveLessonDialog
                open={showLeaveDialog}
                onClose={() => {
                    setShowLeaveDialog(false);
                    router.push(getDashboardPath('student', 'lessons'));
                }}
                onConfirm={() => setShowLeaveDialog(false)}
            />

            {showPaceOverlay ? (
                <PaceAdjustmentOverlay
                    selection={paceSelection}
                    onSelectionChange={setPaceSelection}
                    onApply={applyPaceSelection}
                    onClose={() => setShowPaceOverlay(false)}
                />
            ) : null}

            <AskNevoDrawer
                open={showAskNevoDrawer}
                onClose={() => setShowAskNevoDrawer(false)}
                context={askContext}
                page={`lesson-${stage}`}
                lessonId={lessonId}
            />
        </>
    );
}
