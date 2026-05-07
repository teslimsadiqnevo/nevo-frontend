'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRegistrationStore, type LearningMode } from '@/shared/store/useRegistrationStore';
import { getDashboardPath, useApiTokenExpiryRedirect } from '@/shared/lib';
import { AskNevoDrawer } from '@/widgets/AskNevoDrawer';
import { updateLessonProgress } from '@/features/Dashboard/api/student';
import { useLessonPlayer } from '../api/useLessonPlayer';
import type { Stage, StageKey, ToolbarState } from '../api/types';
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
import { preloadLessonTts, stopAllLessonTts } from '../api/useLessonTts';

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

function getAudioBodyForToolbar(stage: Stage, state: Exclude<ToolbarState, 'slower'>) {
    const content = stage.modes.audio;

    if (state === 'simplified') return content.bodySimplified;
    if (state === 'expanded') return content.bodyExpanded;
    return content.body;
}

function getAudioCacheBaseKey(lessonId: string, stage: Stage) {
    return `${lessonId}:${stage.key}:audio`;
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
    const learningMode = useRegistrationStore((state) => state.learningMode);
    const progressSessionStartedAt = useRef(Date.now());
    const lastProgressKey = useRef<string | null>(null);
    const activeMode: LearningMode = learningMode;
    const scopeKey = `${lessonId}:${stage}:${activeMode}`;
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

    useEffect(() => {
        return () => {
            stopAllLessonTts();
        };
    }, [lessonId, stage]);

    useEffect(() => {
        if (!data || activeMode !== 'audio' || stageIndex < 0) return;

        const currentStage = data.stages.find((current) => current.key === stage) ?? data.stages[stageIndex];
        const nextStage = stageIndex < data.stageOrder.length - 1 ? data.stages[stageIndex + 1] : null;
        const currentCacheBaseKey = getAudioCacheBaseKey(lessonId, currentStage);

        void preloadLessonTts(
            getAudioBodyForToolbar(currentStage, 'original'),
            `${currentCacheBaseKey}:original`,
        );
        void preloadLessonTts(
            getAudioBodyForToolbar(currentStage, 'simplified'),
            `${currentCacheBaseKey}:simplified`,
        );
        void preloadLessonTts(
            getAudioBodyForToolbar(currentStage, 'expanded'),
            `${currentCacheBaseKey}:expanded`,
        );

        if (nextStage) {
            void preloadLessonTts(
                getAudioBodyForToolbar(nextStage, 'original'),
                `${getAudioCacheBaseKey(lessonId, nextStage)}:original`,
            );
        }
    }, [activeMode, data, lessonId, stage, stageIndex]);

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

    const requestLeaveLesson = () => {
        stopAllLessonTts();
        setShowLeaveDialog(true);
    };

    const goToPrevStage = () => {
        stopAllLessonTts();
        if (stageIndex === 0) {
            requestLeaveLesson();
            return;
        }

        const previousStage = stageOrder[stageIndex - 1];
        router.push(`/lesson/${lessonId}/${previousStage}`);
    };

    const goToNextStage = () => {
        stopAllLessonTts();
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
        stopAllLessonTts();
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
        onExit: requestLeaveLesson,
        onBack: goToPrevStage,
        canGoBack: stageIndex > 0,
        askContext,
        toolbarState,
        onToolbarChange,
        headerAction,
        paceDensity,
        audioCacheBaseKey: getAudioCacheBaseKey(lessonId, currentStage),
        continueLabel,
        onContinue: goToNextStage,
        canGoForward: stageIndex < stageOrder.length - 1 || hasFinalCheckpoint,
    };

    const applyPaceSelection = () => {
        stopAllLessonTts();
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
        stopAllLessonTts();
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
        stopAllLessonTts();
        if (optionId === 'skip') {
            setShowReorientationOverlay(false);
            goToNextStage();
            return;
        }

        if (optionId === 'slow-down') {
            setPaceDensity('calm');
            setToolbarSession({
                scopeKey,
                state: 'slower',
            });
        }

        if (optionId === 'simplify') {
            setToolbarSession({
                scopeKey,
                state: 'simplified',
            });
        }

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
                            onExit={requestLeaveLesson}
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
                    stopAllLessonTts();
                    setShowLeaveDialog(false);
                    router.push(getDashboardPath('student', 'lessons'));
                }}
                onConfirm={() => {
                    stopAllLessonTts();
                    setShowLeaveDialog(false);
                }}
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
