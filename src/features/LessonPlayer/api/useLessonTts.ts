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

type TtsResponseBody = {
    detail?: string;
    message?: string;
    error?: string;
};

function buildErrorMessage(payload: TtsResponseBody | null, fallback: string) {
    if (!payload) return fallback;
    if (typeof payload.detail === 'string') return payload.detail;
    if (typeof payload.message === 'string') return payload.message;
    if (typeof payload.error === 'string') return payload.error;
    return fallback;
}

export function useLessonTts(text: string, prefetchedAudioUrl?: string | null): LessonTtsState {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const objectUrlRef = useRef<string | null>(null);
    const preparedTextRef = useRef<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const stop = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
    }, []);

    const releaseAudio = useCallback(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
        }

        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }

        preparedTextRef.current = '';
        setIsPlaying(false);
        setIsLoading(false);
        setError(null);
    }, []);

    const ensureAudio = useCallback(async () => {
        const cleanedText = text.trim();
        const audio = audioRef.current;

        if (!audio || !cleanedText) {
            return null;
        }

        if (prefetchedAudioUrl && preparedTextRef.current === cleanedText && audio.src === prefetchedAudioUrl) {
            return prefetchedAudioUrl;
        }

        if (prefetchedAudioUrl) {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }

            preparedTextRef.current = cleanedText;
            audio.src = prefetchedAudioUrl;
            return prefetchedAudioUrl;
        }

        if (objectUrlRef.current && preparedTextRef.current === cleanedText) {
            return objectUrlRef.current;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: cleanedText,
                }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                throw new Error(buildErrorMessage(payload, 'Could not generate lesson audio.'));
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
            }

            objectUrlRef.current = objectUrl;
            preparedTextRef.current = cleanedText;
            audio.src = objectUrl;

            return objectUrl;
        } catch (fetchError) {
            const message =
                fetchError instanceof Error ? fetchError.message : 'Could not generate lesson audio.';
            setError(message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [prefetchedAudioUrl, text]);

    const play = useCallback(async () => {
        const audio = audioRef.current;
        if (!audio || !text.trim()) return;

        const objectUrl = await ensureAudio();
        if (!objectUrl) return;

        try {
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

        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
        await play();
    }, [play, text]);

    useEffect(() => {
        if (typeof Audio === 'undefined') return undefined;

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
            audio.pause();
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
            audioRef.current = null;
        };
    }, []);

    useEffect(() => {
        releaseAudio();
        return () => {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }
        };
    }, [prefetchedAudioUrl, releaseAudio, text]);

    return {
        isLoading,
        isPlaying,
        error,
        togglePlayback,
        replay,
        stop,
    };
}
