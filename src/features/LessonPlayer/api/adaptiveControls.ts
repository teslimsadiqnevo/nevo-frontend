import type { LearningMode } from '@/shared/store/useRegistrationStore';
import type { RenderingPreferences, Stage } from './types';

export type ReorientationAlternative = {
    mode: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | string;
    label: string;
    text: string;
    ttsText: string;
};

type ReorientationResponse = {
    alternatives?: Array<{
        mode?: string;
        label?: string;
        text?: string;
        tts_text?: string;
    }>;
};

function backendMode(mode: LearningMode) {
    if (mode === 'audio') return 'auditory';
    if (mode === 'action') return 'kinesthetic';
    return mode;
}

function conceptTextForStage(stage: Stage, mode: LearningMode) {
    if (mode === 'audio') return stage.modes.audio.body;
    if (mode === 'action') return stage.modes.action.steps.map((step) => step.text).join(' ');
    if (mode === 'reading') return stage.modes.reading.definition;
    return stage.modes.visual.body;
}

function renderingPreferencesForStage(
    stage: Stage,
    mode: LearningMode,
): RenderingPreferences | undefined {
    if (mode === 'audio') return stage.modes.audio.renderingPreferences;
    if (mode === 'reading') return stage.modes.reading.renderingPreferences;
    return stage.modes.visual.renderingPreferences;
}

export async function fetchReorientationAlternatives(
    stage: Stage,
    mode: LearningMode,
): Promise<ReorientationAlternative[]> {
    const conceptText = conceptTextForStage(stage, mode);
    const response = await fetch('/api/content/reorientation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            concept_id: stage.modes.visual.conceptId || stage.key,
            concept_text: conceptText,
            tts_text: stage.modes.audio.spokenBody || conceptText,
            rendering_preferences: renderingPreferencesForStage(stage, mode),
            format_type: mode,
            learning_mode_delivered: backendMode(mode),
        }),
    });
    const payload = (await response.json().catch(() => ({}))) as ReorientationResponse;

    if (!response.ok) {
        throw new Error('Could not load reorientation options.');
    }

    return (payload.alternatives || [])
        .map((item) => ({
            mode: item.mode || 'reading',
            label: item.label || 'Try this way',
            text: item.text || '',
            ttsText: item.tts_text || item.text || '',
        }))
        .filter((item) => item.text);
}
