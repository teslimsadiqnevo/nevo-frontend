'use client';

import { useState, useRef, useEffect } from 'react';

/* ─── Types ─── */
interface LessonMeta {
    title: string;
    subject: string;
    educationLevel: string;
    duration: string;
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

interface UploadedFile {
    name: string;
    size: string;
    file: File;
}

const SUBJECTS = ['Mathematics', 'English', 'Science', 'History', 'Geography', 'Arts', 'Physical Education', 'Other'];
const LEVELS = ['Primary', 'Secondary', 'Tertiary'];
const DURATIONS = ['Under 15 mins', '15–30 mins', '30+ mins'];
const TOTAL_STEPS = 5;

async function publishLessonFromClient(payload: {
    title: string;
    content: string;
    description?: string;
    subject?: string;
    topic?: string;
    target_grade_level?: number;
    file?: File | null;
}) {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('content', payload.content);
    if (payload.description) formData.append('description', payload.description);
    if (payload.subject) formData.append('subject', payload.subject);
    if (payload.topic) formData.append('topic', payload.topic);
    if (typeof payload.target_grade_level === 'number') {
        formData.append('target_grade_level', String(payload.target_grade_level));
    }
    if (payload.file) formData.append('file', payload.file);

    const res = await fetch('/api/teacher/lessons', {
        method: 'POST',
        body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const detail = (data as any)?.detail || (data as any)?.message || 'Could not publish lesson.';
        return { error: String(detail) };
    }
    return { data };
}

export function AddLessonWizard({ onClose, onAssign }: { onClose: () => void; onAssign?: () => void }) {
    const [step, setStep] = useState(1);
    const [showSuccess, setShowSuccess] = useState(false);
    const [meta, setMeta] = useState<LessonMeta>({ title: '', subject: '', educationLevel: '', duration: '' });
    const [uploadState, setUploadState] = useState<UploadState>('idle');
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [learningObjectives, setLearningObjectives] = useState('');
    const [keyConcepts, setKeyConcepts] = useState<string[]>([]);
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishError, setPublishError] = useState<string | null>(null);

    const canContinueStep1 = meta.title.trim() && meta.subject && meta.educationLevel;

    const handleContinue = () => {
        if (step < TOTAL_STEPS) setStep(step + 1);
        else onClose(); // Finish wizard
    };

    const handleBack = () => {
        if (step === 1) {
            onClose();
        } else {
            setStep(step - 1);
        }
    };

    /* Simulate upload */
    const simulateUpload = (file: File, fileName: string, fileSize: string) => {
        setUploadedFile({ file, name: fileName, size: fileSize });
        setUploadState('uploading');
        setUploadProgress(0);

        // If file is > 50MB, fail it
        const sizeVal = parseFloat(fileSize);
        const willFail = sizeVal > 50 || fileName.toLowerCase().endsWith('.txt');

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 20 + 5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setUploadProgress(100);
                setTimeout(() => setUploadState(willFail ? 'error' : 'done'), 400);
            } else {
                setUploadProgress(progress);
            }
        }, 300);
    };

    if (showSuccess) {
        return <SuccessScreen meta={meta} onBack={onClose} onAssign={onAssign} />;
    }

    return (
        <div className="flex flex-col h-full w-full max-w-[900px] pb-12">
            {/* Header */}
            <div className="flex items-center mb-6">
                <button
                    onClick={handleBack}
                    className="p-1 hover:bg-white/40 rounded-lg transition-colors cursor-pointer"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#3B3F6E" strokeWidth="1.8">
                        <path d="M12 4L6 10L12 16" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <span className="flex-1 text-center text-[13px] text-[#6E74AA] font-medium">
                    Step {step} of {TOTAL_STEPS}
                </span>
            </div>

            {step === 1 && (
                <Step1Details
                    meta={meta}
                    setMeta={setMeta}
                    canContinue={!!canContinueStep1}
                    onContinue={handleContinue}
                />
            )}

            {step === 2 && (
                <Step2Upload
                    uploadState={uploadState}
                    uploadedFile={uploadedFile}
                    uploadProgress={uploadProgress}
                    onFileSelect={simulateUpload}
                    onContinue={handleContinue}
                />
            )}

            {step === 3 && (
                <Step3Learning
                    initialObjectives={learningObjectives}
                    initialConcepts={keyConcepts}
                    onContinue={(objectives, concepts) => {
                        setLearningObjectives(objectives);
                        setKeyConcepts(concepts);
                        handleContinue();
                    }}
                />
            )}

            {step === 4 && (
                <Step4Adaptation onContinue={handleContinue} onSkip={handleContinue} />
            )}

            {step === 5 && (
                <Step5Review
                    meta={meta}
                    onDraft={onClose}
                    isPublishing={isPublishing}
                    publishError={publishError}
                    onPublish={async () => {
                        setPublishError(null);
                        setIsPublishing(true);
                        const content = learningObjectives.trim() || keyConcepts.join(', ') || meta.title;
                        const description = learningObjectives.trim()
                            ? learningObjectives.trim().slice(0, 240)
                            : '';
                        const topic = keyConcepts.length > 0 ? keyConcepts.join(' · ') : meta.subject;
                        const levelMap: Record<string, number> = {
                            Primary: 3,
                            Secondary: 8,
                            Tertiary: 12,
                        };

                        const result = await publishLessonFromClient({
                            title: meta.title.trim(),
                            content,
                            description,
                            subject: meta.subject || undefined,
                            topic: topic || undefined,
                            target_grade_level: levelMap[meta.educationLevel] ?? 3,
                            file: uploadedFile?.file || null,
                        });

                        if ('error' in result) {
                            setPublishError(result.error || 'Could not publish lesson. Please try again.');
                            setIsPublishing(false);
                            return;
                        }

                        setIsPublishing(false);
                        setShowSuccess(true);
                    }}
                />
            )}
        </div>
    );
}

