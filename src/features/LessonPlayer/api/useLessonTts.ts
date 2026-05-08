'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type LessonTtsState = {
    isLoading: boolean;
    isPlaying: boolean;
    error: string | null;
    togglePlayback: () => Promise<void>;
    replay: () => Promise<void>;
    stop: () => void;
};

type LessonTtsOptions = {
    autoPlay?: boolean;
    cacheKey?: string;
};

type TtsResponseBody = {
    detail?: string;
    message?: string;
    error?: string;
};

let activeLessonAudio: HTMLAudioElement | null = null;
const lessonTtsCache = new Map<string, { objectUrl: string; blob: Blob }>();
const lessonTtsPending = new Map<string, Promise<string | null>>();
const MAX_LESSON_TTS_CACHE_ENTRIES = 48;
const MAX_LESSON_TTS_PRELOAD_CONCURRENCY = 2;
let activeLessonTtsPreloads = 0;
const lessonTtsPreloadQueue: Array<{
    text: string;
    cacheKey: string;
    priority: 'high' | 'low';
    resolve: (value: string | null) => void;
}> = [];

function hashText(value: string) {
    let hash = 5381;

    for (let index = 0; index < value.length; index += 1) {
        hash = (hash * 33) ^ value.charCodeAt(index);
    }

    return (hash >>> 0).toString(36);
}

function getAudioCacheKey(text: string, explicitKey?: string) {
    const cleanedText = text.trim();
    return explicitKey || `tts:${hashText(cleanedText)}:${cleanedText.length}`;
}

function touchLessonTtsCacheEntry(cacheKey: string, entry: { objectUrl: string; blob: Blob }) {
    lessonTtsCache.delete(cacheKey);
    lessonTtsCache.set(cacheKey, entry);
}

function trimLessonTtsCache() {
    let guard = 0;

    while (lessonTtsCache.size > MAX_LESSON_TTS_CACHE_ENTRIES && guard < MAX_LESSON_TTS_CACHE_ENTRIES * 2) {
        const oldestEntry = lessonTtsCache.entries().next().value as
            | [string, { objectUrl: string; blob: Blob }]
            | undefined;

        if (!oldestEntry) {
            return;
        }

        const [oldestKey, cachedEntry] = oldestEntry;

        if (activeLessonAudio?.src === cachedEntry.objectUrl) {
            touchLessonTtsCacheEntry(oldestKey, cachedEntry);
            guard += 1;
            continue;
        }

        lessonTtsCache.delete(oldestKey);
        URL.revokeObjectURL(cachedEntry.objectUrl);
        guard += 1;
    }
}

function flushLessonTtsPreloadQueue() {
    while (
        activeLessonTtsPreloads < MAX_LESSON_TTS_PRELOAD_CONCURRENCY &&
        lessonTtsPreloadQueue.length > 0
    ) {
        const nextJob = lessonTtsPreloadQueue.shift();
        if (!nextJob) return;

        activeLessonTtsPreloads += 1;
        fetchLessonTtsAudio(nextJob.text, nextJob.cacheKey)
            .then((result) => nextJob.resolve(result))
            .catch(() => nextJob.resolve(null))
            .finally(() => {
                activeLessonTtsPreloads = Math.max(0, activeLessonTtsPreloads - 1);
                flushLessonTtsPreloadQueue();
            });
    }
}

function pauseAudio(audio: HTMLAudioElement | null, reset = true) {
    if (!audio) return;

    audio.pause();
    if (reset) {
        try {
            audio.currentTime = 0;
        } catch {
            // Some browsers can throw while metadata is still loading.
        }
    }
}

export function stopAllLessonTts() {
    pauseAudio(activeLessonAudio);
    activeLessonAudio = null;
}

function buildErrorMessage(payload: TtsResponseBody | null, fallback: string) {
    if (!payload) return fallback;
    if (typeof payload.detail === 'string') return payload.detail;
    if (typeof payload.message === 'string') return payload.message;
    if (typeof payload.error === 'string') return payload.error;
    return fallback;
}

function waitForAbort(signal: AbortSignal) {
    return new Promise<null>((resolve) => {
        if (signal.aborted) {
            resolve(null);
            return;
        }

        signal.addEventListener('abort', () => resolve(null), { once: true });
    });
}

