import type { LearningMode } from '@/shared/store/useRegistrationStore';

export type StagePhaseKey = 'observe' | 'notice' | 'relate' | 'predict' | 'confirm';
export type StageKey = string;

export const STAGE_ORDER: StagePhaseKey[] = ['observe', 'notice', 'relate', 'predict', 'confirm'];

export type DisplayState = 'original' | 'simplified' | 'expanded';
export type ToolbarState = DisplayState | 'slower';
export type LessonPaceDensity = 'standard' | 'calm';
export type LessonModeCardKind = 'image' | 'audio' | 'action' | 'reading';
export type LessonBreakVariant = 'quick' | 'long';
export type LessonAssessmentVariant = LearningMode | 'kids';
export type LessonAssessmentOptionIcon = 'sun' | 'leaf' | 'water' | 'drop' | 'speaker' | 'seedling';
export type LessonMicroQuizResultState = 'idle' | 'correct' | 'incorrect';
export type LessonReflectionOption = {
    id: string;
    label: string;
};

export type RenderingPreferences = {
    letterSpacing: string;
    lineHeight: number;
    wordSpacing: string;
    fontSizeBoost: boolean;
    textAlign: 'left';
    maxLineWidth: string;
};

export type LessonReflectionData = {
    title: string;
    description: string;
    options: LessonReflectionOption[];
};

export type LessonReorientationOption = {
    id: string;
    title: string;
    description: string;
    icon: 'hands' | 'image' | 'bookmark';
    mode?: string;
    text?: string;
};

export type LessonReorientationData = {
    title: string;
    description: string;
    options: LessonReorientationOption[];
    ctaLabel: string;
};

export type LessonAssessmentFeedbackData = {
    correct: {
        heading: string;
        description: string;
        ctaLabel: string;
        footerLabel: string;
    };
    incorrect: {
        heading: string;
        description: string;
        primaryCtaLabel: string;
        secondaryCtaLabel: string;
        footerLabel: string;
    };
    correction: {
        userAnswerLabel: string;
        answerLabel: string;
        description: string;
        ctaLabel: string;
    };
};

export type LessonMicroQuizPromptOverlayData = {
    heading: string;
    description: string;
    primaryCtaLabel: string;
    secondaryCtaLabel: string;
    hintLabel?: string;
    hintText?: string;
};

export type VisualContent = {
    conceptId: string;
    imageUrl: string;
    imageAltText?: string;
    imageFetchStatus: 'pending' | 'resolved' | 'failed';
    body: string;
    bodySimplified: string;
    bodyExpanded: string;
    renderingPreferences?: RenderingPreferences;
    highlight?: { x: number; y: number; size: number };
    marker?: { x: number; y: number; label: string };
};

export type AudioContent = {
    audioUrl: string;
    body: string;
    bodySimplified: string;
    bodyExpanded: string;
    spokenBody: string;
    spokenBodySimplified: string;
    spokenBodyExpanded: string;
    renderingPreferences?: RenderingPreferences;
};

export type ActionStep = {
    text: string;
    state: 'unread' | 'active' | 'completed';
};

export type ActionContent = {
    steps: ActionStep[];
    stepsSimplified: ActionStep[];
    stepsExpanded: ActionStep[];
};

export type ReadingContent = {
    keyTermLabel: string;
    keyTerm: string;
    definition: string;
    definitionSimplified: string;
    definitionExpanded: string;
    formula?: string;
    formulaExpanded?: string;
    renderingPreferences?: RenderingPreferences;
};

export type StageModeContent = {
    visual: VisualContent;
    audio: AudioContent;
    action: ActionContent;
    reading: ReadingContent;
};

export type SlowerStep = {
    stepNumber: number;
    text: string;
    ttsText: string;
    isLastStep?: boolean;
    renderingPreferences?: RenderingPreferences;
};

export type LessonModeCard = {
    kind: LessonModeCardKind;
    title: string;
    detail: string;
    imageUrl?: string;
};

export type LessonStartData = {
    eyebrow: string;
    title: string;
    subtitle: string;
    durationLabel: string;
    conceptsLabel: string;
    modeLabel: string;
    cards: Record<LearningMode, LessonModeCard>;
    primaryCta: string;
    secondaryCta: string;
};

export type LessonBreakState = {
    heading: string;
    subheading: string;
    durationLabel: string;
    primaryCta: string;
    secondaryCta: string;
};

export type LessonCompletionMetric = {
    value: string;
    label: string;
    description: string;
    accent?: 'indigo' | 'lavender';
};

export type LessonNextLesson = {
    id: string;
    title: string;
    subjectLabel?: string;
    modeLabel: string;
    durationLabel: string;
    ctaLabel: string;
};

export type LessonConceptResultStatus = 'understood' | 'needed_more_time' | 'simplified';

export type LessonConceptResult = {
    label: string;
    status: LessonConceptResultStatus;
};

export type LessonModeSummary = {
    title: string;
    description: string;
};

export type LessonCompletionData = {
    badgeLabel: string;
    heading: string;
    completedAtLabel: string;
    metrics: LessonCompletionMetric[];
    conceptResults: LessonConceptResult[];
    modeSummary: LessonModeSummary;
    nextLesson?: LessonNextLesson;
    assessmentCtaLabel: string;
    browseCtaLabel: string;
    closeLabel: string;
};

export type LessonAssessmentOption = {
    id: string;
    label: string;
    icon: LessonAssessmentOptionIcon;
    color?: string;
};

export type LessonAssessmentQuestion = {
    id: string;
    moduleNumber?: number;
    questionNumber: number;
    totalQuestions: number;
    prompt: string;
    spokenPrompt?: string;
    helperLabel?: string;
    options: LessonAssessmentOption[];
    correctOptionId: string;
    explanation: string;
};

export type LessonAssessmentData = {
    questionsByVariant: Record<LessonAssessmentVariant, LessonAssessmentQuestion[]>;
    submitLabel: string;
    helperText: string;
    feedback: LessonAssessmentFeedbackData;
};

export type LessonMicroQuizOption = {
    id: string;
    label: string;
};

export type LessonMicroQuizQuestion = {
    moduleNumber: number;
    prompt: string;
    progressLabel: string;
    progressPercent: number;
    options: LessonMicroQuizOption[];
    correctOptionId: string;
    explanation: string;
    continueLabel: string;
    retryLabel: string;
    continueToStageKey?: StageKey;
    isFinalCheckpoint?: boolean;
    feedbackPrompts: LessonMicroQuizPromptOverlayData[];
};

export type Stage = {
    key: StageKey;
    phase: StagePhaseKey;
    moduleNumber: number;
    moduleStepNumber: number;
    totalModuleSteps: number;
    overallStepNumber: number;
    totalOverallSteps: number;
    pillText: string;
    label: string;
    labelSimplified?: string;
    labelExpanded?: string;
    modes: StageModeContent;
    slowerSteps: SlowerStep[];
};

export type LessonPlayerData = {
    id: string;
    originalLessonId?: string;
    adaptedLessonId?: string;
    title: string;
    subject: string;
    topic: string;
    recommendedMode: LearningMode;
    adaptAutomatically: boolean;
    reflection: LessonReflectionData;
    reorientation: LessonReorientationData;
    start: LessonStartData;
    breakStates: Record<LessonBreakVariant, LessonBreakState>;
    completion: LessonCompletionData;
    assessment: LessonAssessmentData;
    microQuiz: LessonMicroQuizQuestion[];
    stageOrder: StageKey[];
    stages: Stage[];
};
