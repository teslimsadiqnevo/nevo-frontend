import type { LearningMode } from '@/shared/store/useRegistrationStore';
import {
    getStoredOfflineLessonPackage,
    type OfflineLessonContentBlock,
} from '@/features/Dashboard/lib/offlineLessons';
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
    image_fetch_status?: 'pending' | 'resolved' | 'failed' | string | null;
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

type OfflineLessonPayload = {
    lesson_id: string;
    title: string;
    subject?: string | null;
    topic?: string | null;
    version_hash: string;
    estimated_size_bytes: number;
    content_blocks: OfflineLessonContentBlock[];
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
    const value = String(mode || '')
        .toLowerCase()
        .replace(/[_-]+/g, ' ');

    if (/(audio|auditory|aural|listen|listening|hear|hearing|spoken|voice)/.test(value)) {
        return 'audio';
    }

    if (/(action|kinesthetic|kinaesthetic|hands on|hands-on|doing|movement|practical|tactile)/.test(value)) {
        return 'action';
    }

    if (/(read|reading|write|writing|text|notes|verbal|literacy)/.test(value)) {
        return 'reading';
    }

    return 'visual';
}

function splitIntoSentences(text: string) {
    return text
        .split(/(?<=[.!?])\s+/)
        .map((part) => part.trim())
        .filter(Boolean);
}

