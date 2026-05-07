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
    type StagePhaseKey,
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
    StagePhaseKey,
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

type StageBlueprint = {
    key: StageKey;
    phase: StagePhaseKey;
    concept: BackendConcept;
    stepText: string;
    audioStepText: string;
    moduleNumber: number;
    moduleStepNumber: number;
    totalModuleSteps: number;
    overallStepNumber: number;
    totalOverallSteps: number;
};

type ModuleBlueprint = {
    moduleNumber: number;
    stages: StageBlueprint[];
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

function removeVisualFiller(text: string) {
    return text
        .replace(/^(?:now,\s*)?picture\s+this(?:\s+while\s+you\s+hear\s+it)?[:.,]?\s*/i, '')
        .replace(/^picture\s+it\s+this\s+way[:.,]?\s*/i, '')
        .replace(/^imagine\s+this[:.,]?\s*/i, '')
        .replace(/^imagine\s+/i, '')
        .replace(/^here\s+is\s+what\s+to\s+picture\s+and\s+hear[:.,]?\s*/i, '')
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

function getWordCount(text: string) {
    return text
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
}

function splitLongSentence(sentence: string) {
    const clauses = sentence
        .split(/(?<=[,;:])\s+/)
        .map((part) => part.trim())
        .filter(Boolean);

    if (clauses.length <= 1) {
        return [sentence.trim()];
    }

    return clauses;
}

function createStepChunksFromText(text: string, targetWordCount: number) {
    const normalizedTarget = Math.max(18, targetWordCount);
    const sourceSentences = splitIntoSentences(text)
        .flatMap((sentence) => {
            if (getWordCount(sentence) > normalizedTarget * 1.6) {
                return splitLongSentence(sentence);
            }
            return [sentence];
        })
        .filter(Boolean);

    if (sourceSentences.length === 0) {
        return [text];
    }

    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentCount = 0;

    sourceSentences.forEach((sentence) => {
        const sentenceCount = getWordCount(sentence);

        if (currentChunk.length > 0 && currentCount + sentenceCount > normalizedTarget) {
            chunks.push(currentChunk.join(' ').trim());
            currentChunk = [sentence];
            currentCount = sentenceCount;
            return;
        }

        currentChunk.push(sentence);
        currentCount += sentenceCount;
    });

    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' ').trim());
    }

    return chunks.filter(Boolean);
}