/* ─── Step 1: Lesson Details ─── */
function Step1Details({
    meta,
    setMeta,
    canContinue,
    onContinue,
}: {
    meta: LessonMeta;
    setMeta: React.Dispatch<React.SetStateAction<LessonMeta>>;
    canContinue: boolean;
    onContinue: () => void;
}) {
    return (
        <>
            <h2 className="text-[20px] font-semibold text-[#3B3F6E] mb-6">Add a new lesson</h2>

            {/* Title */}
            <div className="mb-6">
                <label className="text-[11px] font-bold text-graphite-60 tracking-wider uppercase mb-2 block">
                    Lesson title
                </label>
                <input
                    type="text"
                    value={meta.title}
                    onChange={(e) => setMeta(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Introduction to Algebra"
                    className="w-full px-5 py-3.5 rounded-xl border border-[#E0DDD8] bg-white text-[14px] text-[#2B2B2F] font-medium outline-none focus:border-[#3B3F6E] transition-colors placeholder-graphite-40"
                />
            </div>

            {/* Subject */}
            <div className="mb-6">
                <label className="text-[11px] font-bold text-graphite-60 tracking-wider uppercase mb-2.5 block">
                    Subject
                </label>
                <div className="flex flex-wrap gap-2">
                    {SUBJECTS.map((s) => (
                        <button
                            key={s}
                            onClick={() => setMeta(prev => ({ ...prev, subject: prev.subject === s ? '' : s }))}
                            className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition-colors cursor-pointer ${
                                meta.subject === s
                                    ? 'bg-[#3B3F6E] text-white border-[#3B3F6E]'
                                    : 'bg-white text-[#2B2B2F] border-[#E0DDD8] hover:border-[#3B3F6E]'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Education Level */}
            <div className="mb-6">
                <label className="text-[11px] font-bold text-graphite-60 tracking-wider uppercase mb-2.5 block">
                    Education level
                </label>
                <div className="flex flex-wrap gap-2">
                    {LEVELS.map((l) => (
                        <button
                            key={l}
                            onClick={() => setMeta(prev => ({ ...prev, educationLevel: prev.educationLevel === l ? '' : l }))}
                            className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition-colors cursor-pointer ${
                                meta.educationLevel === l
                                    ? 'bg-[#3B3F6E] text-white border-[#3B3F6E]'
                                    : 'bg-white text-[#2B2B2F] border-[#E0DDD8] hover:border-[#3B3F6E]'
                            }`}
                        >
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            {/* Estimated Duration */}
            <div className="mb-8">
                <div className="flex items-baseline justify-between mb-2.5">
                    <label className="text-[11px] font-bold text-graphite-60 tracking-wider uppercase">
                        Estimated duration
                    </label>
                    <span className="text-[11px] text-graphite-40 italic">Optional</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {DURATIONS.map((d) => (
                        <button
                            key={d}
                            onClick={() => setMeta(prev => ({ ...prev, duration: prev.duration === d ? '' : d }))}
                            className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition-colors cursor-pointer ${
                                meta.duration === d
                                    ? 'bg-[#3B3F6E] text-white border-[#3B3F6E]'
                                    : 'bg-white text-[#2B2B2F] border-[#E0DDD8] hover:border-[#3B3F6E]'
                            }`}
                        >
                            {d}
                        </button>
                    ))}
                </div>
            </div>

            {/* Continue */}
            <button
                disabled={!canContinue}
                onClick={onContinue}
                className={`w-full py-3.5 rounded-2xl font-semibold text-[14px] transition-all cursor-pointer mt-auto ${
                    canContinue
                        ? 'bg-[#3B3F6E] text-white hover:bg-[#2E3259]'
                        : 'bg-[#B0ADAD] text-white cursor-not-allowed'
                }`}
            >
                Continue
            </button>
        </>
    );
}

/* ─── Step 2: Upload ─── */
function Step2Upload({
    uploadState,
    uploadedFile,
    uploadProgress,
    onFileSelect,
    onContinue,
}: {
    uploadState: UploadState;
    uploadedFile: UploadedFile | null;
    uploadProgress: number;
    onFileSelect: (file: File, name: string, size: string) => void;
    onContinue: () => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleBrowse = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const sizeMB = (file.size / 1024 / 1024).toFixed(1);
            onFileSelect(file, file.name, `${sizeMB} MB`);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            const sizeMB = (file.size / 1024 / 1024).toFixed(1);
            onFileSelect(file, file.name, `${sizeMB} MB`);
        }
    };

    return (
        <div className="flex flex-col h-full flex-1">
            <h2 className="text-[20px] font-semibold text-[#3B3F6E] mb-2">Upload your lesson</h2>
            <p className="text-[13px] text-graphite-60 mb-6">Upload a PDF or document and Nevo will do the rest.</p>

            {/* Drop zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`rounded-2xl border-2 transition-all flex flex-col items-center justify-center min-h-[220px] mb-3 ${
                    uploadState === 'done'
                        ? 'bg-[#7BC67E] border-[#7BC67E] border-solid'
                        : uploadState === 'error'
                        ? 'bg-[#FDE8E4] border-[#E5533D] border-solid'
                        : uploadState === 'uploading'
                        ? 'bg-[#C5C3E8] border-[#C5C3E8] border-solid'
                        : isDragging
                        ? 'bg-[#E8E6F5] border-[#3B3F6E] border-solid'
                        : 'bg-white border-[#E0DDD8] border-dashed'
                }`}
            >
                {uploadState === 'idle' ? (
                    <>
                        {/* Cloud icon */}
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mb-3">
                            <path d="M20 26V14" stroke="#6E74AA" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M15 18L20 13L25 18" stroke="#6E74AA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M10 28C6 28 4 25 4 22C4 19 6 17 9 16C9 11 13 8 18 8C22 8 25 10 26 13C30 13 34 16 34 20C34 24 31 28 27 28" stroke="#6E74AA" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <p className="text-[14px] font-semibold text-[#3B3F6E] mb-1">Drag and drop your file here</p>
                        <p className="text-[12px] text-graphite-40 mb-3">or</p>
                        <button
                            onClick={handleBrowse}
                            className="px-5 py-2.5 border border-[#3B3F6E] rounded-xl text-[13px] font-semibold text-[#3B3F6E] bg-white hover:bg-indigo-5 transition-colors cursor-pointer"
                        >
                            Browse files
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx,.pptx"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </>
                ) : uploadState === 'uploading' && uploadedFile ? (
                    <div className="flex flex-col items-center px-8 w-full">
                        <p className="text-[14px] font-semibold text-[#3B3F6E] mb-0.5">{uploadedFile.name}</p>
                        <p className="text-[12px] text-[#6E74AA] mb-4">{uploadedFile.size}</p>
                        {/* Progress bar */}
                        <div className="w-[60%] h-[6px] bg-white/50 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#3B3F6E] rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                ) : uploadState === 'done' && uploadedFile ? (
                    <div className="flex flex-col items-center">
                        <p className="text-[14px] font-semibold text-[#3B3F6E] mb-0.5">{uploadedFile.name}</p>
                        <p className="text-[12px] text-[#2E7D32] mb-1">{uploadedFile.size}</p>
                        <p className="text-[13px] font-medium text-white">Uploaded</p>
                    </div>
                ) : uploadState === 'error' ? (
                    <div className="flex flex-col items-center text-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E5533D" strokeWidth="1.5" className="mb-3">
                            <path d="M12 9V13M12 17H12.01M3.86 21H20.14C21.68 21 22.64 19.33 21.87 18L13.73 3.86C12.96 2.53 11.04 2.53 10.27 3.86L2.13 18C1.36 19.33 2.32 21 3.86 21Z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="text-[14px] font-semibold text-[#111111] mb-1">File not supported or too large</p>
                        <p className="text-[12px] text-graphite-60">Try a PDF, DOCX, or PPTX under 50MB</p>
                    </div>
                ) : null}
            </div>

            <p className="text-[12px] text-graphite-40 text-center mb-8">Accepted: PDF, DOCX, PPTX · Max 50MB</p>

            <div className="flex-1" />

            <button
                disabled={uploadState !== 'done'}
                onClick={onContinue}
                className={`w-full py-3.5 rounded-2xl font-semibold text-[14px] transition-all cursor-pointer ${
                    uploadState === 'done'
                        ? 'bg-[#3B3F6E] text-white hover:bg-[#2E3259]'
                        : 'bg-[#B0ADAD] text-white cursor-not-allowed'
                }`}
            >
                Continue
            </button>
        </div>
    );
}

/* ─── Step 3: What will students learn? ─── */
function Step3Learning({
    initialObjectives,
    initialConcepts,
    onContinue,
}: {
    initialObjectives: string;
    initialConcepts: string[];
    onContinue: (objectives: string, concepts: string[]) => void;
}) {
    const [loading, setLoading] = useState(true);
    const [concepts, setConcepts] = useState<string[]>(initialConcepts.length ? initialConcepts : ['Variables', 'Equations']);
    const [newConcept, setNewConcept] = useState('');
    const [objectives, setObjectives] = useState(initialObjectives);
    const suggestedObjectives = [
        'Understand algebraic expressions',
        'Solve simple equations',
        'Apply algebra to problems',
    ];

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    const handleAddConcept = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newConcept.trim()) {
            setConcepts([...concepts, newConcept.trim()]);
            setNewConcept('');
        }
    };

    const removeConcept = (index: number) => {
        setConcepts(concepts.filter((_, i) => i !== index));
    };

    const appendObjective = (suggestion: string) => {
        const text = suggestion.trim();
        if (!text) return;

        const current = objectives.trim();
        if (!current) {
            setObjectives(text);
            return;
        }

        const alreadyIncluded = current.toLowerCase().includes(text.toLowerCase());
        if (alreadyIncluded) return;

        setObjectives(`${current}\n- ${text}`);
    };

    if (loading) {
        return (
            <div className="flex flex-col h-full flex-1">
                <h2 className="text-[20px] font-semibold text-[#3B3F6E] mb-6">What will students learn?</h2>
                
                <div className="flex items-center gap-3 bg-[#E8E6F5] px-4 py-3 rounded-xl mb-16">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8E86C8] animate-pulse" />
                    <span className="text-[13px] font-medium text-[#6E74AA]">Nevo is reading your lesson...</span>
                </div>

                <div className="flex flex-col items-center justify-center flex-1 pb-20">
                    <div className="w-[140px] h-[100px] bg-white rounded-xl shadow-sm border border-[#E0DDD8] flex items-center justify-center mb-6 relative overflow-hidden animate-pulse">
                        <div className="absolute inset-x-4 top-4 h-1.5 bg-[#EEECEA] rounded-full" />
                        <div className="absolute inset-x-4 top-8 h-1.5 bg-[#EEECEA] rounded-full w-2/3" />
                        <div className="absolute inset-x-4 top-12 h-1.5 bg-[#EEECEA] rounded-full w-3/4" />
                        <div className="absolute inset-x-4 top-16 h-1.5 bg-[#EEECEA] rounded-full w-1/2" />
                        {/* More stacked pages effect */}
                        <div className="absolute -bottom-2 -right-2 w-full h-[20px] bg-white shadow-sm border border-[#E0DDD8] rotate-2 rounded-xl" />
                        <div className="absolute -bottom-4 -left-2 w-full h-[20px] bg-white shadow-sm border border-[#E0DDD8] -rotate-3 rounded-xl" />
                    </div>
                    <p className="text-[13px] text-[#3B3F6E]">This usually takes 5–10 seconds</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full flex-1">
            <h2 className="text-[20px] font-semibold text-[#3B3F6E] mb-6">What will students learn?</h2>

            {/* Success Banner */}
            <div className="flex items-center gap-2.5 bg-[#E8F5E9] border border-[#C8E6C9] px-4 py-3 rounded-xl mb-8">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#2E7D32" strokeWidth="1.5">
                    <path d="M3 8.5L6 11.5L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[13px] font-medium text-[#2E7D32]">Key concepts identified. Review below.</span>
            </div>

            {/* Learning Objectives */}
            <div className="mb-6">
                <label className="text-[11px] font-bold text-graphite-60 tracking-wider uppercase mb-2 block">
                    LEARNING OBJECTIVES
                </label>
                <textarea
                    value={objectives}
                    onChange={(e) => setObjectives(e.target.value)}
                    placeholder="What should students understand by the end of this lesson? (AI has suggested some below)"
                    className="w-full px-4 py-3 rounded-xl border border-[#E0DDD8] bg-white text-[13.5px] text-[#2B2B2F] outline-none focus:border-[#3B3F6E] transition-colors placeholder-graphite-40 resize-none h-[100px] mb-3"
                />
                <div className="flex flex-wrap gap-2">
                    {suggestedObjectives.map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => appendObjective(item)}
                            className="px-3.5 py-1.5 rounded-lg border border-[#3B3F6E] text-[12.5px] text-[#3B3F6E] hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>

            {/* Key Concepts */}
            <div className="mb-10">
                <label className="text-[11px] font-bold text-graphite-60 tracking-wider uppercase mb-2 block">
                    KEY CONCEPTS
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                    {concepts.map((concept, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3B3F6E] text-white rounded-lg text-[13px]">
                            {concept}
                            <button onClick={() => removeConcept(i)} className="text-white/70 hover:text-white mt-px">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M3 3L9 9M9 3L3 9" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>
                    ))}
                    <div className="relative">
                        <input
                            type="text"
                            value={newConcept}
                            onChange={(e) => setNewConcept(e.target.value)}
                            onKeyDown={handleAddConcept}
                            placeholder="+ Add concept"
                            className="px-3 py-1.5 rounded-lg border border-[#E0DDD8] bg-white text-[13px] w-[130px] outline-none focus:border-[#3B3F6E]"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1" />

            <button
                onClick={() => onContinue(objectives, concepts)}
                className="w-full py-3.5 rounded-2xl bg-[#3B3F6E] text-white font-semibold text-[14px] hover:bg-[#2E3259] transition-all cursor-pointer"
            >
                Continue
            </button>
        </div>
    );
}

