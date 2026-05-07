'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { type LearningMode } from '@/shared/store/useRegistrationStore';
import { getDashboardPath, useApiTokenExpiryRedirect } from '@/shared/lib';
import { AskNevoDrawer } from '@/widgets/AskNevoDrawer';
import { updateLessonProgress } from '@/features/Dashboard/api/student';
import { useLessonPlayer } from '../api/useLessonPlayer';
import type { StageKey, ToolbarState } from '../api/types';
import { VisualMode } from './modes/VisualMode';
import { AudioMode } from './modes/AudioMode';
import { ActionMode } from './modes/ActionMode';
import { ReadingMode } from './modes/ReadingMode';
import { SlowerMode } from './modes/SlowerMode';
import { LeaveLessonDialog } from './LeaveLessonDialog';
import { PaceAdjustmentOverlay } from './PaceAdjustmentOverlay';
import { LessonReflectionOverlay } from './LessonReflectionOverlay';
import { LessonReorientationOverlay } from './LessonReorientationOverlay';
import { LessonPlayerSkeleton } from './LessonPlayerSkeleton';
import type { LessonPaceDensity } from '../api/types';

type LessonPlayerProps = {
    lessonId: string;
    stage: StageKey;
};

function getLessonProgressIdCandidates(...values: Array<string | undefined>) {
    return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)));
}

async function syncLessonProgress(
    ids: string[],
    payload: Omit<Parameters<typeof updateLessonProgress>[0], 'lesson_id'>,
) {
    let lastError: string | undefined;

    for (const id of ids) {
        const result = await updateLessonProgress({
            lesson_id: id,
            ...payload,
        });

        if (!result?.error) {
            return result;
        }

        lastError = result.error;
    }

    throw new Error(lastError || 'Failed to update lesson progress');
}

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
    const progressSessionStartedAt = useRef(Date.now());
    const lastProgressKey = useRef<string | null>(null);
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
    const stageOrder = data?.stageOrder ?? [];
    const stageIndex = stageOrder.indexOf(stage);
    const persistedLessonId = data?.originalLessonId || lessonId;
    const progressIdCandidates = getLessonProgressIdCandidates(
        lessonId,
        data?.id,
        data?.originalLessonId,
        data?.adaptedLessonId,
    );

    useEffect(() => {
        if (!data || stageIndex < 0) return;

        const progressKey = `${progressIdCandidates.join('|')}:${stageIndex + 1}`;
        if (lastProgressKey.current === progressKey) return;
        lastProgressKey.current = progressKey;

        const elapsedSeconds = Math.max(
            1,
            Math.round((Date.now() - progressSessionStartedAt.current) / 1000),
        );

        syncLessonProgress(progressIdCandidates, {
            blocks_completed: stageIndex + 1,
            time_spent_seconds: elapsedSeconds,
            is_completed: false,
        }).catch(() => {
            lastProgressKey.current = null;
        });
    }, [data, progressIdCandidates, stageIndex]);

    if (loading) {
        return <LessonPlayerSkeleton pillWidthClassName="w-24" />;
    }

    if (error || !data) {
        return (
            <LessonPlayerSkeleton
                pillWidthClassName="w-24"
                statusLabel={error ? 'Reloading lesson...' : 'Preparing lesson...'}
            />
        );
    }

    if (stageIndex === -1) {
        return (
            <LessonPlayerSkeleton
                pillWidthClassName="w-24"
                statusLabel="Preparing lesson stage..."
            />
        );
    }

    const currentStage = data.stages.find((current) => current.key === stage) ?? data.stages[stageIndex];
    const progress = ((stageIndex + 1) / Math.max(1, stageOrder.length)) * 100;
    const askContext = `You're on: ${data.title} · Section ${stageIndex + 1}`;
    const nextStage = stageIndex < stageOrder.length - 1 ? data.stages[stageIndex + 1] : null;
    const hasFinalCheckpoint = data.microQuiz.some((question) => question.isFinalCheckpoint);
    const continueLabel = nextStage
        ? `Continue to ${nextStage.pillText}`
        : hasFinalCheckpoint
          ? 'Take final quick check'
          : 'Review complete';
    const toolbarState = toolbarSession.scopeKey === scopeKey ? toolbarSession.state : 'original';
    const headerAction: ReactNode = null;

    const goToPrevStage = () => {
        if (stageIndex === 0) {
            setShowLeaveDialog(true);
            return;
        }

        const previousStage = stageOrder[stageIndex - 1];
        router.push(`/lesson/${lessonId}/${previousStage}`);
    };

    const goToNextStage = () => {
        if (stageIndex >= stageOrder.length - 1) {
            const finalCheckpointIndex = data.microQuiz.findIndex((question) => question.isFinalCheckpoint);
            if (finalCheckpointIndex >= 0) {
                router.push(`/lesson/${lessonId}/micro-quiz?index=${finalCheckpointIndex}`);
            }
            return;
        }

        const completedStepNumber = stageIndex + 1;
        const nextStageKey = stageOrder[stageIndex + 1];
        const checkpointIndex = data.microQuiz.findIndex(
            (question) => question.continueToStageKey === nextStageKey,
        );

        if (completedStepNumber % 4 === 0 && checkpointIndex >= 0) {
            router.push(`/lesson/${lessonId}/micro-quiz?index=${checkpointIndex}`);
            return;
        }

        if (stageIndex < stageOrder.length - 1) {
            router.push(`/lesson/${lessonId}/${nextStageKey}`);
            return;
        }
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
        onExit: () => setShowLeaveDialog(true),
        onBack: goToPrevStage,
        canGoBack: stageIndex > 0,
        askContext,
        toolbarState,
        onToolbarChange,
        headerAction,
        paceDensity,
        continueLabel,
        onContinue: goToNextStage,
        canGoForward: stageIndex < stageOrder.length - 1 || hasFinalCheckpoint,
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
            <div className="flex min-h-screen justify-center bg-parchment px-0 py-0">
                <div className="relative w-full bg-parchment">
                    {toolbarState === 'slower' ? (
                        <SlowerMode
                            stage={currentStage}
                            progress={progress}
                            onExit={() => setShowLeaveDialog(true)}
                            onBack={goToPrevStage}
                            askContext={askContext}
                            activeMode={activeMode}
                            onToolbarChange={onToolbarChange}
                        />
                    ) : null}
                    {toolbarState !== 'slower' && activeMode === 'visual' ? <VisualMode {...shellProps} /> : null}
                    {toolbarState !== 'slower' && activeMode === 'audio' ? <AudioMode {...shellProps} /> : null}
                    {toolbarState !== 'slower' && activeMode === 'action' ? <ActionMode {...shellProps} /> : null}
                    {toolbarState !== 'slower' && activeMode === 'reading' ? <ReadingMode {...shellProps} /> : null}

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