function expandText(text: string, concept: BackendConcept) {
    const sentences = splitIntoSentences(text);
    const firstSentence = sentences[0] || text;
    const simplified = simplifyText(text) || text;
    const pieces = [
        ensureSentence(`Let's slow this down and make it clearer`),
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

function chunkArray<T>(items: T[], size: number) {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
}

function buildConceptStepTexts(concept: BackendConcept) {
    const sourceSteps =
        Array.isArray(concept.steps) && concept.steps.length > 0
            ? concept.steps
                  .map((step, index) => step.text?.trim() || step.step_text?.trim() || `Step ${index + 1}`)
                  .filter(Boolean)
            : [];

    if (sourceSteps.length > 0) {
        return sourceSteps;
    }

    if (!concept.concept_text.trim()) {
        return [concept.concept_text];
    }

    const estimatedSeconds = Math.max(20, Number(concept.estimated_read_time_seconds || 20));
    const targetWordCount =
        estimatedSeconds >= 120 ? 44 : estimatedSeconds >= 60 ? 34 : 26;
    const chunks = createStepChunksFromText(concept.concept_text, targetWordCount);
    return chunks.length > 0 ? chunks : [concept.concept_text];
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

function alignTextChunksToCount(text: string, targetCount: number, fallbacks: string[]) {
    const normalizedTargetCount = Math.max(1, targetCount);
    const cleanedText = text.trim();

    if (!cleanedText) {
        return fallbacks.slice(0, normalizedTargetCount);
    }

    if (normalizedTargetCount === 1) {
        return [cleanedText];
    }

    const totalWords = Math.max(1, getWordCount(cleanedText));
    let chunks = createStepChunksFromText(cleanedText, Math.max(12, Math.ceil(totalWords / normalizedTargetCount)));

    while (chunks.length > normalizedTargetCount) {
        const lastChunk = chunks.pop();
        if (!lastChunk || chunks.length === 0) {
            break;
        }
        chunks[chunks.length - 1] = `${chunks[chunks.length - 1]} ${lastChunk}`.trim();
    }

    while (chunks.length < normalizedTargetCount) {
        const longestIndex = chunks.reduce((bestIndex, current, index, all) => {
            return getWordCount(current) > getWordCount(all[bestIndex]) ? index : bestIndex;
        }, 0);
        const longestChunk = chunks[longestIndex];
        const parts = splitLongSentence(longestChunk);

        if (parts.length > 1) {
            const midpoint = Math.ceil(parts.length / 2);
            chunks.splice(longestIndex, 1, parts.slice(0, midpoint).join(' ').trim(), parts.slice(midpoint).join(' ').trim());
            continue;
        }

        break;
    }

    while (chunks.length < normalizedTargetCount) {
        const fallback = fallbacks[chunks.length] || chunks[chunks.length - 1] || cleanedText;
        chunks.push(fallback);
    }

    return chunks.slice(0, normalizedTargetCount);
}

function buildConceptAudioStepTexts(concept: BackendConcept, visualStepTexts: string[]) {
    const spokenSource =
        (typeof concept.tts_text === 'string' && concept.tts_text.trim()) ||
        concept.concept_text;

    if (!spokenSource.trim()) {
        return visualStepTexts;
    }

    return alignTextChunksToCount(spokenSource, Math.max(1, visualStepTexts.length), visualStepTexts);
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

function buildStage(blueprint: StageBlueprint): Stage {
    const { phase, concept } = blueprint;
    const labels = STAGE_LABELS[phase];
    const visualBody = removeVisualFiller(blueprint.stepText);
    const audioBody = blueprint.audioStepText;
    const simplified = removeVisualFiller(simplifyText(visualBody));
    const expanded = removeVisualFiller(expandText(visualBody, concept));
    const audioSimplified = simplifyText(audioBody);
    const audioExpanded = expandText(audioBody, concept);
    const scopedConcept = {
        ...concept,
        concept_text: visualBody,
        tts_text: blueprint.audioStepText,
    };
    const actionSteps = buildActionSteps(scopedConcept);

    return {
        key: blueprint.key,
        phase,
        moduleNumber: blueprint.moduleNumber,
        moduleStepNumber: blueprint.moduleStepNumber,
        totalModuleSteps: blueprint.totalModuleSteps,
        overallStepNumber: blueprint.overallStepNumber,
        totalOverallSteps: blueprint.totalOverallSteps,
        pillText: `Module ${blueprint.moduleNumber}`,
        label: `${labels.label} - STEP ${blueprint.overallStepNumber}`,
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
                bodySimplified: audioSimplified,
                bodyExpanded: audioExpanded,
                spokenBody: audioBody,
                spokenBodySimplified: audioSimplified,
                spokenBodyExpanded: audioExpanded,
            },
            action: {
                steps: actionSteps,
                stepsSimplified: simplifyActionSteps(actionSteps),
                stepsExpanded: expandActionSteps(actionSteps),
            },
            reading: {
                keyTermLabel: labels.label,
                keyTerm: concept.key_term || 'Key idea',
                definition: blueprint.stepText,
                definitionSimplified: simplified,
                definitionExpanded: expanded,
                formula: concept.contains_formal_representation ? concept.formal_representation || undefined : undefined,
                formulaExpanded: concept.contains_formal_representation ? concept.formal_representation || undefined : undefined,
            },
        },
        slowerSteps: buildSlowerSteps(scopedConcept),
    };
}

function buildStageBlueprints(concepts: BackendConcept[]) {
    const stepEntries = concepts.flatMap((concept) => {
        const stepTexts = buildConceptStepTexts(concept);
        const audioStepTexts = buildConceptAudioStepTexts(concept, stepTexts);

        return stepTexts.map((stepText, index) => ({
            concept,
            stepText,
            audioStepText: audioStepTexts[index] || stepText,
        }));
    });

    const totalOverallSteps = Math.max(1, stepEntries.length);
    const moduleChunks = chunkArray(stepEntries, 4);

    return moduleChunks.flatMap((moduleEntries, moduleIndex) =>
        moduleEntries.map((entry, entryIndex) => {
            const overallStepNumber = moduleIndex * 4 + entryIndex + 1;
            return {
                key: `step-${overallStepNumber}`,
                phase: STAGE_ORDER[(overallStepNumber - 1) % STAGE_ORDER.length],
                concept: entry.concept,
                stepText: entry.stepText,
                audioStepText: entry.audioStepText,
                moduleNumber: moduleIndex + 1,
                moduleStepNumber: entryIndex + 1,
                totalModuleSteps: moduleEntries.length,
                overallStepNumber,
                totalOverallSteps,
            } satisfies StageBlueprint;
        }),
    );
}

function buildModules(stageBlueprints: StageBlueprint[]) {
    return chunkArray(stageBlueprints, 4).map((stages, index) => ({
        moduleNumber: index + 1,
        stages,
    })) as ModuleBlueprint[];
}

function getModuleAnchorConcept(module: ModuleBlueprint) {
    return module.stages[module.stages.length - 1]?.concept ?? module.stages[0]?.concept;
}

function summarizeModule(module: ModuleBlueprint) {
    const moduleTexts = module.stages.map((stage) => stage.stepText).filter(Boolean);
    const summarySource = moduleTexts.slice(0, 2).join(' ');
    return simplifyText(summarySource) || summarySource;
}

function getAssessmentIcon(index: number) {
    const icons = ['sun', 'leaf', 'water', 'drop', 'speaker', 'seedling'] as const;
    return icons[index % icons.length];
}

function toSentenceCase(text: string) {
    const value = text.trim();
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function toLowerSentence(text: string) {
    const value = text.trim().replace(/[.!?]+$/, '');
    if (!value) return '';
    return value.charAt(0).toLowerCase() + value.slice(1);
}

function buildAssessmentCorrectSummary(module: ModuleBlueprint, concept: BackendConcept) {
    const topic = concept.key_term || 'this idea';
    const moduleSummary = summarizeModule(module) || concept.concept_text;
    const normalizedSummary = toLowerSentence(moduleSummary);
    return ensureSentence(`It means ${normalizedSummary} and connects back to ${topic}`);
}

function buildAssessmentDistractors(
    module: ModuleBlueprint,
    concept: BackendConcept,
    modules: ModuleBlueprint[],
) {
    const topic = concept.key_term || 'the topic';
    const otherModule = modules.find((candidate) => candidate.moduleNumber !== module.moduleNumber);
    const otherSummary = otherModule ? summarizeModule(otherModule) : '';

    const distractors = [
        ensureSentence(`It only asks you to memorize the word ${topic} without understanding it`),
        ensureSentence(`It means the opposite of what the module just explained about ${topic}`),
        otherSummary
            ? ensureSentence(`It is really about ${toLowerSentence(otherSummary)}`)
            : ensureSentence(`It is a different idea from another part of the lesson`),
    ];

    return distractors.filter(Boolean);
}

function buildAssessmentPrompt(
    variant: 'standard' | 'kids',
    mode: LearningMode | 'kids',
    moduleNumber: number,
) {
    if (variant === 'kids') {
        return `Module ${moduleNumber}: which answer best tells what this part was really teaching?`;
    }

    if (mode === 'audio') {
        return `After listening to Module ${moduleNumber}, which answer best explains the main meaning of that section?`;
    }

    if (mode === 'action') {
        return `After working through Module ${moduleNumber}, which answer best explains what those steps were teaching you?`;
    }

    if (mode === 'reading') {
        return `After reading Module ${moduleNumber}, which answer best captures the key idea from that section?`;
    }

    return `After Module ${moduleNumber}, which answer best explains the main idea from that section of the lesson?`;
}

function buildAssessmentQuestionsForVariant(
    modules: ModuleBlueprint[],
    variant: 'standard' | 'kids',
    mode: LearningMode | 'kids',
) {
    const totalQuestions = Math.max(1, modules.length);

    return modules.map((module, index) => {
        const anchorConcept = getModuleAnchorConcept(module);
        const correctLabel = buildAssessmentCorrectSummary(module, anchorConcept);
        const distractors = buildAssessmentDistractors(module, anchorConcept, modules);
        const optionLabels = [correctLabel, ...distractors].slice(0, 4);

        return {
            id: `module-assessment-${mode}-${module.moduleNumber}`,
            moduleNumber: module.moduleNumber,
            questionNumber: index + 1,
            totalQuestions,
            prompt: buildAssessmentPrompt(variant, mode, module.moduleNumber),
            spokenPrompt:
                (typeof anchorConcept?.checkpoint_tts_text === 'string' && anchorConcept.checkpoint_tts_text.trim()) ||
                undefined,
            helperLabel:
                (typeof anchorConcept?.checkpoint_tts_text === 'string' && anchorConcept.checkpoint_tts_text.trim())
                    ? 'Tap to hear the question'
                    : undefined,
            options: optionLabels.map((option, optionIndex) => ({
                id: `option-${optionIndex}`,
                label: toSentenceCase(option),
                icon: getAssessmentIcon(optionIndex),
            })),
            correctOptionId: 'option-0',
            explanation: summarizeModule(module) || anchorConcept?.concept_text || '',
        };
    });
}

function buildCheckpointPrompt(module: ModuleBlueprint, concept: BackendConcept, isFinalCheckpoint: boolean) {
    const topic = concept.key_term || 'this idea';
    const sourcePrompt = concept.checkpoint_question.trim();
    const normalizedPrompt = sourcePrompt
        ? sourcePrompt.replace(/^[a-z]/, (char) => char.toLowerCase())
        : `which answer best matches what you have learned about ${topic}?`;

    if (isFinalCheckpoint) {
        return `Final quick check for Module ${module.moduleNumber}: based on what you have learned so far about ${topic}, ${normalizedPrompt}`;
    }

    return `Quick check for Module ${module.moduleNumber}: based on what you have covered so far about ${topic}, ${normalizedPrompt}`;
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
        title: "Let's make this easier.",
        description: `Your learning mode stays the same for now. If this ${mode} lesson feels hard, Nevo can slow it down or explain it more simply.`,
        options: [
            {
                id: 'slow-down',
                title: 'Slow this step down',
                description: 'Break this part into smaller, calmer steps.',
                icon: 'hands',
            },
            {
                id: 'simplify',
                title: 'Use simpler words',
                description: 'Keep the same lesson, but explain it more clearly.',
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

function buildAssessment(modules: ModuleBlueprint[]): LessonAssessmentData {
    return {
        questionsByVariant: {
            visual: buildAssessmentQuestionsForVariant(modules, 'standard', 'visual'),
            audio: buildAssessmentQuestionsForVariant(modules, 'standard', 'audio'),
            action: buildAssessmentQuestionsForVariant(modules, 'standard', 'action'),
            reading: buildAssessmentQuestionsForVariant(modules, 'standard', 'reading'),
            kids: buildAssessmentQuestionsForVariant(modules, 'kids', 'kids'),
        },
        submitLabel: 'Check answer',
        helperText: 'Choose one answer to continue.',
        feedback: {
            correct: {
                heading: 'You got it.',
                description: 'Nice work. You understood this module well enough to move on.',
                ctaLabel: 'Continue',
                footerLabel: 'You are building understanding step by step.',
            },
            incorrect: {
                heading: "Let's look at it another way.",
                description: 'Take another look at the key idea from this module before you answer again.',
                primaryCtaLabel: 'Try again',
                secondaryCtaLabel: 'Show correction',
                footerLabel: 'This check is here to help you learn, not just test you.',
            },
            correction: {
                userAnswerLabel: 'Your answer',
                answerLabel: 'Correct answer',
                description: 'Here is the clearest explanation of what this module was teaching.',
                ctaLabel: 'Continue',
            },
        },
    };
}

function buildMicroQuiz(modules: ModuleBlueprint[], allStages: StageBlueprint[]): LessonMicroQuizQuestion[] {
    return modules.map((module, index) => {
        const checkpoint = module.stages[module.stages.length - 1];
        const concept = checkpoint.concept;
        const nextStage = allStages.find((stage) => stage.overallStepNumber === checkpoint.overallStepNumber + 1);
        const continueToStageKey = nextStage?.key;
        const isFinalCheckpoint = !continueToStageKey;
        const moduleSummary = summarizeModule(module);

        return {
            moduleNumber: module.moduleNumber,
            prompt: buildCheckpointPrompt(module, concept, isFinalCheckpoint),
            progressLabel: isFinalCheckpoint
                ? `Final quick check ${index + 1} of ${modules.length}`
                : `Module ${module.moduleNumber} quick check`,
            progressPercent: ((index + 1) / modules.length) * 100,
            options: concept.checkpoint_options.map((option, optionIndex) => ({
                id: `option-${optionIndex}`,
                label: option,
            })),
            correctOptionId: resolveCorrectOptionId(concept),
            explanation: moduleSummary || concept.concept_text,
            continueLabel: continueToStageKey ? `Start module ${module.moduleNumber + 1}` : 'Go to final assessment',
            retryLabel: 'Try again',
            continueToStageKey,
            isFinalCheckpoint,
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
                    hintLabel: simplifyText(moduleSummary || concept.concept_text) || moduleSummary || concept.concept_text,
                },
            ],
        };
    });
}

function buildCompletion(
    payload: BackendLessonPayload,
    concepts: BackendConcept[],
    mode: LearningMode,
    quickCheckCount: number,
): LessonCompletionData {
    return {
        badgeLabel: payload.learning_mode_delivered || 'Adaptive lesson',
        heading: payload.lesson_title,
        completedAtLabel: `Completed ${new Date().toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
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
                value: `${quickCheckCount} quick checks`,
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

    const stageBlueprints = buildStageBlueprints(sourceConcepts);
    const modules = buildModules(stageBlueprints);
    const stages = stageBlueprints.map((blueprint) => buildStage(blueprint));
    const stageOrder = stageBlueprints.map((blueprint) => blueprint.key);

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
            conceptsLabel: `${modules.length} modules · ${stageBlueprints.length} learning steps`,
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
        completion: buildCompletion(payload, sourceConcepts, recommendedMode, modules.length),
        assessment: buildAssessment(modules),
        microQuiz: buildMicroQuiz(modules, stageBlueprints),
        stageOrder,
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
