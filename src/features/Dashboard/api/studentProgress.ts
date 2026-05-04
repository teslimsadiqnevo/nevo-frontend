export type StudentProgressMetric = {
    value: string;
    label: string;
};

export type StudentProgressSubjectLesson = {
    name: string;
    progress: number;
    total: number;
    complete: boolean;
};

export type StudentProgressSubject = {
    name: string;
    concepts: number;
    maxConcepts: number;
    color: string;
    conceptsAttempted: number;
    conceptsUnderstood: number;
    conceptList: { name: string; understood: boolean }[];
    lessons: StudentProgressSubjectLesson[];
};

export type StudentProgressRecentItem = {
    text: string;
    time: string;
};

export type StudentProgressViewModel = {
    hasProgress: boolean;
    metrics: StudentProgressMetric[];
    subjects: StudentProgressSubject[];
    recentActivity: StudentProgressRecentItem[];
};

const DEFAULT_BAR_COLOR = '#3B3F6E';

function toNumber(value: unknown, fallback = 0) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
}

function toTitle(value: string) {
    return value
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (match) => match.toUpperCase());
}

function normalizeRecentActivity(raw: unknown): StudentProgressRecentItem[] {
    if (!Array.isArray(raw)) return [];

    return raw
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const typed = item as Record<string, unknown>;
            const text =
                (typeof typed.text === 'string' && typed.text) ||
                (typeof typed.title === 'string' && typed.title) ||
                (typeof typed.description === 'string' && typed.description) ||
                null;
            const time =
                (typeof typed.time === 'string' && typed.time) ||
                (typeof typed.relative_time === 'string' && typed.relative_time) ||
                (typeof typed.created_at_human === 'string' && typed.created_at_human) ||
                '';

            if (!text) return null;
            return { text, time };
        })
        .filter((item): item is StudentProgressRecentItem => item !== null);
}

function normalizeSubjectFromObject(name: string, value: unknown): StudentProgressSubject | null {
    if (!value || typeof value !== 'object') return null;

    const subject = value as Record<string, unknown>;
    const lessonsCompleted = toNumber(subject.lessons_completed, 0);
    const conceptsUnderstood =
        toNumber(subject.concepts_understood, NaN) ||
        Math.round(toNumber(subject.average_score, 0) / 10);
    const conceptsAttempted =
        toNumber(subject.concepts_attempted, NaN) ||
        Math.max(conceptsUnderstood, lessonsCompleted, 1);
    const maxConcepts = Math.max(conceptsAttempted, conceptsUnderstood, 1);

    return {
        name: toTitle(name),
        concepts: conceptsUnderstood,
        maxConcepts,
        color: DEFAULT_BAR_COLOR,
        conceptsAttempted,
        conceptsUnderstood,
        conceptList: [],
        lessons: [],
    };
}

function normalizeSubjectFromArrayItem(value: unknown): StudentProgressSubject | null {
    if (!value || typeof value !== 'object') return null;

    const subject = value as Record<string, unknown>;
    const name =
        (typeof subject.subject === 'string' && subject.subject) ||
        (typeof subject.name === 'string' && subject.name) ||
        'Subject';

    const conceptsUnderstood = toNumber(subject.concepts_understood ?? subject.concepts, 0);
    const conceptsAttempted = Math.max(
        toNumber(subject.concepts_attempted ?? subject.maxConcepts, 0),
        conceptsUnderstood,
        1
    );

    return {
        name,
        concepts: conceptsUnderstood,
        maxConcepts: conceptsAttempted,
        color: typeof subject.color === 'string' ? subject.color : DEFAULT_BAR_COLOR,
        conceptsAttempted,
        conceptsUnderstood,
        conceptList: Array.isArray(subject.conceptList)
            ? (subject.conceptList as Array<Record<string, unknown>>).map((concept) => ({
                  name:
                      (typeof concept.name === 'string' && concept.name) ||
                      (typeof concept.title === 'string' && concept.title) ||
                      'Concept',
                  understood: Boolean(concept.understood ?? concept.complete ?? concept.completed),
              }))
            : [],
        lessons: Array.isArray(subject.lessons)
            ? (subject.lessons as Array<Record<string, unknown>>).map((lesson) => ({
                  name:
                      (typeof lesson.name === 'string' && lesson.name) ||
                      (typeof lesson.title === 'string' && lesson.title) ||
                      'Lesson',
                  progress: toNumber(lesson.progress, 0),
                  total: Math.max(toNumber(lesson.total, 1), 1),
                  complete: Boolean(lesson.complete),
              }))
            : [],
    };
}

export function normalizeStudentProgress(progressData?: unknown): StudentProgressViewModel {
    const raw = progressData && typeof progressData === 'object' ? (progressData as Record<string, unknown>) : null;
    const rawSubjects = raw?.subject_performance ?? raw?.subjects ?? null;

    const subjects = Array.isArray(rawSubjects)
        ? rawSubjects
              .map((item) => normalizeSubjectFromArrayItem(item))
              .filter((item): item is StudentProgressSubject => item !== null)
        : rawSubjects && typeof rawSubjects === 'object'
          ? Object.entries(rawSubjects as Record<string, unknown>)
                .map(([name, value]) => normalizeSubjectFromObject(name, value))
                .filter((item): item is StudentProgressSubject => item !== null)
          : [];

    const recentActivity = normalizeRecentActivity(raw?.recent_activity);
    const totalConcepts =
        toNumber(raw?.total_lessons_completed, NaN) ||
        toNumber(raw?.total_lessons_started, NaN) ||
        subjects.reduce((sum, subject) => sum + subject.conceptsUnderstood, 0);
    const streak = toNumber(raw?.streak_days, 0);
    const breakthroughs =
        toNumber(raw?.breakthroughs, NaN) ||
        subjects.reduce((sum, subject) => sum + Math.max(subject.conceptsUnderstood - 1, 0), 0);

    const hasProgress = subjects.length > 0 || recentActivity.length > 0 || totalConcepts > 0 || streak > 0 || breakthroughs > 0;

    return {
        hasProgress,
        metrics: [
            { value: String(streak || 0), label: 'days in a row' },
            { value: String(totalConcepts || 0), label: 'concepts' },
            { value: String(breakthroughs || 0), label: 'breakthroughs' },
        ],
        subjects,
        recentActivity,
    };
}
