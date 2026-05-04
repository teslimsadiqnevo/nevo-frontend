'use client';

import { type Dispatch, type ReactNode, type SetStateAction, useMemo, useRef, useState } from 'react';
import { useAuthGuard } from '@/shared/lib';

interface LessonMeta {
  title: string;
  subject: string;
  educationLevel: string;
  duration: string;
}

interface AdaptationSettings {
  checkpointFrequency: 'section' | '2sections' | '3sections';
  simplifyEnabled: boolean;
  expandEnabled: boolean;
  difficulty: number;
}

interface UploadedFileState {
  file: File;
  name: string;
  sizeLabel: string;
}

type ClientResult<T = unknown> =
  | { data: T; authExpired?: false }
  | { error: string; authExpired?: boolean };

interface LessonReviewData {
  objectives?: string[];
  key_concepts?: string[];
  keyConcepts?: string[];
}

const SUBJECTS = ['Mathematics', 'English', 'Science', 'History', 'Geography', 'Arts', 'Physical Education', 'Other'];
const LEVELS = ['Primary', 'Secondary', 'Tertiary'];
const DURATIONS = ['Under 15 mins', '15-30 mins', '30+ mins'];
const TOTAL_STEPS = 5;
const ACCEPTED_FILE_EXTENSIONS = ['.pdf', '.docx', '.pptx'];

function buildErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== 'object') return fallback;
  const payload = data as Record<string, unknown>;
  if (typeof payload.detail === 'string') return payload.detail;
  if (typeof payload.message === 'string') return payload.message;
  if (typeof payload.error === 'string') return payload.error;
  return fallback;
}

function mapEducationLevelToGrade(level: string) {
  if (level === 'Primary') return 3;
  if (level === 'Secondary') return 8;
  if (level === 'Tertiary') return 12;
  return 3;
}

function mapDurationToMinutes(duration: string) {
  if (duration === 'Under 15 mins') return 15;
  if (duration === '15-30 mins') return 25;
  if (duration === '30+ mins') return 40;
  return 20;
}

