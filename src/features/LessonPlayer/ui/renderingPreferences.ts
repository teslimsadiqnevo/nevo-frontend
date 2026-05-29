import type { CSSProperties } from 'react';
import type { RenderingPreferences } from '../api/types';

export function getRenderingPreferenceStyle(
    preferences?: RenderingPreferences,
): CSSProperties {
    if (!preferences) return {};

    return {
        letterSpacing: preferences.letterSpacing || undefined,
        lineHeight: preferences.lineHeight || undefined,
        wordSpacing: preferences.wordSpacing || undefined,
        fontSize: preferences.fontSizeBoost ? '1.08em' : undefined,
        textAlign: 'left',
        maxWidth: preferences.maxLineWidth || undefined,
    };
}
