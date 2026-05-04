import type { LearningMode } from '@/shared/store/useRegistrationStore';
import {
    STAGE_ORDER,
    type LessonAssessmentData,
    type LessonCompletionData,
    type LessonMicroQuizQuestion,
    type LessonPlayerData,
    type LessonReorientationData,
    type LessonReflectionData,
    type Stage,
    type StageKey,
} from './types';

type BackendConceptStep = {
    step_number?: number;
    text?: string;
    step_text?: string;
};

type BackendConcept = {
    concept_id: string;
    concept_text: string;
    tts_text?: string;
    learning_mode_delivered?: string;
    image_url?: string | null;
    image_alt_text?: string | null;
    steps?: BackendConceptStep[] | null;
    contains_formal_representation?: boolean;
    formal_representation?: string | null;
    checkpoint_question: string;
    checkpoint_options: string[];
    checkpoint_answer: string;
    checkpoint_tts_text?: string;
    key_term?: string;
    difficulty_level?: number;
    estimated_read_time_seconds?: number;
};

type BackendLessonPayload = {
    lesson_title: string;
    adaptation_style: string;
    learning_mode_delivered?: string;
    adapt_automatically?: boolean;
    concepts: BackendConcept[];
    adapted_lesson_id: string;
    original_lesson_id: string;
};

const STAGE_LABELS: Record<
    StageKey,
    { pill: string; label: string; simple: string; expanded: string }
> = {
    observe: {
        pill: 'Observe',
        label: 'OBSERVE - FIRST LOOK',
        simple: 'OBSERVE - FIRST LOOK',
        expanded: 'OBSERVE - FULL EXPLANATION',
    },
    notice: {
        pill: 'Notice',
        label: 'NOTICE - WHAT CHANGES?',
        simple: 'NOTICE - WHAT STANDS OUT?',
        expanded: 'NOTICE - WHAT MATTERS MOST?',
    },
    relate: {
        pill: 'Relate',
        label: 'RELATE - CONNECT IT',
        simple: 'RELATE - MAKE IT FAMILIAR',
        expanded: 'RELATE - DEEPER CONNECTION',
    },
    predict: {
        pill: 'Predict',
        label: 'PREDICT - WHAT HAPPENS NEXT?',
        simple: 'PREDICT - TAKE A GUESS',
        expanded: 'PREDICT - USE YOUR REASONING',
    },
    confirm: {
        pill: 'Confirm',
        label: 'CONFIRM - WHAT DID YOU LEARN?',
        simple: 'CONFIRM - KEY IDEA',
        expanded: 'CONFIRM - CHECK YOUR UNDERSTANDING',
    },
};

function normalizeLearningMode(mode?: string | null): LearningMode {
    const value = String(mode || '').toLowerCase();
    if (value.includes('audio')) return 'audio';
    if (value.includes('action') || value.includes('kinesthetic')) return 'action';
    if (value.includes('read')) return 'reading';
    return 'visual';
}

function splitIntoSentences(text: string) {
    return text
        .split(/(?<=[.!?])\s+/)
        .map((part) => part.trim())
        .filter(Boolean);
}

function simplifyText(text: string) {
    return splitIntoSentences(text).slice(0, 2).join(' ');
}

function expandText(text: string, concept: BackendConcept) {
    const pieces = [text];
    if (concept.key_term) {
        pieces.push(`Key term: ${concept.key_term}.`);
    }
    if (concept.contains_formal_representation && concept.formal_representation) {
        pieces.push(`Formal representation: ${concept.formal_representation}`);
    }
    return pieces.join(' ');
}

function buildActionSteps(concept: BackendConcept) {
    const sourceSteps =
        Array.isArray(concept.steps) && concept.steps.length > 0
            ? concept.steps.map(
                (step, index) => step.text?.trim() || step.step_text?.trim() || `Step ${index + 1}`,
            )
            : splitIntoSentences(concept.concept_text).slice(0, 4);

    const fallbackSteps =
        sourceSteps.length > 0
            ? sourceSteps
            : ['Read the idea once.', 'Say it in your own words.', 'Check what happens next.'];

    return fallbackSteps.map((text, index) => ({
        text,
        state: index === 0 ? 'active' : 'unread',
    })) as Array<{ text: string; state: 'unread' | 'active' | 'completed' }>;
}

