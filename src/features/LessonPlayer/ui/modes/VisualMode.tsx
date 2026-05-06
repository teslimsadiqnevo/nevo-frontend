'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { StageShell } from '../StageShell';
import type { LessonPaceDensity, Stage, StageKey, ToolbarState } from '../../api/types';

const RELATE_CHIPS = ['Coffee', 'Sink drain', 'Roundabout'];

const STAGE_VISUAL_INTENT: Record<StageKey, string> = {
    observe: 'Find an image showing the main object or concept clearly.',
    notice: 'Find an image showing an important detail, part, pattern, or mechanism.',
    relate: 'Find an image showing a familiar real-world connection or analogy.',
    predict: 'Find an image showing what changes, happens next, or cause and effect.',
    confirm: 'Find an image showing the completed idea, summary, or key takeaway.',
};

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
    const visualContext = [
        stage.key,
        stage.label,
        STAGE_VISUAL_INTENT[stage.key],
        stage.modes.reading.keyTerm,
        body,
    ].filter(Boolean).join(' ');
    const visualScopeKey = `${stage.key}:${content.conceptId}:${visualContext}:${content.imageUrl}:${content.imageFetchStatus}`;
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
            visual_stage: stage.key,
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
        stage.key,
        visualContext,
        visualScopeKey,
    ]);

    const hasResolvedImage = Boolean(resolvedImageState.imageUrl);
    const loaderSteps = useMemo(
        () => [
            'Reading this concept',
            'Finding a relevant lesson image',
            'Fitting the image for this screen',
        ],
        [],
    );

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
                    ) : resolvedImageState.fetchStatus === 'pending' ? (
                        <div className="absolute inset-0 flex flex-col justify-between p-6">
                            <div className="flex items-center justify-between">
                                <span className="rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-indigo">
                                    Visual loading
                                </span>
                                <span className="rounded-full bg-[#3B3F6E] px-3 py-1 text-[11px] font-semibold text-parchment">
                                    {stage.modes.reading.keyTerm}
                                </span>
                            </div>

                            <div className="mx-auto flex w-full max-w-[460px] flex-col gap-3">
                                {loaderSteps.map((step, index) => (
                                    <div
                                        key={`${step}:${index}`}
                                        className="overflow-hidden rounded-2xl border border-white/70 bg-white/75 px-4 py-3 shadow-[0_12px_24px_rgba(59,63,110,0.08)]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-indigo" />
                                            <span className="text-[13px] font-medium leading-5 text-graphite">
                                                {step}
                                            </span>
                                        </div>
                                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#E6DDCE]">
                                            <div
                                                className="h-full rounded-full bg-indigo/80"
                                                style={{ width: `${45 + index * 18}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end">
                                <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-2 text-[12px] text-indigo/80">
                                    Nevo is fetching a relevant lesson image
                                </div>
                            </div>
                        </div>
                    ) : (
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
                                    {resolvedImageState.fetchStatus === 'failed'
                                        ? 'Showing a visual fallback while the image is unavailable'
                                        : 'Picture-led explanation for this concept'}
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

                    {stageKey === 'relate' ? (
                        <div className="absolute bottom-0 left-0 right-0 flex flex-wrap items-center justify-center gap-3 px-4 pb-6">
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