function removeFormalNoise(text: string) {
    return text
        .replace(/\([^)]*\)/g, '')
        .replace(/\b(?:therefore|however|moreover|thus|hence|consequently)\b[:,]?/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function simplifyText(text: string) {
    const cleaned = removeFormalNoise(text);
    const sentences = splitIntoSentences(cleaned);
    const firstSentence = sentences[0] || cleaned;
    const secondSentence = sentences[1] || '';
    const pieces = [
        ensureSentence(`Here is the simple version`),
        ensureSentence(firstSentence),
    ];

    if (secondSentence) {
        pieces.push(ensureSentence(`What this means is ${toPlainPhrase(secondSentence)}`));
    }

    return pieces.filter(Boolean).join(' ');
}

function ensureSentence(text: string) {
    const value = text.trim();
    if (!value) return '';
    return /[.!?]$/.test(value) ? value : `${value}.`;
}

function toPlainPhrase(text: string) {
    return text
        .trim()
        .replace(/^[A-Z]/, (char) => char.toLowerCase())
        .replace(/[.!?]+$/, '');
}

function expandText(text: string, concept: BackendConcept) {
    const sentences = splitIntoSentences(text);
    const firstSentence = sentences[0] || text;
    const simplified = simplifyText(text) || text;
    const pieces = [
        ensureSentence(`Let's slow this down and make it easier to picture`),
        ensureSentence(simplified),
        ensureSentence(`In a fuller way, ${toPlainPhrase(firstSentence)}`),
    ];

    if (sentences.length > 1) {
        pieces.push(
            ensureSentence(
                `Another important part is that ${toPlainPhrase(sentences.slice(1).join(' '))}`,
            ),
        );
    }

    if (concept.key_term) {
        pieces.push(
            ensureSentence(
                `${concept.key_term} is the key idea to pay attention to here`,
            ),
        );
    }
    if (concept.contains_formal_representation && concept.formal_representation) {
        pieces.push(
            ensureSentence(
                `If you see it written in a formal way, it may look like this: ${concept.formal_representation}`,
            ),
        );
    }
    return pieces.filter(Boolean).join(' ');
}

function expandActionSteps(steps: Array<{ text: string; state: 'unread' | 'active' | 'completed' }>) {
    return steps.map((step) => ({
        ...step,
        text: `${ensureSentence(step.text)} ${ensureSentence(
            `Take your time with this part and make sure it makes sense before you move on`,
        )}`,
    }));
}

function simplifyActionSteps(steps: Array<{ text: string; state: 'unread' | 'active' | 'completed' }>) {
    return steps.slice(0, Math.max(1, Math.min(2, steps.length))).map((step) => ({
        ...step,
        text: simplifyText(step.text),
    }));
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
                conceptId: concept.concept_id,
                imageUrl: concept.image_url || '',
                imageAltText: concept.image_alt_text || undefined,
                imageFetchStatus:
                    concept.image_fetch_status === 'pending' ||
                    concept.image_fetch_status === 'resolved' ||
                    concept.image_fetch_status === 'failed'
                        ? concept.image_fetch_status
                        : concept.image_url
                          ? 'resolved'
                          : 'failed',
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
                stepsSimplified: simplifyActionSteps(actionSteps),
                stepsExpanded: expandActionSteps(actionSteps),
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

function coerceOfflineConcept(
    block: OfflineLessonContentBlock,
    index: number,
    fallbackTitle: string,
): BackendConcept | null {
    const conceptText =
        (typeof block.concept_text === 'string' && block.concept_text.trim()) ||
        (typeof block.content === 'string' && block.content.trim()) ||
        (typeof block.text === 'string' && block.text.trim()) ||
        (typeof block.body === 'string' && block.body.trim()) ||
        '';

    if (!conceptText) return null;

    const options = Array.isArray(block.checkpoint_options)
        ? block.checkpoint_options.filter((option): option is string => typeof option === 'string' && option.trim().length > 0)
        : [];

    return {
        concept_id:
            (typeof block.concept_id === 'string' && block.concept_id.trim()) ||
            `offline-concept-${index + 1}`,
        concept_text: conceptText,
        tts_text:
            typeof block.tts_text === 'string' && block.tts_text.trim()
                ? block.tts_text
                : conceptText,
        learning_mode_delivered:
            typeof block.learning_mode_delivered === 'string' ? block.learning_mode_delivered : undefined,
        image_url:
            (typeof block.image_url === 'string' && block.image_url) ||
            (typeof block.media_url === 'string' && block.media_url) ||
            (typeof block.url === 'string' && block.url) ||
            (typeof block.ai_generated_url === 'string' && block.ai_generated_url) ||
            null,
        image_alt_text:
            typeof block.image_alt_text === 'string' ? block.image_alt_text : null,
        image_fetch_status:
            typeof block.image_url === 'string' ||
            typeof block.media_url === 'string' ||
            typeof block.url === 'string' ||
            typeof block.ai_generated_url === 'string'
                ? 'resolved'
                : 'failed',
        steps: Array.isArray(block.steps)
            ? block.steps.reduce<BackendConceptStep[]>((acc, step, stepIndex) => {
                  if (typeof step === 'string' && step.trim()) {
                      acc.push({ step_number: stepIndex + 1, text: step.trim() });
                      return acc;
                  }
                  if (step && typeof step === 'object') {
                      const stepRecord = step as Record<string, unknown>;
                      const stepText =
                          (typeof stepRecord.text === 'string' && stepRecord.text.trim()) ||
                          (typeof stepRecord.step_text === 'string' && stepRecord.step_text.trim()) ||
                          '';
                      if (stepText) {
                          acc.push({
                              step_number: Number(stepRecord.step_number ?? stepIndex + 1),
                              text: stepText,
                          });
                      }
                  }
                  return acc;
              }, [])
            : null,
        contains_formal_representation: typeof block.formal_representation === 'string',
        formal_representation:
            typeof block.formal_representation === 'string' ? block.formal_representation : null,
        checkpoint_question:
            (typeof block.checkpoint_question === 'string' && block.checkpoint_question.trim()) ||
            `What is the main idea of ${fallbackTitle}?`,
        checkpoint_options: options.length > 0 ? options : ['I understand the idea', 'I need more help'],
        checkpoint_answer:
            (typeof block.checkpoint_answer === 'string' && block.checkpoint_answer.trim()) || 'A',
        checkpoint_tts_text:
            typeof block.checkpoint_tts_text === 'string' ? block.checkpoint_tts_text : undefined,
        key_term:
            (typeof block.key_term === 'string' && block.key_term.trim()) ||
            fallbackTitle,
        difficulty_level: Number(block.difficulty_level ?? 1),
        estimated_read_time_seconds: Number(block.estimated_read_time_seconds ?? 20),
    };
}

function adaptOfflineLessonPayload(payload: OfflineLessonPayload): LessonPlayerData {
    const concepts =
        Array.isArray(payload.content_blocks) && payload.content_blocks.length > 0
            ? payload.content_blocks
                  .map((block, index) => coerceOfflineConcept(block, index, payload.title))
                  .filter((concept): concept is BackendConcept => concept !== null)
            : [];

    const adaptedPayload: BackendLessonPayload = {
        lesson_title: payload.title,
        adaptation_style: `Offline lesson package${payload.topic ? ` • ${payload.topic}` : ''}`,
        learning_mode_delivered: 'visual',
        adapt_automatically: true,
        concepts,
        adapted_lesson_id: payload.lesson_id,
        original_lesson_id: payload.lesson_id,
    };

    const adapted = adaptLessonPayload(adaptedPayload);
    return {
        ...adapted,
        subject: payload.subject || adapted.subject,
        topic: payload.topic || adapted.topic,
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
        originalLessonId: payload.original_lesson_id,
        adaptedLessonId: payload.adapted_lesson_id,
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
    const offlinePackage = await getStoredOfflineLessonPackage(lessonId);

    if (typeof navigator !== 'undefined' && navigator.onLine === false && offlinePackage) {
        return adaptOfflineLessonPayload(offlinePackage);
    }

    try {
        const res = await fetch(`/api/lessons/${lessonId}/play`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            if (offlinePackage) {
                return adaptOfflineLessonPayload(offlinePackage);
            }
            throw new Error(
                typeof data?.detail === 'string' ? data.detail : 'Failed to load lesson.',
            );
        }

        return adaptLessonPayload(data as BackendLessonPayload);
    } catch (error) {
        if (offlinePackage) {
            return adaptOfflineLessonPayload(offlinePackage);
        }
        throw error;
    }
}