function buildSlowerSteps(concept: BackendConcept) {
    const steps = buildActionSteps(concept);
    return steps.map((step, index) => ({
        stepNumber: index + 1,
        text: step.text,
        ttsText: step.text,
        isLastStep: index === steps.length - 1,
    }));
}

function resolveCorrectOptionId(concept: BackendConcept) {
    const answer = String(concept.checkpoint_answer || '').trim();
    if (!answer) return 'option-0';

    const alphaIndex = answer.toUpperCase().charCodeAt(0) - 65;
    if (alphaIndex >= 0 && alphaIndex < concept.checkpoint_options.length) {
        return `option-${alphaIndex}`;
    }

    const directIndex = concept.checkpoint_options.findIndex(
        (option) => option.trim().toLowerCase() === answer.toLowerCase(),
    );
    return directIndex >= 0 ? `option-${directIndex}` : 'option-0';
}

function buildStage(stageKey: StageKey, concept: BackendConcept): Stage {
    const labels = STAGE_LABELS[stageKey];
    const visualBody = concept.concept_text;
    const audioBody = concept.tts_text || concept.concept_text;
    const simplified = simplifyText(concept.concept_text);
    const expanded = expandText(concept.concept_text, concept);
    const actionSteps = buildActionSteps(concept);

    return {
        key: stageKey,
        pillText: labels.pill,
        label: labels.label,
        labelSimplified: labels.simple,
        labelExpanded: labels.expanded,
        modes: {
            visual: {
                imageUrl: concept.image_url || '',
                body: visualBody,
                bodySimplified: simplified,
                bodyExpanded: expanded,
            },
            audio: {
                audioUrl: '',
                body: audioBody,
                bodySimplified: simplifyText(audioBody),
                bodyExpanded: expandText(audioBody, concept),
            },
            action: {
                steps: actionSteps,
                stepsSimplified: actionSteps.slice(0, Math.max(1, Math.min(2, actionSteps.length))),
                stepsExpanded: actionSteps,
            },
            reading: {
                keyTermLabel: labels.label,
                keyTerm: concept.key_term || 'Key idea',
                definition: concept.concept_text,
                definitionSimplified: simplified,
                definitionExpanded: expanded,
                formula: concept.contains_formal_representation ? concept.formal_representation || undefined : undefined,
                formulaExpanded: concept.contains_formal_representation ? concept.formal_representation || undefined : undefined,
            },
        },
        slowerSteps: buildSlowerSteps(concept),
    };
}

function buildReflection(title: string): LessonReflectionData {
    return {
        title: 'Still with us?',
        description: `If ${title} still feels unclear, tell Nevo what kind of support you need next.`,
        options: [
            { id: 'thinking', label: "I'm thinking it through" },
            { id: 'simpler', label: 'I need a simpler explanation' },
            { id: 'move-on', label: "I'd like to move on" },
        ],
    };
}

function buildReorientation(mode: LearningMode): LessonReorientationData {
    return {
        title: "Let's try a different approach.",
        description: `Nevo can shift this lesson into another mode if ${mode} is not helping enough right now.`,
        options: [
            {
                id: 'action',
                title: 'Try the hands-on version',
                description: 'Break the idea into active, guided steps.',
                icon: 'hands',
            },
            {
                id: 'visual',
                title: 'See a visual version',
                description: 'Use a clearer picture-led explanation instead.',
                icon: 'image',
            },
            {
                id: 'skip',
                title: 'Skip for now and come back',
                description: 'Move forward and revisit this concept later.',
                icon: 'bookmark',
            },
        ],
        ctaLabel: 'Ask Nevo for help',
    };
}