async function fetchLessonTtsAudio(text: string, cacheKey: string) {
    const cached = lessonTtsCache.get(cacheKey);
    if (cached) {
        touchLessonTtsCacheEntry(cacheKey, cached);
        return cached.objectUrl;
    }

    const pending = lessonTtsPending.get(cacheKey);
    if (pending) {
        return pending;
    }

    const request = (async () => {
        try {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                throw new Error(buildErrorMessage(payload, 'Could not generate lesson audio.'));
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            lessonTtsCache.set(cacheKey, { objectUrl, blob });
            trimLessonTtsCache();
            return objectUrl;
        } finally {
            lessonTtsPending.delete(cacheKey);
        }
    })();

    lessonTtsPending.set(cacheKey, request);
    return request;
}

export function preloadLessonTts(text: string, cacheKey?: string) {
    const cleanedText = text.trim();
    if (!cleanedText || typeof window === 'undefined') {
        return Promise.resolve(null);
    }

    return fetchLessonTtsAudio(cleanedText, getAudioCacheKey(cleanedText, cacheKey)).catch(() => null);
}

export function queueLessonTtsPreload(
    text: string,
    options: { cacheKey?: string; priority?: 'high' | 'low' } = {},
) {
    const cleanedText = text.trim();
    if (!cleanedText || typeof window === 'undefined') {
        return Promise.resolve(null);
    }

    const cacheKey = getAudioCacheKey(cleanedText, options.cacheKey);
    if (lessonTtsCache.has(cacheKey) || lessonTtsPending.has(cacheKey)) {
        return fetchLessonTtsAudio(cleanedText, cacheKey).catch(() => null);
    }

    return new Promise<string | null>((resolve) => {
        lessonTtsPreloadQueue.push({
            text: cleanedText,
            cacheKey,
            priority: options.priority ?? 'low',
            resolve,
        });

        lessonTtsPreloadQueue.sort((a, b) => {
            if (a.priority === b.priority) return 0;
            return a.priority === 'high' ? -1 : 1;
        });
        flushLessonTtsPreloadQueue();
    });
}

export function queueLessonTtsPreloadBatch(
    entries: Array<{ text: string; cacheKey?: string; priority?: 'high' | 'low' }>,
) {
    return Promise.all(
        entries.map((entry) =>
            queueLessonTtsPreload(entry.text, {
                cacheKey: entry.cacheKey,
                priority: entry.priority,
            }),
        ),
    );
}