/* ─── Step 4: Adaptation Settings ─── */
function Step4Adaptation({ onContinue, onSkip }: { onContinue: () => void; onSkip: () => void }) {
    const [checkFreq, setCheckFreq] = useState<'section' | '2sections' | '3sections'>('section');
    const [simplified, setSimplified] = useState(true);
    const [expanded, setExpanded] = useState(true);
    const [difficulty, setDifficulty] = useState(50); // 0 = Accessible, 50 = Moderate, 100 = Advanced

    const getDifficultyLabel = () => {
        if (difficulty < 33) return 'Accessible';
        if (difficulty > 66) return 'Advanced';
        return 'Moderate';
    };

    return (
        <div className="flex flex-col h-full flex-1">
            <h2 className="text-[20px] font-semibold text-[#3B3F6E] mb-1">Adaptation settings</h2>
            <p className="text-[13px] text-graphite-60 mb-8">These are optional. Nevo will handle the rest automatically.</p>

            {/* Comprehension checks */}
            <div className="mb-8">
                <span className="inline-block px-2 py-0.5 rounded-full bg-[#E8E6F5] text-[#6E74AA] text-[10px] font-bold uppercase tracking-wider mb-2">Optional</span>
                <p className="text-[14px] text-[#2B2B2F] font-medium mb-3">How often should comprehension checks appear?</p>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setCheckFreq('section')}
                        className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition-colors cursor-pointer ${
                            checkFreq === 'section' ? 'bg-[#3B3F6E] text-white border-[#3B3F6E]' : 'bg-white text-[#2B2B2F] border-[#E0DDD8] hover:border-[#3B3F6E]'
                        }`}
                    >
                        Every section
                    </button>
                    <button
                        onClick={() => setCheckFreq('2sections')}
                        className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition-colors cursor-pointer ${
                            checkFreq === '2sections' ? 'bg-[#3B3F6E] text-white border-[#3B3F6E]' : 'bg-white text-[#2B2B2F] border-[#E0DDD8] hover:border-[#3B3F6E]'
                        }`}
                    >
                        Every 2 sections
                    </button>
                    <button
                        onClick={() => setCheckFreq('3sections')}
                        className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition-colors cursor-pointer ${
                            checkFreq === '3sections' ? 'bg-[#3B3F6E] text-white border-[#3B3F6E]' : 'bg-white text-[#2B2B2F] border-[#E0DDD8] hover:border-[#3B3F6E]'
                        }`}
                    >
                        Every 3 sections
                    </button>
                </div>
            </div>

            {/* Simplified Explanations Switch */}
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-[#E8E6F5] text-[#6E74AA] text-[10px] font-bold uppercase tracking-wider mb-2">Optional</span>
                    <p className="text-[14px] text-[#2B2B2F] font-medium mb-1">Allow simplified explanations</p>
                    <p className="text-[12px] text-graphite-40">Nevo will create a simpler version of each concept for students who need it.</p>
                </div>
                <button
                    onClick={() => setSimplified(!simplified)}
                    className={`w-10 h-6 mt-6 rounded-full flex items-center shrink-0 px-1 transition-colors ${simplified ? 'bg-[#3B3F6E]' : 'bg-[#D0CCC5]'}`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${simplified ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
            </div>

            {/* Expanded Explanations Switch */}
            <div className="mb-10 flex items-start justify-between">
                <div>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-[#E8E6F5] text-[#6E74AA] text-[10px] font-bold uppercase tracking-wider mb-2">Optional</span>
                    <p className="text-[14px] text-[#2B2B2F] font-medium mb-1">Allow expanded explanations</p>
                    <p className="text-[12px] text-graphite-40">Nevo will create an enriched version with more detail and examples.</p>
                </div>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className={`w-10 h-6 mt-6 rounded-full flex items-center shrink-0 px-1 transition-colors ${expanded ? 'bg-[#3B3F6E]' : 'bg-[#D0CCC5]'}`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${expanded ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
            </div>

            {/* Maximum Difficulty Slider */}
            <div className="mb-10">
                <span className="inline-block px-2 py-0.5 rounded-full bg-[#E8E6F5] text-[#6E74AA] text-[10px] font-bold uppercase tracking-wider mb-2">Optional</span>
                <p className="text-[14px] text-[#2B2B2F] font-medium mb-6">Maximum difficulty level</p>
                
                <div className="px-4">
                    <div className="relative w-full h-[4px] bg-[#E0DDD8] rounded-full flex items-center">
                        <div className="absolute left-0 h-full bg-[#3B3F6E] rounded-full" style={{ width: `${difficulty}%` }} />
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={difficulty}
                            onChange={(e) => setDifficulty(parseInt(e.target.value))}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        />
                        <div
                            className="absolute w-4 h-4 bg-[#3B3F6E] rounded-full pointer-events-none -translate-x-1/2 flex items-center justify-center transform scale-125"
                            style={{ left: `${difficulty}%` }}
                        >
                            <span className="absolute -top-7 px-2 py-1 bg-[#3B3F6E] text-white text-[10px] rounded whitespace-nowrap after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-[#3B3F6E]">
                                {getDifficultyLabel()}
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-between text-[11px] text-graphite-40 mt-3 font-medium">
                        <span>Accessible</span>
                        <span>Advanced</span>
                    </div>
                </div>
            </div>

            <div className="flex-1" />

            <button
                onClick={onContinue}
                className="w-full py-3.5 rounded-2xl bg-[#3B3F6E] text-white font-semibold text-[14px] hover:bg-[#2E3259] transition-all cursor-pointer mb-3"
            >
                Continue
            </button>
            
            <button
                onClick={onSkip}
                className="w-full text-center text-[12px] text-graphite-60 font-medium hover:text-graphite transition-colors cursor-pointer"
            >
                Skip all — use Nevo defaults
            </button>
        </div>
    );
}

/* ─── Step 5: Review Before Sending ─── */
function Step5Review({
    meta,
    onDraft,
    onPublish,
    isPublishing,
    publishError,
}: {
    meta: LessonMeta;
    onDraft: () => void;
    onPublish: () => void;
    isPublishing: boolean;
    publishError: string | null;
}) {
    const [classes, setClasses] = useState<string[]>([]);
    
    // Simulate toggling a class
    const handlePickClass = () => {
        if (classes.length === 0) {
            setClasses(['JSS 2 Mathematics (24 students)']);
        } else {
            setClasses([]);
        }
    };

    return (
        <div className="flex flex-col h-full flex-1">
            {/* Banner */}
            <div className="flex items-center gap-2.5 bg-[#E8F5E9] px-4 py-3 rounded-xl mb-8">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#2E7D32" strokeWidth="2">
                    <path d="M3 8.5L6 11.5L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[13px] font-semibold text-[#2B2B2F]">Nevo has prepared your lesson for adaptive delivery.</span>
            </div>

            <h3 className="text-[11px] font-bold text-[#6E74AA] tracking-wider uppercase mb-3">REVIEW BEFORE SENDING</h3>

            {/* Structure Card */}
            <div className="bg-white rounded-xl border border-[#E0DDD8] p-5 mb-3">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[14px] font-semibold text-[#3B3F6E]">Lesson structure</span>
                    <button className="text-[12px] text-[#6E74AA] hover:text-[#3B3F6E] transition-colors cursor-pointer">View full structure</button>
                </div>
                <p className="text-[13px] text-graphite-60">8 sections · 4 checkpoints · Est. 25 min</p>
            </div>

            {/* Adaptive Versions Card */}
            <div className="bg-white rounded-xl border border-[#E0DDD8] p-5 mb-3">
                <span className="block text-[14px] font-semibold text-[#3B3F6E] mb-3">Adaptive versions</span>
                <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-3 py-1 bg-[#E8E6F5] text-[#3B3F6E] rounded-md text-[12px] font-medium">Simplified</span>
                    <span className="px-3 py-1 bg-[#E8E6F5] text-[#3B3F6E] rounded-md text-[12px] font-medium">Expanded</span>
                    <span className="px-3 py-1 bg-[#E8E6F5] text-[#3B3F6E] rounded-md text-[12px] font-medium">Slower mode</span>
                </div>
                <p className="text-[12px] text-graphite-40">Nevo will generate personalised versions for each student based on their profile.</p>
            </div>

            {/* Assign Card */}
            <div className="bg-white rounded-xl border border-[#E0DDD8] p-5 mb-8">
                <span className="block text-[14px] font-semibold text-[#3B3F6E] mb-1">Ready to send to</span>
                <p className="text-[12px] text-graphite-60 mb-4">Select students or classes below to assign.</p>
                
                {classes.length === 0 ? (
                    <button
                        onClick={handlePickClass}
                        className="w-full py-4 rounded-xl border border-dashed border-[#D0CCC5] text-[#3B3F6E] text-[13px] font-semibold hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                        + Add class or students
                    </button>
                ) : (
                    <div>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {classes.map((cls) => (
                                <div key={cls} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3B3F6E] text-white rounded-lg text-[13px] font-medium">
                                    {cls}
                                    <button onClick={() => setClasses([])} className="text-white/70 hover:text-white mt-px cursor-pointer">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M3 3L9 9M9 3L3 9" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button className="text-[12px] text-[#6E74AA] hover:text-[#3B3F6E] transition-colors cursor-pointer">+ Add more</button>
                    </div>
                )}
            </div>

            <div className="flex-1" />

            <div className="flex gap-4 mb-2">
                <button
                    onClick={onDraft}
                    className="flex-1 py-3.5 rounded-xl border border-[#3B3F6E] text-[#3B3F6E] font-semibold text-[14px] bg-white hover:bg-indigo-5 transition-colors cursor-pointer"
                >
                    Save as draft
                </button>
                <button
                    onClick={onPublish}
                    disabled={isPublishing}
                    className="flex-1 py-3.5 rounded-xl bg-[#3B3F6E] text-white font-semibold text-[14px] hover:bg-[#2E3259] transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isPublishing ? 'Publishing...' : 'Publish lesson'}
                </button>
            </div>
            {publishError && (
                <p className="text-[12px] text-[#E5533D] mb-2 text-center">{publishError}</p>
            )}
            <p className="text-[11px] text-graphite-40 text-center">Publishing makes this lesson available to assign to students.</p>
        </div>
    );
}

/* ─── Success Screen ─── */
function SuccessScreen({ meta, onBack, onAssign }: { meta: LessonMeta; onBack: () => void; onAssign?: () => void }) {
    return (
        <div className="flex flex-col h-full flex-1 relative items-center justify-center -mt-16">
            {/* Top toast */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#3B3F6E] text-white text-[13px] font-medium px-6 py-3 rounded-lg shadow-sm">
                Lesson added to your library
            </div>

            <div className="w-[88px] h-[88px] bg-[#E8F5E9] rounded-full flex items-center justify-center mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                </svg>
            </div>

            <h2 className="text-[24px] font-bold text-[#2B2B2F] mb-3">Lesson published.</h2>
            <p className="text-[15px] font-medium text-[#6E74AA] mb-6 tracking-tight">{meta.title || 'Introduction to Photosynthesis'}</p>
            <p className="text-[14px] text-graphite-60 mb-8">Your lesson is ready to assign to students.</p>

            <button
                onClick={() => { if (onAssign) onAssign(); else onBack(); }}
                className="w-full max-w-[340px] py-4 rounded-xl bg-[#3B3F6E] text-white font-semibold text-[14px] hover:bg-[#2E3259] transition-all cursor-pointer mb-3"
            >
                Assign now
            </button>
            <button
                onClick={onBack}
                className="w-full max-w-[340px] py-4 rounded-xl border border-[#3B3F6E] text-[#3B3F6E] font-semibold text-[14px] bg-[#F7F1E6] hover:bg-[#E8E6F5] transition-colors cursor-pointer mb-6"
            >
                View lesson
            </button>

            <button onClick={onBack} className="text-[13px] text-graphite-60 font-medium hover:text-graphite transition-colors cursor-pointer">
                Back to library
            </button>
        </div>
    );
}