function buildAssessment(firstConcept: BackendConcept): LessonAssessmentData {
    const correctOptionId = resolveCorrectOptionId(firstConcept);
    const optionLabels = firstConcept.checkpoint_options.length
        ? firstConcept.checkpoint_options
        : ['Option A', 'Option B'];

    const question = {
        prompt: firstConcept.checkpoint_question,
        helperLabel: firstConcept.checkpoint_tts_text ? 'Tap to replay' : undefined,
        options: optionLabels.map((option, index) => ({
            id: `option-${index}`,
            label: option,
            icon: 'speaker' as const,
        })),
        correctOptionId,
        explanation: firstConcept.concept_text,
    };

    return {
        promptByVariant: {
            visual: firstConcept.checkpoint_question,
            audio: firstConcept.checkpoint_question,
            action: firstConcept.checkpoint_question,
            reading: firstConcept.checkpoint_question,
            kids: firstConcept.checkpoint_question,
        },
        helperLabelByVariant: firstConcept.checkpoint_tts_text
            ? {
                audio: 'Tap to replay',
                kids: 'Listen',
            }
            : undefined,
        questionByVariant: {
            visual: question,
            audio: question,
            action: question,
            reading: question,
            kids: question,
        },
        submitLabel: 'Check answer',
        helperText: 'Choose one answer to continue.',
        feedback: {
            correct: {
                heading: 'You got it.',
                description: firstConcept.concept_text,
                ctaLabel: 'Continue',
                footerLabel: 'Understood clearly',
            },
            incorrect: {
                heading: "Let's look at it another way.",
                description: simplifyText(firstConcept.concept_text) || firstConcept.concept_text,
                primaryCtaLabel: 'Try again',
                secondaryCtaLabel: 'Move on',
                footerLabel: 'You can revisit this concept later.',
            },
            correction: {
                userAnswerLabel: 'Your answer',
                answerLabel: 'Correct answer',
                description: firstConcept.concept_text,
                ctaLabel: 'Continue',
            },
        },
    };
}

function buildMicroQuiz(concepts: BackendConcept[]): LessonMicroQuizQuestion[] {
    const sourceConcepts = concepts.slice(0, 3);
    return sourceConcepts.map((concept, index) => ({
        prompt: concept.checkpoint_question,
        progressLabel: `Question ${index + 1} of ${sourceConcepts.length}`,
        progressPercent: ((index + 1) / sourceConcepts.length) * 100,
        options: concept.checkpoint_options.map((option, optionIndex) => ({
            id: `option-${optionIndex}`,
            label: option,
        })),
        correctOptionId: resolveCorrectOptionId(concept),
        explanation: concept.concept_text,
        continueLabel: index < sourceConcepts.length - 1 ? 'Next question' : 'Finish quiz',
        retryLabel: 'Try again',
        feedbackPrompts: [
            {
                heading: 'This part can be tricky.',
                description: 'Want to try a different explanation?',
                primaryCtaLabel: "Yes, let's go",
                secondaryCtaLabel: "I'm fine, keep going",
            },
            {
                heading: "You've revisited this concept a few times.",
                description: 'A simpler explanation might help.',
                primaryCtaLabel: 'Show me a simpler version',
                secondaryCtaLabel: 'I understand, continue',
            },
            {
                heading: "Here's a clue.",
                description: '',
                primaryCtaLabel: 'Got it',
                secondaryCtaLabel: 'I need a different answer',
                hintLabel: simplifyText(concept.concept_text) || concept.concept_text,
            },
        ],
    }));
}

function buildCompletion(payload: BackendLessonPayload, concepts: BackendConcept[], mode: LearningMode): LessonCompletionData {
    return {
        badgeLabel: payload.learning_mode_delivered || 'Adaptive lesson',
        heading: payload.lesson_title,
        completedAtLabel: `Completed ${new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })}`,
        metrics: [
            {
                value: String(concepts.length),
                label: 'Concepts',
                description: '',
            },
            {
                value: String(concepts.filter((concept) => concept.contains_formal_representation).length),
                label: 'Formal links',
                description: '',
                accent: 'indigo',
            },
            {
                value: `${Math.min(3, concepts.length)} quiz checks`,
                label: 'Quick checks',
                description: '',
            },
        ],
        conceptResults: concepts.map((concept) => ({
            label: concept.key_term || concept.concept_text.slice(0, 48),
            status:
                Number(concept.difficulty_level || 1) >= 4
                    ? 'needed_more_time'
                    : concept.contains_formal_representation
                        ? 'simplified'
                        : 'understood',
        })),
        modeSummary: {
            title: `You learned this in ${mode} mode.`,
            description: payload.adaptation_style,
        },
        assessmentCtaLabel: 'Take assessment',
        browseCtaLabel: 'Back to lessons',
        closeLabel: 'Back to lessons',
    };
}

