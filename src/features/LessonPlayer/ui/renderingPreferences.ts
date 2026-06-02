import type { CSSProperties } from 'react';
import type { RenderingPreferences } from '../api/types';

function safeSpacing(value?: string) {
    if (!value || value === 'normal') return undefined;
    if (value === 'wide') return '0.015em';
    if (value === 'wider') return '0.02em';
    if (/^0(?:\.0?[0-2])?em$/.test(value)) return value;
    return undefined;
}

function safeLineHeight(value?: number) {
    if (!value || !Number.isFinite(value)) return undefined;
    return Math.min(1.85, Math.max(1.45, value));
}

export function getRenderingPreferenceStyle(
    preferences?: RenderingPreferences,
): CSSProperties {
    if (!preferences) return {};

    return {
        fontFamily: 'var(--font-inter)',
        letterSpacing: safeSpacing(preferences.letterSpacing),
        lineHeight: safeLineHeight(preferences.lineHeight),
        wordSpacing: safeSpacing(preferences.wordSpacing),
        fontSize: preferences.fontSizeBoost ? '1.08em' : undefined,
        textAlign: 'left',
        maxWidth: preferences.maxLineWidth || undefined,
    };
}
