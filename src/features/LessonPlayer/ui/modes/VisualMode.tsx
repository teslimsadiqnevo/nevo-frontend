'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { StageShell } from '../StageShell';
import { getRenderingPreferenceStyle } from '../renderingPreferences';
import type { LessonPaceDensity, Stage, StagePhaseKey, ToolbarState } from '../../api/types';

const STAGE_VISUAL_INTENT: Record<StagePhaseKey, string> = {
    observe: 'Find an image showing the main object or concept clearly.',
    notice: 'Find an image showing an important detail, part, pattern, or mechanism.',
    relate: 'Find an image showing a familiar real-world connection or analogy.',
    predict: 'Find an image showing what changes, happens next, or cause and effect.',
    confirm: 'Find an image showing the completed idea, summary, or key takeaway.',
};

type VisualModeProps = {
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
    onImageViewed?: () => void;
};

export function VisualMode({
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
    paceDensity,
    onImageViewed,
}: VisualModeProps) {
    const content = stage.modes.visual;
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
    const renderingStyle = getRenderingPreferenceStyle(content.renderingPreferences);
    const visualContext = [
        stage.phase,
        stage.label,
        STAGE_VISUAL_INTENT[stage.phase],
        stage.modes.reading.keyTerm,
        content.body,
    ].filter(Boolean).join(' ');
    const visualScopeKey = `${stage.key}:${content.conceptId}:${content.imageUrl}:${content.imageFetchStatus}`;
    const [imageState, setImageState] = useState({
        scopeKey: visualScopeKey,
        imageUrl: content.imageUrl,
        imageAltText: content.imageAltText || '',
        fetchStatus: content.imageFetchStatus,
    });
    const resolvedImageState =
        imageState.scopeKey === visualScopeKey
            ? imageState
            : {
                scopeKey: visualScopeKey,
                imageUrl: '',
                imageAltText: content.imageAltText || '',
                fetchStatus: 'pending',
            };

    useEffect(() => {
        let isCancelled = false;
        let intervalId: ReturnType<typeof setInterval> | null = null;

        if (!content.conceptId) {
            return () => {
                isCancelled = true;
            };
        }

        const contextQuery = new URLSearchParams({
            visual_stage: stage.phase,
            visual_context: visualContext.slice(0, 850),
        }).toString();

        const pollForImage = async () => {
            try {
                const response = await fetch(
                    `/api/concepts/${encodeURIComponent(content.conceptId)}/image?${contextQuery}`,
                    { cache: 'no-store' },
                );
                const data = await response.json().catch(() => ({}));
                if (!response.ok || isCancelled) {
                    return;
                }

                const nextStatus =
                    data?.image_fetch_status === 'resolved' ||
                    data?.image_fetch_status === 'failed'
                        ? data.image_fetch_status
                        : 'pending';

                setImageState((current) =>
                    current.scopeKey !== visualScopeKey
                        ? {
                            scopeKey: visualScopeKey,
                            imageUrl:
                                typeof data?.image_url === 'string' && data.image_url
                                    ? data.image_url
                                    : '',
                            imageAltText: content.imageAltText || '',
                            fetchStatus: nextStatus,
                        }
                        : {
                            scopeKey: visualScopeKey,
                            imageUrl:
                                typeof data?.image_url === 'string' && data.image_url
                                    ? data.image_url
                                    : current.imageUrl,
                            imageAltText: content.imageAltText || current.imageAltText,
                            fetchStatus: nextStatus,
                        },
                );

                if (nextStatus !== 'pending' && intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                }
            } catch {
                if (!isCancelled) {
                    setImageState((current) =>
                        current.scopeKey !== visualScopeKey
                            ? current
                            : { ...current, fetchStatus: current.imageUrl ? 'resolved' : 'failed' },
                    );
                }
                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                }
            }
        };

        void pollForImage();
        if (content.imageFetchStatus !== 'pending') {
            return () => {
                isCancelled = true;
            };
        }

        intervalId = setInterval(() => {
            void pollForImage();
        }, 3000);

        return () => {
            isCancelled = true;
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [
        content.conceptId,
        content.imageAltText,
        content.imageFetchStatus,
        content.imageUrl,
        stage.phase,
        visualContext,
        visualScopeKey,
    ]);

    const hasResolvedImage = Boolean(resolvedImageState.imageUrl);

    useEffect(() => {
        if (!hasResolvedImage) return;
        onImageViewed?.();
    }, [hasResolvedImage, onImageViewed, visualScopeKey]);

    return (
        <StageShell
            pillText={stage.pillText}
            label={label}
            body={
                <p
                    className={isCalmDensity ? 'text-[18px] leading-8 text-graphite' : 'text-[15px] leading-6 text-graphite'}
                    style={renderingStyle}
                >
                    {body}
                </p>
            }
            progress={progress}
            onExit={onExit}
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
                        'relative h-[260px] w-full overflow-hidden rounded-xl border-2 border-[#E0D9CE] sm:h-[300px] lg:h-[320px]',
                        hasResolvedImage
                            ? 'bg-[#F5F0E8]'
                            : 'bg-[linear-gradient(135deg,#f1ece2_0%,#ebe4d7_45%,#e1d8c9_100%)]',
                    ].join(' ')}
                >
                    {hasResolvedImage ? (
                        <img
                            src={resolvedImageState.imageUrl}
                            alt={resolvedImageState.imageAltText || `Visual explanation for ${stage.label}`}
                            className="absolute inset-0 h-full w-full object-cover object-center"
                        />
                    ) : (
                        <div className="absolute inset-0 p-6">
                            <div className="h-full w-full animate-pulse rounded-xl bg-white/55">
                                <div className="flex h-full flex-col gap-4 p-5">
                                    <div className="h-6 w-24 rounded-full bg-white/80" />
                                    <div className="flex-1 rounded-2xl bg-white/70" />
                                    <div className="flex gap-3">
                                        <div className="h-3 flex-1 rounded-full bg-white/80" />
                                        <div className="h-3 w-1/3 rounded-full bg-white/80" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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
                </div>
            }
        />
    );
}