function adaptLessonPayload(payload: BackendLessonPayload): LessonPlayerData {
    const recommendedMode = normalizeLearningMode(payload.learning_mode_delivered);
    const sourceConcepts = Array.isArray(payload.concepts) && payload.concepts.length > 0
        ? payload.concepts
        : [
            {
                concept_id: 'fallback-1',
                concept_text: payload.adaptation_style || payload.lesson_title,
                checkpoint_question: 'What is the main idea of this lesson?',
                checkpoint_options: ['The main lesson idea'],
                checkpoint_answer: 'A',
                key_term: payload.lesson_title,
            },
        ];

    const stageConcepts = [...sourceConcepts];
    while (stageConcepts.length < STAGE_ORDER.length) {
        stageConcepts.push(stageConcepts[stageConcepts.length - 1]);
    }

    const stages = STAGE_ORDER.map((stageKey, index) =>
        buildStage(stageKey, stageConcepts[index]),
    );

    return {
        id: payload.adapted_lesson_id || payload.original_lesson_id,
        title: payload.lesson_title,
        subject: payload.lesson_title,
        topic: sourceConcepts[0]?.key_term || payload.lesson_title,
        recommendedMode,
        adaptAutomatically: payload.adapt_automatically ?? true,
        reflection: buildReflection(payload.lesson_title),
        reorientation: buildReorientation(recommendedMode),
        start: {
            eyebrow: 'Lesson',
            title: payload.lesson_title,
            subtitle: payload.adaptation_style,
            durationLabel: `${Math.max(
                5,
                Math.round(
                    sourceConcepts.reduce(
                        (total, concept) => total + Number(concept.estimated_read_time_seconds || 20),
                        0,
                    ) / 60,
                ),
            )} minutes`,
            conceptsLabel: `${sourceConcepts.length} concepts`,
            modeLabel: `Best in ${recommendedMode}`,
            cards: {
                visual: {
                    kind: 'image',
                    title: 'See the concept clearly',
                    detail: simplifyText(sourceConcepts[0].concept_text) || sourceConcepts[0].concept_text,
                    imageUrl: sourceConcepts[0].image_url || '',
                },
                audio: {
                    kind: 'audio',
                    title: 'Hear the concept explained',
                    detail: simplifyText(sourceConcepts[0].tts_text || sourceConcepts[0].concept_text),
                },
                action: {
                    kind: 'action',
                    title: 'Work through guided steps',
                    detail: buildActionSteps(sourceConcepts[0])[0]?.text || 'Follow the next step.',
                },
                reading: {
                    kind: 'reading',
                    title: 'Read the key idea first',
                    detail: simplifyText(sourceConcepts[0].concept_text) || sourceConcepts[0].concept_text,
                },
            },
            primaryCta: 'Begin lesson',
            secondaryCta: 'Skip intro',
        },
        breakStates: {
            quick: {
                heading: "You've been learning for a while.",
                subheading: 'Take a quick reset.',
                durationLabel: 'Break for 1 min',
                primaryCta: "I'm ready to continue",
                secondaryCta: 'Take a longer break',
            },
            long: {
                heading: "You've been learning for a while.",
                subheading: 'Take a proper reset.',
                durationLabel: 'Break for 3 min',
                primaryCta: "I'm ready to continue",
                secondaryCta: 'Take a quick break',
            },
        },
        completion: buildCompletion(payload, sourceConcepts, recommendedMode),
        assessment: buildAssessment(sourceConcepts[0]),
        microQuiz: buildMicroQuiz(sourceConcepts),
        stages,
    };
}

export async function getLessonPlayer(lessonId: string): Promise<LessonPlayerData> {
    const res = await fetch(`/api/lessons/${lessonId}/play`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(
            typeof data?.detail === 'string' ? data.detail : 'Failed to load lesson.',
        );
    }

    return adaptLessonPayload(data as BackendLessonPayload);
}