export function useLessonTts(
    text: string,
    prefetchedAudioUrl?: string | null,
    options: LessonTtsOptions = {},
): LessonTtsState {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const objectUrlRef = useRef<string | null>(null);
    const preparedTextRef = useRef<string>('');
    const abortControllerRef = useRef<AbortController | null>(null);
    const requestIdRef = useRef(0);
    const mountedRef = useRef(false);
    const audioSourceIsCachedRef = useRef(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const autoPlay = options.autoPlay ?? false;

    const stop = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        pauseAudio(audio);
        if (activeLessonAudio === audio) {
            activeLessonAudio = null;
        }
        setIsPlaying(false);
    }, []);

    const releaseAudio = useCallback(() => {
        requestIdRef.current += 1;
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;

        const audio = audioRef.current;
        if (audio) {
            pauseAudio(audio);
            if (activeLessonAudio === audio) {
                activeLessonAudio = null;
            }
            audio.removeAttribute('src');
            audio.load();
        }

        if (objectUrlRef.current) {
            if (!audioSourceIsCachedRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
            }
            objectUrlRef.current = null;
        }
        audioSourceIsCachedRef.current = false;

        preparedTextRef.current = '';
        setIsPlaying(false);
        setIsLoading(false);
        setError(null);
    }, []);

    const ensureAudio = useCallback(async () => {
        const cleanedText = text.trim();
        const cacheKey = getAudioCacheKey(cleanedText, options.cacheKey);
        const audio = audioRef.current;

        if (!audio || !cleanedText) {
            return null;
        }

        if (prefetchedAudioUrl && preparedTextRef.current === cleanedText && audio.src === prefetchedAudioUrl) {
            return prefetchedAudioUrl;
        }

        if (prefetchedAudioUrl) {
            if (objectUrlRef.current) {
                if (!audioSourceIsCachedRef.current) {
                    URL.revokeObjectURL(objectUrlRef.current);
                }
                objectUrlRef.current = null;
            }
            audioSourceIsCachedRef.current = false;

            preparedTextRef.current = cleanedText;
            audio.src = prefetchedAudioUrl;
            return prefetchedAudioUrl;
        }

        if (objectUrlRef.current && preparedTextRef.current === cleanedText) {
            return objectUrlRef.current;
        }

        const cached = lessonTtsCache.get(cacheKey);
        if (cached) {
            touchLessonTtsCacheEntry(cacheKey, cached);
            if (objectUrlRef.current && !audioSourceIsCachedRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
            }

            objectUrlRef.current = cached.objectUrl;
            audioSourceIsCachedRef.current = true;
            preparedTextRef.current = cleanedText;
            audio.src = cached.objectUrl;
            return cached.objectUrl;
        }

        setIsLoading(true);
        setError(null);
        abortControllerRef.current?.abort();
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            const objectUrl = await Promise.race([
                fetchLessonTtsAudio(cleanedText, cacheKey),
                waitForAbort(abortController.signal),
            ]);

            if (!mountedRef.current || requestIdRef.current !== requestId || text.trim() !== cleanedText) {
                return null;
            }

            if (!objectUrl) {
                return null;
            }

            if (objectUrlRef.current && !audioSourceIsCachedRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
            }

            objectUrlRef.current = objectUrl;
            audioSourceIsCachedRef.current = Boolean(lessonTtsCache.get(cacheKey));
            preparedTextRef.current = cleanedText;
            audio.src = objectUrl;

            return objectUrl;
        } catch (fetchError) {
            if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
                return null;
            }
            const message =
                fetchError instanceof Error ? fetchError.message : 'Could not generate lesson audio.';
            if (mountedRef.current && requestIdRef.current === requestId) {
                setError(message);
            }
            return null;
        } finally {
            if (mountedRef.current && requestIdRef.current === requestId) {
                setIsLoading(false);
            }
        }
    }, [options.cacheKey, prefetchedAudioUrl, text]);

    const play = useCallback(async () => {
        const audio = audioRef.current;
        if (!audio || !text.trim()) return;

        const objectUrl = await ensureAudio();
        if (!objectUrl) return;

        try {
            if (activeLessonAudio && activeLessonAudio !== audio) {
                pauseAudio(activeLessonAudio);
            }
            activeLessonAudio = audio;
            await audio.play();
        } catch (playError) {
            const message =
                playError instanceof Error ? playError.message : 'Audio playback could not start.';
            setError(message);
            setIsPlaying(false);
        }
    }, [ensureAudio, text]);

    const togglePlayback = useCallback(async () => {
        const audio = audioRef.current;
        if (!audio || !text.trim()) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
            return;
        }

        await play();
    }, [isPlaying, play, text]);

    const replay = useCallback(async () => {
        const audio = audioRef.current;
        if (!audio || !text.trim()) return;

        pauseAudio(audio);
        setIsPlaying(false);
        await play();
    }, [play, text]);

    useEffect(() => {
        if (typeof Audio === 'undefined') return undefined;

        mountedRef.current = true;
        const audio = new Audio();
        audio.preload = 'none';
        audioRef.current = audio;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);

        return () => {
            mountedRef.current = false;
            requestIdRef.current += 1;
            abortControllerRef.current?.abort();
            abortControllerRef.current = null;
            pauseAudio(audio);
            if (activeLessonAudio === audio) {
                activeLessonAudio = null;
            }
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
            audio.removeAttribute('src');
            audio.load();
            audioRef.current = null;
        };
    }, []);

    useEffect(() => {
        releaseAudio();
        return () => {
            requestIdRef.current += 1;
            abortControllerRef.current?.abort();
            abortControllerRef.current = null;
            if (objectUrlRef.current) {
                if (!audioSourceIsCachedRef.current) {
                    URL.revokeObjectURL(objectUrlRef.current);
                }
                objectUrlRef.current = null;
            }
            audioSourceIsCachedRef.current = false;
        };
    }, [prefetchedAudioUrl, releaseAudio, text]);

    useEffect(() => {
        if (!autoPlay || !text.trim()) return undefined;

        const timeoutId = window.setTimeout(() => {
            void replay();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
            stop();
        };
    }, [autoPlay, replay, stop, text]);

    return {
        isLoading,
        isPlaying,
        error,
        togglePlayback,
        replay,
        stop,
    };
}