function mapDifficultyToLevel(value: number) {
  if (value <= 20) return 1;
  if (value <= 40) return 2;
  if (value <= 60) return 3;
  if (value <= 80) return 4;
  return 5;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isAcceptedFile(file: File) {
  const lowerName = file.name.toLowerCase();
  return ACCEPTED_FILE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

async function createLesson(payload: {
  meta: LessonMeta;
  file: File;
}): Promise<ClientResult<{ lesson_id: string; status: string; message: string }>> {
  const formData = new FormData();
  formData.append('title', payload.meta.title.trim());
  formData.append('subject', payload.meta.subject);
  formData.append('description', `${payload.meta.subject} lesson for ${payload.meta.educationLevel}`);
  formData.append('topic', payload.meta.title.trim());
  formData.append('target_grade_level', String(mapEducationLevelToGrade(payload.meta.educationLevel)));
  formData.append('file', payload.file);

  const res = await fetch('/api/teacher/lessons', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      error: buildErrorMessage(data, 'Could not create lesson.'),
      authExpired: res.status === 401 || res.status === 403,
    };
  }

  return { data };
}

async function updateLessonDetails(lessonId: string, payload: {
  title: string;
  description: string;
  subject: string;
  topic: string;
  target_grade_level: number;
  estimated_duration_minutes: number;
}): Promise<ClientResult> {
  const res = await fetch(`/api/teacher/lessons/${lessonId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      error: buildErrorMessage(data, 'Could not update lesson details.'),
      authExpired: res.status === 401 || res.status === 403,
    };
  }

  return { data };
}

async function processLesson(lessonId: string): Promise<ClientResult<LessonReviewData>> {
  const res = await fetch(`/api/teacher/lessons/${lessonId}/ai-review`, {
    method: 'POST',
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      error: buildErrorMessage(data, 'Could not analyse this lesson yet.'),
      authExpired: res.status === 401 || res.status === 403,
    };
  }

  return { data };
}

async function saveObjectives(lessonId: string, objectives: string[], keyConcepts: string[]): Promise<ClientResult> {
  const res = await fetch(`/api/teacher/lessons/${lessonId}/objectives`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      objectives,
      key_concepts: keyConcepts,
    }),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      error: buildErrorMessage(data, 'Could not save lesson objectives.'),
      authExpired: res.status === 401 || res.status === 403,
    };
  }

  return { data };
}

async function saveAdaptation(lessonId: string, settings: AdaptationSettings): Promise<ClientResult> {
  const frequencyMap: Record<AdaptationSettings['checkpointFrequency'], number> = {
    section: 1,
    '2sections': 2,
    '3sections': 3,
  };

  const res = await fetch(`/api/teacher/lessons/${lessonId}/adaptation`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      checkpoint_frequency: frequencyMap[settings.checkpointFrequency],
      simplify_enabled: settings.simplifyEnabled,
      expand_enabled: settings.expandEnabled,
      max_difficulty: mapDifficultyToLevel(settings.difficulty),
    }),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      error: buildErrorMessage(data, 'Could not save adaptation settings.'),
      authExpired: res.status === 401 || res.status === 403,
    };
  }

  return { data };
}

async function publishLesson(lessonId: string): Promise<ClientResult> {
  const res = await fetch(`/api/teacher/lessons/${lessonId}/publish`, {
    method: 'POST',
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      error: buildErrorMessage(data, 'Could not publish lesson.'),
      authExpired: res.status === 401 || res.status === 403,
    };
  }

  return { data };
}

export function AddLessonWizard({
  onClose,
  onCreated,
  onViewLesson,
  onAssign,
}: {
  onClose: () => void;
  onCreated?: (lessonId: string) => void;
  onViewLesson?: (lessonId: string) => void;
  onAssign?: (lessonId: string) => void;
}) {
  const guardAuth = useAuthGuard('teacher');
  const [step, setStep] = useState(1);
  const [meta, setMeta] = useState<LessonMeta>({ title: '', subject: '', educationLevel: '', duration: '' });
  const [uploadedFile, setUploadedFile] = useState<UploadedFileState | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [reviewObjectives, setReviewObjectives] = useState<string[]>([]);
  const [reviewConcepts, setReviewConcepts] = useState<string[]>([]);
  const [learningObjectives, setLearningObjectives] = useState('');
  const [keyConcepts, setKeyConcepts] = useState<string[]>([]);
  const [adaptationSettings, setAdaptationSettings] = useState<AdaptationSettings>({
    checkpointFrequency: 'section',
    simplifyEnabled: true,
    expandEnabled: true,
    difficulty: 50,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const canContinueStep1 = meta.title.trim() && meta.subject && meta.educationLevel;

  const handleBack = () => {
    setStepError(null);
    if (step === 1) {
      onClose();
      return;
    }
    setStep((current) => current - 1);
  };

  const handleFileSelect = (file: File) => {
    if (!isAcceptedFile(file)) {
      setFileError('Use a PDF, DOCX, or PPTX file.');
      setUploadedFile(null);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setFileError('The file is too large. Please keep it under 50MB.');
      setUploadedFile(null);
      return;
    }

    setFileError(null);
    setUploadedFile({
      file,
      name: file.name,
      sizeLabel: formatFileSize(file.size),
    });
  };

  const handlePrepareLesson = async () => {
    if (!uploadedFile) return;
    if (lessonId) {
      setStep(3);
      return;
    }

    setIsProcessing(true);
    setStepError(null);

    const created = await createLesson({
      meta,
      file: uploadedFile.file,
    });

    if (guardAuth(created)) {
      setIsProcessing(false);
      return;
    }
    if ('error' in created) {
      setStepError(created.error);
      setIsProcessing(false);
      return;
    }

    const createdLessonId = String(created.data.lesson_id);
    setLessonId(createdLessonId);

    const updated = await updateLessonDetails(createdLessonId, {
      title: meta.title.trim(),
      description: `${meta.subject} lesson for ${meta.educationLevel}`,
      subject: meta.subject,
      topic: meta.title.trim(),
      target_grade_level: mapEducationLevelToGrade(meta.educationLevel),
      estimated_duration_minutes: mapDurationToMinutes(meta.duration),
    });

    if (guardAuth(updated)) {
      setIsProcessing(false);
      return;
    }
    if ('error' in updated) {
      setStepError(updated.error);
      setIsProcessing(false);
      return;
    }

    const reviewed = await processLesson(createdLessonId);
    if (guardAuth(reviewed)) {
      setIsProcessing(false);
      return;
    }

    if ('error' in reviewed) {
      setReviewObjectives([]);
      setReviewConcepts([]);
      setLearningObjectives('');
      setKeyConcepts([]);
      setStepError(`${reviewed.error} You can still continue and write the learning goals manually.`);
    } else {
      const nextObjectives = Array.isArray(reviewed.data?.objectives) ? reviewed.data.objectives.filter(Boolean) : [];
      const nextConcepts = Array.isArray(reviewed.data?.key_concepts)
        ? reviewed.data.key_concepts.filter(Boolean)
        : Array.isArray(reviewed.data?.keyConcepts)
          ? reviewed.data.keyConcepts.filter(Boolean)
          : [];

      setReviewObjectives(nextObjectives);
      setReviewConcepts(nextConcepts);
      setLearningObjectives(nextObjectives.join('\n'));
      setKeyConcepts(nextConcepts);
    }

    setStep(3);
    setIsProcessing(false);
  };

  const handleSaveReview = async () => {
    if (!lessonId) return;

    const normalizedObjectives = learningObjectives
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);

    setStepError(null);
    setIsProcessing(true);

    const result = await saveObjectives(lessonId, normalizedObjectives, keyConcepts);
    if (guardAuth(result)) {
      setIsProcessing(false);
      return;
    }
    if ('error' in result) {
      setStepError(result.error);
      setIsProcessing(false);
      return;
    }

    setIsProcessing(false);
    setStep(4);
  };

  const finalizeDraft = async () => {
    if (!lessonId) return;

    setStepError(null);
    setIsSavingDraft(true);

    const result = await saveAdaptation(lessonId, adaptationSettings);
    if (guardAuth(result)) {
      setIsSavingDraft(false);
      return;
    }
    if ('error' in result) {
      setStepError(result.error);
      setIsSavingDraft(false);
      return;
    }

    onCreated?.(lessonId);
    setIsSavingDraft(false);
    onClose();
  };

  const finalizePublish = async () => {
    if (!lessonId) return;

    setStepError(null);
    setIsPublishing(true);

    const adaptationResult = await saveAdaptation(lessonId, adaptationSettings);
    if (guardAuth(adaptationResult)) {
      setIsPublishing(false);
      return;
    }
    if ('error' in adaptationResult) {
      setStepError(adaptationResult.error);
      setIsPublishing(false);
      return;
    }

    const result = await publishLesson(lessonId);
    if (guardAuth(result)) {
      setIsPublishing(false);
      return;
    }
    if ('error' in result) {
      setStepError(result.error);
      setIsPublishing(false);
      return;
    }

    setIsPublishing(false);
    setShowSuccess(true);
  };

  const summaryObjectives = useMemo(
    () => learningObjectives.split('\n').map((item) => item.trim()).filter(Boolean),
    [learningObjectives],
  );

  if (showSuccess && lessonId) {
    return (
      <SuccessScreen
        title={meta.title}
        onAssign={() => (onAssign ? onAssign(lessonId) : onClose())}
        onViewLesson={() => {
          onCreated?.(lessonId);
          if (onViewLesson) onViewLesson(lessonId);
          else onClose();
        }}
        onBackToLibrary={() => {
          onCreated?.(lessonId);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="flex w-full max-w-[900px] flex-col pb-12">
      <div className="mb-6 flex items-center">
        <button
          onClick={handleBack}
          className="cursor-pointer rounded-lg p-1 transition-colors hover:bg-white/40"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#3B3F6E" strokeWidth="1.8">
            <path d="M12 4L6 10L12 16" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="flex-1 text-center text-[13px] font-medium text-[#6E74AA]">
          Step {step} of {TOTAL_STEPS}
        </span>
      </div>

      {stepError ? (
        <div className="mb-5 rounded-xl border border-[#F1C5BF] bg-[#FFF6F4] px-4 py-3 text-[13px] text-[#B54708]">
          {stepError}
        </div>
      ) : null}

      {step === 1 ? (
        <Step1Details meta={meta} setMeta={setMeta} canContinue={!!canContinueStep1} onContinue={() => setStep(2)} />
      ) : null}

      {step === 2 ? (
        <Step2Upload
          uploadedFile={uploadedFile}
          fileError={fileError}
          isProcessing={isProcessing}
          onFileSelect={handleFileSelect}
          onContinue={handlePrepareLesson}
        />
      ) : null}

      {step === 3 ? (
        <Step3Learning
          isSaving={isProcessing}
          reviewObjectives={reviewObjectives}
          reviewConcepts={reviewConcepts}
          learningObjectives={learningObjectives}
          keyConcepts={keyConcepts}
          onLearningObjectivesChange={setLearningObjectives}
          onKeyConceptsChange={setKeyConcepts}
          onContinue={handleSaveReview}
        />
      ) : null}

      {step === 4 ? (
        <Step4Adaptation
          settings={adaptationSettings}
          onChange={setAdaptationSettings}
          onContinue={() => setStep(5)}
          onSkip={() => setStep(5)}
        />
      ) : null}

      {step === 5 ? (
        <Step5Review
          meta={meta}
          uploadedFile={uploadedFile}
          objectives={summaryObjectives}
          keyConcepts={keyConcepts}
          adaptationSettings={adaptationSettings}
          isSavingDraft={isSavingDraft}
          isPublishing={isPublishing}
          onDraft={finalizeDraft}
          onPublish={finalizePublish}
        />
      ) : null}
    </div>
  );
}

function Step1Details({
  meta,
  setMeta,
  canContinue,
  onContinue,
}: {
  meta: LessonMeta;
  setMeta: Dispatch<SetStateAction<LessonMeta>>;
  canContinue: boolean;
  onContinue: () => void;
}) {
  return (
    <>
      <h2 className="mb-6 text-[20px] font-semibold text-[#3B3F6E]">Add a new lesson</h2>

      <div className="mb-6">
        <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-graphite-60">Lesson title</label>
        <input
          type="text"
          value={meta.title}
          onChange={(event) => setMeta((current) => ({ ...current, title: event.target.value }))}
          placeholder="e.g. Introduction to Algebra"
          className="w-full rounded-xl border border-[#E0DDD8] bg-white px-5 py-3.5 text-[14px] font-medium text-[#2B2B2F] outline-none transition-colors placeholder-graphite-40 focus:border-[#3B3F6E]"
        />
      </div>

      <div className="mb-6">
        <label className="mb-2.5 block text-[11px] font-bold uppercase tracking-wider text-graphite-60">Subject</label>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((subject) => (
            <button
              key={subject}
              type="button"
              onClick={() => setMeta((current) => ({ ...current, subject: current.subject === subject ? '' : subject }))}
              className={`cursor-pointer rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
                meta.subject === subject
                  ? 'border-[#3B3F6E] bg-[#3B3F6E] text-white'
                  : 'border-[#E0DDD8] bg-white text-[#2B2B2F] hover:border-[#3B3F6E]'
              }`}
            >
              {subject}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="mb-2.5 block text-[11px] font-bold uppercase tracking-wider text-graphite-60">Education level</label>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setMeta((current) => ({ ...current, educationLevel: current.educationLevel === level ? '' : level }))}
              className={`cursor-pointer rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
                meta.educationLevel === level
                  ? 'border-[#3B3F6E] bg-[#3B3F6E] text-white'
                  : 'border-[#E0DDD8] bg-white text-[#2B2B2F] hover:border-[#3B3F6E]'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <div className="mb-2.5 flex items-baseline justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-graphite-60">Estimated duration</label>
          <span className="text-[11px] italic text-graphite-40">Optional</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((duration) => (
            <button
              key={duration}
              type="button"
              onClick={() => setMeta((current) => ({ ...current, duration: current.duration === duration ? '' : duration }))}
              className={`cursor-pointer rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
                meta.duration === duration
                  ? 'border-[#3B3F6E] bg-[#3B3F6E] text-white'
                  : 'border-[#E0DDD8] bg-white text-[#2B2B2F] hover:border-[#3B3F6E]'
              }`}
            >
              {duration}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={!canContinue}
        onClick={onContinue}
        className={`mt-auto w-full cursor-pointer rounded-2xl py-3.5 text-[14px] font-semibold transition-all ${
          canContinue
            ? 'bg-[#3B3F6E] text-white hover:bg-[#2E3259]'
            : 'cursor-not-allowed bg-[#B0ADAD] text-white'
        }`}
      >
        Continue
      </button>
    </>
  );
}

function Step2Upload({
  uploadedFile,
  fileError,
  isProcessing,
  onFileSelect,
  onContinue,
}: {
  uploadedFile: UploadedFileState | null;
  fileError: string | null;
  isProcessing: boolean;
  onFileSelect: (file: File) => void;
  onContinue: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const pickFile = () => inputRef.current?.click();

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div className="flex flex-1 flex-col">
      <h2 className="mb-2 text-[20px] font-semibold text-[#3B3F6E]">Upload your lesson</h2>
      <p className="mb-6 text-[13px] text-graphite-60">Choose a source file and Nevo will create the lesson from the real upload.</p>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`mb-3 flex min-h-[220px] flex-col items-center justify-center rounded-2xl border-2 transition-all ${
          uploadedFile
            ? 'border-solid border-[#C5C3E8] bg-[#F0EEFA]'
            : isDragging
              ? 'border-solid border-[#3B3F6E] bg-[#E8E6F5]'
              : 'border-dashed border-[#E0DDD8] bg-white'
        }`}
      >
        {uploadedFile ? (
          <div className="flex flex-col items-center px-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#3B3F6E]/10">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B3F6E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <p className="mb-1 text-[14px] font-semibold text-[#3B3F6E]">{uploadedFile.name}</p>
            <p className="mb-4 text-[12px] text-[#6E74AA]">{uploadedFile.sizeLabel}</p>
            <button
              type="button"
              onClick={pickFile}
              className="cursor-pointer rounded-xl border border-[#3B3F6E] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#3B3F6E] transition-colors hover:bg-indigo-5"
            >
              Replace file
            </button>
          </div>
        ) : (
          <>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mb-3">
              <path d="M20 26V14" stroke="#6E74AA" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M15 18L20 13L25 18" stroke="#6E74AA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 28C6 28 4 25 4 22C4 19 6 17 9 16C9 11 13 8 18 8C22 8 25 10 26 13C30 13 34 16 34 20C34 24 31 28 27 28" stroke="#6E74AA" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="mb-1 text-[14px] font-semibold text-[#3B3F6E]">Drag and drop your file here</p>
            <p className="mb-3 text-[12px] text-graphite-40">or</p>
            <button
              type="button"
              onClick={pickFile}
              className="cursor-pointer rounded-xl border border-[#3B3F6E] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#3B3F6E] transition-colors hover:bg-indigo-5"
            >
              Browse files
            </button>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.pptx"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFileSelect(file);
          }}
        />
      </div>

      <p className="mb-8 text-center text-[12px] text-graphite-40">Accepted: PDF, DOC, DOCX, PPT, PPTX · Max 50MB</p>

      {fileError ? (
        <div className="mb-5 rounded-xl border border-[#F1C5BF] bg-[#FFF6F4] px-4 py-3 text-[13px] text-[#B54708]">
          {fileError}
        </div>
      ) : null}

      <div className="flex-1" />

      <button
        type="button"
        disabled={!uploadedFile || isProcessing}
        onClick={onContinue}
        className={`mt-4 w-full cursor-pointer rounded-2xl py-3.5 text-[14px] font-semibold transition-all ${
          uploadedFile && !isProcessing
            ? 'bg-[#3B3F6E] text-white hover:bg-[#2E3259]'
            : 'cursor-not-allowed bg-[#B0ADAD] text-white'
        }`}
      >
        {isProcessing ? 'Creating lesson...' : 'Continue'}
      </button>
    </div>
  );
}

function Step3Learning({
  isSaving,
  reviewObjectives,
  reviewConcepts,
  learningObjectives,
  keyConcepts,
  onLearningObjectivesChange,
  onKeyConceptsChange,
  onContinue,
}: {
  isSaving: boolean;
  reviewObjectives: string[];
  reviewConcepts: string[];
  learningObjectives: string;
  keyConcepts: string[];
  onLearningObjectivesChange: (value: string) => void;
  onKeyConceptsChange: (value: string[]) => void;
  onContinue: () => void;
}) {
  const [newConcept, setNewConcept] = useState('');

  const appendObjective = (text: string) => {
    const current = learningObjectives.trim();
    if (!current) {
      onLearningObjectivesChange(text);
      return;
    }
    if (current.toLowerCase().includes(text.toLowerCase())) return;
    onLearningObjectivesChange(`${current}\n${text}`);
  };

  const addConcept = () => {
    const next = newConcept.trim();
    if (!next) return;
    if (keyConcepts.some((item) => item.toLowerCase() === next.toLowerCase())) {
      setNewConcept('');
      return;
    }
    onKeyConceptsChange([...keyConcepts, next]);
    setNewConcept('');
  };

  return (
    <div className="flex flex-1 flex-col">
      <h2 className="mb-6 text-[20px] font-semibold text-[#3B3F6E]">What will students learn?</h2>

      <div className="mb-8 flex items-center gap-2.5 rounded-xl border border-[#C8E6C9] bg-[#E8F5E9] px-4 py-3">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#2E7D32" strokeWidth="1.5">
          <path d="M3 8.5L6 11.5L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[13px] font-medium text-[#2E7D32]">Nevo reviewed the uploaded lesson. You can refine the suggestions below.</span>
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-graphite-60">Learning objectives</label>
        <textarea
          value={learningObjectives}
          onChange={(event) => onLearningObjectivesChange(event.target.value)}
          className="mb-3 h-[120px] w-full resize-none rounded-xl border border-[#E0DDD8] bg-white px-4 py-3 text-[13.5px] text-[#2B2B2F] outline-none transition-colors placeholder-graphite-40 focus:border-[#3B3F6E]"
          placeholder="List what students should understand by the end of the lesson."
        />
        {reviewObjectives.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {reviewObjectives.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => appendObjective(item)}
                className="cursor-pointer rounded-lg border border-[#3B3F6E] px-3.5 py-1.5 text-[12.5px] text-[#3B3F6E] transition-colors hover:bg-gray-50"
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mb-10">
        <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-graphite-60">Key concepts</label>
        <div className="mb-3 flex flex-wrap gap-2">
          {keyConcepts.map((concept, index) => (
            <div key={`${concept}-${index}`} className="flex items-center gap-1.5 rounded-lg bg-[#3B3F6E] px-3 py-1.5 text-[13px] text-white">
              {concept}
              <button
                type="button"
                onClick={() => onKeyConceptsChange(keyConcepts.filter((_, currentIndex) => currentIndex !== index))}
                className="cursor-pointer text-white/70 transition-colors hover:text-white"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 3L9 9M9 3L3 9" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        {reviewConcepts.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {reviewConcepts
              .filter((concept) => !keyConcepts.includes(concept))
              .map((concept) => (
                <button
                  key={concept}
                  type="button"
                  onClick={() => onKeyConceptsChange([...keyConcepts, concept])}
                  className="cursor-pointer rounded-lg border border-[#3B3F6E] px-3.5 py-1.5 text-[12.5px] text-[#3B3F6E] transition-colors hover:bg-gray-50"
                >
                  {concept}
                </button>
              ))}
          </div>
        ) : null}
        <div className="flex gap-2">
          <input
            type="text"
            value={newConcept}
            onChange={(event) => setNewConcept(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addConcept();
              }
            }}
            placeholder="Add another concept"
            className="flex-1 rounded-xl border border-[#E0DDD8] bg-white px-4 py-3 text-[13.5px] text-[#2B2B2F] outline-none transition-colors placeholder-graphite-40 focus:border-[#3B3F6E]"
          />
          <button
            type="button"
            onClick={addConcept}
            className="cursor-pointer rounded-xl border border-[#3B3F6E] px-4 py-3 text-[13px] font-semibold text-[#3B3F6E] transition-colors hover:bg-indigo-5"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex-1" />

      <button
        type="button"
        onClick={onContinue}
        disabled={isSaving}
        className={`w-full cursor-pointer rounded-2xl py-3.5 text-[14px] font-semibold transition-all ${
          isSaving
            ? 'cursor-not-allowed bg-[#B0ADAD] text-white'
            : 'bg-[#3B3F6E] text-white hover:bg-[#2E3259]'
        }`}
      >
        {isSaving ? 'Saving review...' : 'Continue'}
      </button>
    </div>
  );
}

function Step4Adaptation({
  settings,
  onChange,
  onContinue,
  onSkip,
}: {
  settings: AdaptationSettings;
  onChange: (next: AdaptationSettings) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const getDifficultyLabel = () => {
    if (settings.difficulty < 33) return 'Accessible';
    if (settings.difficulty > 66) return 'Advanced';
    return 'Moderate';
  };

  return (
    <div className="flex flex-1 flex-col">
      <h2 className="mb-1 text-[20px] font-semibold text-[#3B3F6E]">Adaptation settings</h2>
      <p className="mb-8 text-[13px] text-graphite-60">These choices are saved to the lesson and used when Nevo adapts it for students.</p>

      <div className="mb-8">
        <span className="mb-2 inline-block rounded-full bg-[#E8E6F5] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#6E74AA]">Optional</span>
        <p className="mb-3 text-[14px] font-medium text-[#2B2B2F]">How often should comprehension checks appear?</p>
        <div className="flex flex-wrap gap-2">
          {[
            ['section', 'Every section'],
            ['2sections', 'Every 2 sections'],
            ['3sections', 'Every 3 sections'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ ...settings, checkpointFrequency: value as AdaptationSettings['checkpointFrequency'] })}
              className={`cursor-pointer rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
                settings.checkpointFrequency === value
                  ? 'border-[#3B3F6E] bg-[#3B3F6E] text-white'
                  : 'border-[#E0DDD8] bg-white text-[#2B2B2F] hover:border-[#3B3F6E]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ToggleRow
        title="Allow simplified explanations"
        description="Nevo can generate a simpler version of each concept for students who need it."
        checked={settings.simplifyEnabled}
        onToggle={() => onChange({ ...settings, simplifyEnabled: !settings.simplifyEnabled })}
      />

      <ToggleRow
        title="Allow expanded explanations"
        description="Nevo can generate a richer version with extra context and examples."
        checked={settings.expandEnabled}
        onToggle={() => onChange({ ...settings, expandEnabled: !settings.expandEnabled })}
      />

      <div className="mb-10">
        <span className="mb-2 inline-block rounded-full bg-[#E8E6F5] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#6E74AA]">Optional</span>
        <p className="mb-6 text-[14px] font-medium text-[#2B2B2F]">Maximum difficulty level</p>

        <div className="px-4">
          <div className="relative flex h-[4px] w-full items-center rounded-full bg-[#E0DDD8]">
            <div className="absolute left-0 h-full rounded-full bg-[#3B3F6E]" style={{ width: `${settings.difficulty}%` }} />
            <input
              type="range"
              min="0"
              max="100"
              value={settings.difficulty}
              onChange={(event) => onChange({ ...settings, difficulty: Number(event.target.value) })}
              className="absolute inset-0 w-full cursor-pointer opacity-0"
            />
            <div
              className="pointer-events-none absolute flex h-4 w-4 -translate-x-1/2 scale-125 items-center justify-center rounded-full bg-[#3B3F6E]"
              style={{ left: `${settings.difficulty}%` }}
            >
              <span className="absolute -top-7 whitespace-nowrap rounded bg-[#3B3F6E] px-2 py-1 text-[10px] text-white after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-[#3B3F6E] after:content-['']">
                {getDifficultyLabel()}
              </span>
            </div>
          </div>
          <div className="mt-3 flex justify-between text-[11px] font-medium text-graphite-40">
            <span>Accessible</span>
            <span>Advanced</span>
          </div>
        </div>
      </div>

      <div className="flex-1" />

      <button
        type="button"
        onClick={onContinue}
        className="mb-3 w-full cursor-pointer rounded-2xl bg-[#3B3F6E] py-3.5 text-[14px] font-semibold text-white transition-all hover:bg-[#2E3259]"
      >
        Continue
      </button>

      <button
        type="button"
        onClick={onSkip}
        className="w-full cursor-pointer text-center text-[12px] font-medium text-graphite-60 transition-colors hover:text-graphite"
      >
        Skip all — use Nevo defaults
      </button>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onToggle,
}: {
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mb-8 flex items-start justify-between">
      <div>
        <span className="mb-2 inline-block rounded-full bg-[#E8E6F5] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#6E74AA]">Optional</span>
        <p className="mb-1 text-[14px] font-medium text-[#2B2B2F]">{title}</p>
        <p className="text-[12px] text-graphite-40">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`mt-6 flex h-6 w-10 cursor-pointer items-center rounded-full px-1 transition-colors ${
          checked ? 'bg-[#3B3F6E]' : 'bg-[#D0CCC5]'
        }`}
      >
        <div className={`h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function Step5Review({
  meta,
  uploadedFile,
  objectives,
  keyConcepts,
  adaptationSettings,
  isSavingDraft,
  isPublishing,
  onDraft,
  onPublish,
}: {
  meta: LessonMeta;
  uploadedFile: UploadedFileState | null;
  objectives: string[];
  keyConcepts: string[];
  adaptationSettings: AdaptationSettings;
  isSavingDraft: boolean;
  isPublishing: boolean;
  onDraft: () => void;
  onPublish: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-8 flex items-center gap-2.5 rounded-xl bg-[#E8F5E9] px-4 py-3">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#2E7D32" strokeWidth="2">
          <path d="M3 8.5L6 11.5L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[13px] font-semibold text-[#2B2B2F]">Nevo has prepared your lesson for adaptive delivery.</span>
      </div>

      <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#6E74AA]">Review before publishing</h3>

      <SummaryCard title="Lesson details">
        <SummaryLine label="Title" value={meta.title || 'Untitled lesson'} />
        <SummaryLine label="Subject" value={meta.subject || 'Not set'} />
        <SummaryLine label="Level" value={meta.educationLevel || 'Not set'} />
        <SummaryLine label="Duration" value={meta.duration || 'Nevo default'} />
        <SummaryLine label="Source file" value={uploadedFile ? `${uploadedFile.name} · ${uploadedFile.sizeLabel}` : 'No file selected'} />
      </SummaryCard>

      <SummaryCard title="Learning goals">
        {objectives.length > 0 ? (
          <ul className="space-y-2">
            {objectives.slice(0, 4).map((objective) => (
              <li key={objective} className="flex gap-2 text-[13px] text-[#2B2B2F]">
                <span className="mt-[2px] text-[#3B3F6E]">•</span>
                <span>{objective}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[12px] text-graphite-40">No learning objectives were added yet.</p>
        )}
      </SummaryCard>

      <SummaryCard title="Key concepts">
        {keyConcepts.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {keyConcepts.map((concept) => (
              <span key={concept} className="rounded-md bg-[#E8E6F5] px-3 py-1 text-[12px] font-medium text-[#3B3F6E]">
                {concept}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-graphite-40">No key concepts were added yet.</p>
        )}
      </SummaryCard>

      <SummaryCard title="Adaptive settings">
        <SummaryLine
          label="Checkpoints"
          value={
            adaptationSettings.checkpointFrequency === 'section'
              ? 'Every section'
              : adaptationSettings.checkpointFrequency === '2sections'
                ? 'Every 2 sections'
                : 'Every 3 sections'
          }
        />
        <SummaryLine label="Simplified explanations" value={adaptationSettings.simplifyEnabled ? 'Enabled' : 'Disabled'} />
        <SummaryLine label="Expanded explanations" value={adaptationSettings.expandEnabled ? 'Enabled' : 'Disabled'} />
        <SummaryLine
          label="Difficulty"
          value={adaptationSettings.difficulty < 33 ? 'Accessible' : adaptationSettings.difficulty > 66 ? 'Advanced' : 'Moderate'}
        />
      </SummaryCard>

      <div className="flex-1" />

      <div className="mb-2 flex gap-4">
        <button
          type="button"
          onClick={onDraft}
          disabled={isSavingDraft || isPublishing}
          className="flex-1 cursor-pointer rounded-xl border border-[#3B3F6E] bg-white py-3.5 text-[14px] font-semibold text-[#3B3F6E] transition-colors hover:bg-indigo-5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSavingDraft ? 'Saving draft...' : 'Save as draft'}
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={isPublishing || isSavingDraft}
          className="flex-1 cursor-pointer rounded-xl bg-[#3B3F6E] py-3.5 text-[14px] font-semibold text-white transition-all hover:bg-[#2E3259] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPublishing ? 'Publishing...' : 'Publish lesson'}
        </button>
      </div>
      <p className="text-center text-[11px] text-graphite-40">Publishing makes this lesson available to assign to students.</p>
    </div>
  );
}

function SummaryCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-3 rounded-xl border border-[#E0DDD8] bg-white p-5">
      <span className="mb-3 block text-[14px] font-semibold text-[#3B3F6E]">{title}</span>
      {children}
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-[12px] uppercase tracking-wider text-graphite-40">{label}</span>
      <span className="text-right text-[13px] text-[#2B2B2F]">{value}</span>
    </div>
  );
}

function SuccessScreen({
  title,
  onAssign,
  onViewLesson,
  onBackToLibrary,
}: {
  title: string;
  onAssign: () => void;
  onViewLesson: () => void;
  onBackToLibrary: () => void;
}) {
  return (
    <div className="relative -mt-16 flex flex-1 flex-col items-center justify-center">
      <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded-lg bg-[#3B3F6E] px-6 py-3 text-[13px] font-medium text-white shadow-sm">
        Lesson added to your library
      </div>

      <div className="mb-6 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#E8F5E9]">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>

      <h2 className="mb-3 text-[24px] font-bold text-[#2B2B2F]">Lesson published.</h2>
      <p className="mb-6 text-[15px] font-medium tracking-tight text-[#6E74AA]">{title || 'New lesson'}</p>
      <p className="mb-8 text-[14px] text-graphite-60">Your lesson is ready to assign to students.</p>

      <button
        type="button"
        onClick={onAssign}
        className="mb-3 w-full max-w-[340px] cursor-pointer rounded-xl bg-[#3B3F6E] py-4 text-[14px] font-semibold text-white transition-all hover:bg-[#2E3259]"
      >
        Assign now
      </button>
      <button
        type="button"
        onClick={onViewLesson}
        className="mb-6 w-full max-w-[340px] cursor-pointer rounded-xl border border-[#3B3F6E] bg-[#F7F1E6] py-4 text-[14px] font-semibold text-[#3B3F6E] transition-colors hover:bg-[#E8E6F5]"
      >
        View lesson
      </button>

      <button
        type="button"
        onClick={onBackToLibrary}
        className="cursor-pointer text-[13px] font-medium text-graphite-60 transition-colors hover:text-graphite"
      >
        Back to library
      </button>
    </div>
  );
}
