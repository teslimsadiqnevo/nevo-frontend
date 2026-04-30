'use client';

import { useState } from 'react';

type LessonStatus = 'Published' | 'Draft';

export interface Lesson {
    id: number;
    title: string;
    subject: string;
    level: string;
    duration: number;
    status: LessonStatus;
    lastUpdated: string;
    signal?: { type: 'warning' | 'success'; text: string };
}

export function LessonDetailsView({ lesson, onBack }: { lesson: Lesson; onBack: () => void }) {
    const [mode, setMode] = useState<'view' | 'edit'>('view');
    const [showDuplicate, setShowDuplicate] = useState(false);
    const [showArchive, setShowArchive] = useState(false);
    const [showDelete, setShowDelete] = useState(false);

    if (mode === 'edit') {
        return <LessonEditView lesson={lesson} onCancel={() => setMode('view')} onSave={() => setMode('view')} />;
    }

    return (
        <div className="flex flex-col h-full w-full max-w-[900px] bg-[#FDFBF9] rounded-3xl border border-[#E9E7E2] relative min-h-[calc(100vh-100px)] overflow-hidden shadow-sm">
            {/* Top Bar */}
            <div className="flex items-center pt-6 pb-4 px-8">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-[14px] text-[#3B3F6E] font-medium hover:text-[#2B2B2F] transition-colors"
                >
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 4L6 10L12 16" />
                    </svg>
                    Lessons
                </button>
            </div>

            {/* Banner */}
            <div className="bg-[#3B3F6E] py-6 px-8 text-white flex justify-between items-center">
                <h1 className="text-xl font-semibold leading-tight">{lesson.title}</h1>
                <div className="flex gap-3 items-center shrink-0">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold tracking-widest uppercase">{lesson.subject}</span>
                    <span className={`px-3 py-1 rounded-full text-[12px] font-bold ${lesson.status === 'Published' ? 'bg-[#81C784] text-[#1B5E20]' : 'bg-[#C5C0DF] text-[#3B3F6E]'}`}>
                        {lesson.status}
                    </span>
                </div>
            </div>

            <div className="flex-1 pb-28 pt-6 px-8">
                {/* Meta details */}
                <div className="flex items-center gap-3 mb-8">
                    <span className="px-3 py-1.5 bg-[#E8E6F5] text-[#3B3F6E] text-[11px] font-bold tracking-widest uppercase rounded-full">
                        {lesson.level}
                    </span>
                    <span className="px-3 py-1.5 bg-[#E8E6F5] text-[#3B3F6E] text-[13px] font-medium flex items-center gap-1.5 rounded-full">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        ~{lesson.duration} min
                    </span>
                    <span className="px-3 py-1.5 bg-[#E8E6F5] text-[#3B3F6E] flex items-center gap-2 rounded-full">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="23 7 16 12 23 17 23 7" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                        </svg>
                    </span>
                </div>

                {/* Objectives */}
                <div className="mb-8 block">
                    <h3 className="text-[12.5px] font-bold text-[#6E74AA] tracking-wider uppercase mb-4">OBJECTIVES</h3>
                    <ul className="space-y-3">
                        {['Understand algebraic expressions and variables', 'Solve simple linear equations step by step', 'Apply algebraic thinking to real-world problems', 'Recognize patterns in mathematical relationships'].map((obj, i) => (
                            <li key={i} className="flex gap-2.5 items-start text-[14px] text-[#2B2B2F]">
                                <span className="text-[#3B3F6E] text-lg leading-4 mt-[3px]">•</span>
                                {obj}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Checkpoints */}
                <div className="mb-8 block">
                    <h3 className="text-[12.5px] font-bold text-[#6E74AA] tracking-wider uppercase mb-4">CHECKPOINTS</h3>
                    <div className="flex items-center justify-between py-2 border-b border-transparent">
                        <span className="text-[14px] text-[#2B2B2F]">1. Section 3 — Comprehension check</span>
                        <button className="text-[#6E74AA] hover:text-[#3B3F6E] transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-transparent">
                        <span className="text-[14px] text-[#2B2B2F]">2. Section 6 — Comprehension check</span>
                        <button className="text-[#6E74AA] hover:text-[#3B3F6E] transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button>
                    </div>
                </div>

                {/* Assignments */}
                <div className="mb-8 block">
                    <h3 className="text-[12.5px] font-bold text-[#6E74AA] tracking-wider uppercase mb-4">
                        ASSIGNMENTS {lesson.status === 'Published' && '(3)'}
                    </h3>
                    {lesson.status !== 'Published' ? (
                        <div className="py-12 flex justify-center items-center text-[#9B9B9B] text-[14px]">
                            Not yet assigned
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {[
                                { class: 'JSS 2 Mathematics', meta: 'Assigned 3 days ago · 14 of 18 students completed' },
                                { class: 'JSS 3 Science', meta: 'Assigned 1 week ago · 22 of 25 students completed' },
                                { class: 'JSS 1 General Mathematics', meta: 'Assigned 2 weeks ago · 31 of 34 students completed' }
                            ].map((assignment, i) => (
                                <div key={i} className="flex items-center justify-between border-b border-[#E9E7E2] py-4 last:border-none cursor-pointer group">
                                    <div>
                                        <p className="text-[14px] font-bold text-[#2B2B2F] mb-1">{assignment.class}</p>
                                        <p className="text-[12.5px] text-graphite-60">{assignment.meta}</p>
                                    </div>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9B9B9B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[#3B3F6E] transition-colors">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Performance Signals */}
                {lesson.status === 'Published' && (
                    <div className="mb-10 block">
                        <h3 className="text-[12.5px] font-bold text-[#6E74AA] tracking-wider uppercase mb-4">PERFORMANCE SIGNALS</h3>
                        <p className="font-bold text-[#3B3F6E] text-[14px] mb-4">How students are doing</p>
                        <ul className="space-y-4">
                            <li className="text-[13px] text-graphite-60">Section 4 triggered Simplify 6 times</li>
                            <li className="text-[13px] text-graphite-60">Section 2 had high comprehension scores</li>
                            <li className="text-[13px] text-graphite-60">Students spent average 8 minutes on Section 5</li>
                        </ul>
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="absolute bottom-0 left-0 w-full border-t border-[#E9E7E2] bg-[#FDFBF9] py-4 px-8 flex justify-between">
                <button className="flex flex-col items-center gap-1.5 text-[#6E74AA] hover:text-[#3B3F6E] transition-colors group">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    <span className="text-[11px] font-medium">Assign</span>
                </button>
                <button onClick={() => setMode('edit')} className="flex flex-col items-center gap-1.5 text-[#6E74AA] hover:text-[#3B3F6E] transition-colors group">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    <span className="text-[11px] font-medium">Edit</span>
                </button>
                <button onClick={() => setShowDuplicate(true)} className="flex flex-col items-center gap-1.5 text-[#6E74AA] hover:text-[#3B3F6E] transition-colors group">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    <span className="text-[11px] font-medium">Duplicate</span>
                </button>
                <button onClick={() => setShowArchive(true)} className="flex flex-col items-center gap-1.5 text-[#6E74AA] hover:text-[#3B3F6E] transition-colors group">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" /></svg>
                    <span className="text-[11px] font-medium">Archive</span>
                </button>
                <button onClick={() => setShowDelete(true)} className="flex flex-col items-center gap-1.5 text-[#6E74AA] hover:text-[#DF3848] transition-colors group">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    <span className="text-[11px] font-medium">Delete</span>
                </button>
            </div>

            {/* Duplicate Modal */}
            {showDuplicate && (
                <div className="fixed inset-0 bg-black/40 z-[100] flex flex-col justify-end">
                    <div className="bg-[#FDFBF9] w-full max-w-[900px] lg:ml-[250px] lg:w-[calc(100%-250px)] mx-auto rounded-t-3xl p-6 pb-8 flex flex-col items-center">
                        <div className="w-10 h-1 bg-[#D0CCC5] rounded-full mb-6" />
                        <h3 className="text-[16px] font-bold text-[#3B3F6E] mb-1">Duplicate this lesson?</h3>
                        <p className="text-[13px] text-graphite-60 mb-8">{lesson.title}</p>
                        
                        <div className="w-full max-w-[500px]">
                            <label className="text-[11px] font-bold text-[#6E74AA] uppercase tracking-wider mb-2 block">Name your copy</label>
                            <input 
                                type="text"
                                defaultValue={`Copy of ${lesson.title}`}
                                className="w-full border border-[#E0DDD8] rounded-xl px-4 py-3.5 text-[14px] text-[#2B2B2F] mb-6 focus:outline-none focus:border-[#3B3F6E] bg-white transition-colors"
                            />
                            
                            <button
                                onClick={() => setShowDuplicate(false)}
                                className="w-full py-3.5 rounded-xl bg-[#3B3F6E] text-white font-semibold text-[14px] hover:bg-[#2E3259] transition-colors mb-3"
                            >
                                Create copy
                            </button>
                            <button
                                onClick={() => setShowDuplicate(false)}
                                className="w-full py-3 text-[#6E74AA] text-[13px] font-medium hover:text-[#3B3F6E] transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Archive Modal */}
            {showArchive && (
                <div className="fixed inset-0 bg-black/40 z-[100] flex flex-col justify-end">
                    <div className="bg-[#FDFBF9] w-full max-w-[900px] lg:ml-[250px] lg:w-[calc(100%-250px)] mx-auto rounded-t-3xl p-6 pb-8 flex flex-col items-center">
                        <div className="w-10 h-1 bg-[#D0CCC5] rounded-full mb-8" />
                        <h3 className="text-[16px] font-bold text-[#3B3F6E] mb-2">Archive this lesson?</h3>
                        <p className="text-[14px] text-graphite-60 mb-4">Students with active assignments can still complete it.</p>
                        
                        {lesson.status === 'Published' && (
                            <span className="px-3.5 py-1.5 bg-[#F5E6CA] text-[#A67C00] rounded-full text-[12px] font-medium mb-8">
                                3 active assignments
                            </span>
                        )}
                        {(!lesson.status || lesson.status !== 'Published') && <div className="h-4" />}
                        
                        <div className="flex flex-col gap-3 w-full max-w-[500px]">
                            <button
                                onClick={() => setShowArchive(false)}
                                className="w-full py-3.5 rounded-xl border border-[#E9E7E2] text-[#2B2B2F] font-semibold text-[14px] bg-transparent hover:bg-white transition-colors"
                            >
                                Archive lesson
                            </button>
                            <button
                                onClick={() => setShowArchive(false)}
                                className="w-full py-3.5 rounded-xl bg-[#3B3F6E] text-white font-semibold text-[14px] hover:bg-[#2E3259] transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDelete && (
                <div className="fixed inset-0 bg-black/40 z-[100] flex flex-col justify-end">
                    <div className="bg-[#FDFBF9] w-full max-w-[900px] lg:ml-[250px] lg:w-[calc(100%-250px)] mx-auto rounded-t-3xl p-6 pb-8 flex flex-col items-center">
                        <div className="w-10 h-1 bg-[#D0CCC5] rounded-full mb-8" />
                        <h3 className="text-[16px] font-bold text-[#3B3F6E] mb-2">Delete this lesson?</h3>
                        <p className="text-[14px] text-graphite-60 mb-4 text-center">This action cannot be undone. All lesson data will be permanently deleted.</p>
                        
                        {lesson.status === 'Published' && (
                            <span className="px-3.5 py-1.5 bg-[#F5E6CA] text-[#A67C00] rounded-full text-[12px] font-medium mb-8">
                                3 active assignments
                            </span>
                        )}
                        {(!lesson.status || lesson.status !== 'Published') && <div className="h-4" />}
                        
                        <div className="flex flex-col gap-3 w-full max-w-[500px]">
                            <button
                                onClick={() => setShowDelete(false)}
                                className="w-full py-3.5 rounded-xl bg-[#DF3848] text-white font-semibold text-[14px] hover:bg-[#C92938] transition-colors"
                            >
                                Delete lesson
                            </button>
                            <button
                                onClick={() => setShowDelete(false)}
                                className="w-full py-3.5 rounded-xl border border-[#E9E7E2] text-graphite-60 font-semibold text-[14px] bg-transparent hover:bg-white transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function LessonEditView({ lesson, onCancel, onSave }: { lesson: Lesson; onCancel: () => void; onSave: () => void }) {
    const initialSimplify = true;
    const initialExpand = false;
    const initialDifficulty = 50;
    const initialFreq = 'Every section';

    const [simplifyToggle, setSimplifyToggle] = useState(initialSimplify);
    const [expandToggle, setExpandToggle] = useState(initialExpand);
    const [difficulty, setDifficulty] = useState(initialDifficulty);
    const [freq, setFreq] = useState(initialFreq);

    const isDirty = simplifyToggle !== initialSimplify || expandToggle !== initialExpand || difficulty !== initialDifficulty || freq !== initialFreq;
    const [showDiscard, setShowDiscard] = useState(false);

    const handleCancel = () => {
        if (isDirty) setShowDiscard(true);
        else onCancel();
    };

    return (
        <div className="flex flex-col h-full w-full max-w-[900px] bg-[#FDFBF9] rounded-3xl border border-[#E9E7E2] relative min-h-[calc(100vh-100px)] overflow-hidden shadow-sm">
            {/* Top Bar */}
            <div className="flex items-center justify-between pt-6 pb-6 px-8 border-b border-[#E9E7E2]">
                <div className="flex gap-4 items-center">
                    <button
                        onClick={handleCancel}
                        className="p-1 hover:bg-black/5 rounded-lg transition-colors cursor-pointer text-[#3B3F6E]"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M12 4L6 10L12 16" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    {isDirty && (
                        <span className="px-3 py-1 bg-[#F5E6CA] text-[#A67C00] rounded-full text-[11px] font-bold uppercase tracking-wider">Unsaved changes</span>
                    )}
                </div>
                <span className="text-lg text-[#3B3F6E] font-semibold flex-1 text-center pr-24">Edit lesson</span>
            </div>

            <div className="flex-1 pb-32 px-8 pt-8">
                {/* Uploaded File Banner */}
                <div className="bg-white rounded-xl border border-[#E9E7E2] px-4 py-4 flex items-center justify-between mb-8 shadow-sm">
                    <div className="flex items-center gap-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6E74AA" strokeWidth="1.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                        </svg>
                        <span className="text-[15px] font-medium text-[#2B2B2F]">{lesson.title.replace(/ /g, '_')}.pdf</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                        <span className="px-2 py-0.5 bg-[#E8F5E9] text-[#2E7D32] rounded-full text-[10px] font-bold uppercase">Uploaded</span>
                    </div>
                    <button className="text-graphite-40 hover:text-graphite transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>

                {/* Objectives */}
                <div className="mb-8">
                    <h3 className="text-[12.5px] font-bold text-[#3B3F6E] tracking-wider uppercase mb-3">LEARNING OBJECTIVES</h3>
                    <textarea 
                        className="w-full bg-white border border-[#3B3F6E] rounded-xl p-5 text-[14.5px] text-[#2B2B2F] outline-none resize-none min-h-[110px]"
                        defaultValue="Students will understand algebraic expressions, solve simple equations, apply algebra to real-world problems, and develop critical thinking skills"
                    />
                    <div className="flex gap-3 mt-3">
                        <button className="px-4 py-2 bg-[#E8E6F5] text-[#3B3F6E] font-medium text-[13px] rounded-lg hover:bg-indigo-10 transition-colors flex items-center gap-1.5">
                            ✨ Use simpler language
                        </button>
                        <button className="px-4 py-2 bg-[#E8E6F5] text-[#3B3F6E] font-medium text-[13px] rounded-lg hover:bg-indigo-10 transition-colors flex items-center gap-1.5">
                            ✨ Add assessment criteria
                        </button>
                    </div>
                </div>

                {/* Key Concepts */}
                <div className="mb-10">
                    <h3 className="text-[12.5px] font-bold text-[#3B3F6E] tracking-wider uppercase mb-3">KEY CONCEPTS</h3>
                    <div className="flex flex-wrap gap-2.5 mb-3">
                        {['Variables', 'Equations', 'Expressions', 'Problem Solving'].map(concept => (
                            <div key={concept} className="flex items-center gap-1.5 bg-[#3B3F6E] text-white px-3.5 py-1.5 rounded-full text-[13px] font-medium shadow-sm">
                                {concept}
                                <button className="hover:text-white/70 transition-colors mt-[1.5px]"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
                            </div>
                        ))}
                    </div>
                    <input type="text" placeholder="+ Add concept" className="border border-[#E9E7E2] bg-white rounded-xl w-full px-5 py-3.5 text-[14.5px] text-[#2B2B2F] placeholder-[#9B9B9B] outline-none focus:border-[#3B3F6E] transition-colors" />
                </div>

                {/* Adaptation Settings */}
                <div className="mb-8">
                    <h3 className="text-[12.5px] font-bold text-[#3B3F6E] tracking-wider uppercase mb-5">ADAPTATION SETTINGS</h3>
                    
                    <div className="flex items-center gap-2 mb-8 border border-[#E0DDD8] w-max rounded-full p-[3px] bg-[#FDFBF9]">
                        {['After each page', 'Every section', 'End of lesson'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFreq(f)}
                                className={`px-5 py-2.5 rounded-full text-[13px] font-medium transition-colors ${
                                    f === freq ? 'bg-[#3B3F6E] text-white shadow-sm' : 'text-[#6E74AA] hover:text-[#3B3F6E]'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-between items-center mb-6">
                        <span className="text-[14.5px] text-[#2B2B2F]">Simplify complex terms</span>
                        <button
                            onClick={() => setSimplifyToggle(!simplifyToggle)}
                            className={`w-[44px] h-[24px] rounded-full flex items-center px-1 transition-colors ${simplifyToggle ? 'bg-[#3B3F6E]' : 'bg-[#D0CCC5]'}`}
                        >
                            <div className={`w-[18px] h-[18px] bg-white rounded-full transition-transform ${simplifyToggle ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="flex justify-between items-center mb-8">
                        <span className="text-[14.5px] text-[#2B2B2F]">Expand explanations</span>
                        <button
                            onClick={() => setExpandToggle(!expandToggle)}
                            className={`w-[44px] h-[24px] rounded-full flex items-center px-1 transition-colors ${expandToggle ? 'bg-[#3B3F6E]' : 'bg-[#D0CCC5]'}`}
                        >
                            <div className={`w-[18px] h-[18px] bg-white rounded-full transition-transform ${expandToggle ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[14.5px] text-[#2B2B2F]">Difficulty level</span>
                            <span className="text-[13px] text-[#3B3F6E] font-medium">{difficulty > 66 ? 'Advanced' : difficulty > 33 ? 'Moderate' : 'Accessible'}</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" max="100" 
                            value={difficulty} 
                            onChange={(e) => setDifficulty(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-[#C5C0DF] rounded-full appearance-none outline-none slider-thumb cursor-pointer"
                        />
                        <style dangerouslySetInnerHTML={{__html: `
                            .slider-thumb::-webkit-slider-thumb {
                                appearance: none;
                                width: 18px;
                                height: 18px;
                                border-radius: 50%;
                                background: #3B3F6E;
                                cursor: pointer;
                            }
                        `}} />
                    </div>
                </div>
            </div>

            {/* Edit Bottom Actions */}
            <div className="absolute bottom-0 left-0 w-full border-t border-[#E9E7E2] bg-[#FDFBF9] py-4 px-8 flex justify-between gap-4">
                <button
                    onClick={handleCancel}
                    className="flex-1 py-3.5 rounded-xl border border-[#3B3F6E] text-[#3B3F6E] font-semibold text-[14px] bg-transparent hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={onSave}
                    className="flex-1 py-3.5 rounded-xl bg-[#3B3F6E] text-white font-semibold text-[14px] hover:bg-[#2E3259] transition-all"
                >
                    Save changes
                </button>
            </div>

            {/* Discard Modal */}
            {showDiscard && (
                <div className="fixed inset-0 bg-black/40 z-[100] flex flex-col justify-end">
                    <div className="bg-[#FDFBF9] w-full max-w-[900px] lg:ml-[250px] lg:w-[calc(100%-250px)] mx-auto rounded-t-3xl p-6 pb-12 flex flex-col items-center">
                        <div className="w-10 h-1 bg-[#D0CCC5] rounded-full mb-6" />
                        <h3 className="text-[16px] font-bold text-[#3B3F6E] mb-2">Discard changes?</h3>
                        <p className="text-[14px] text-graphite-60 mb-8">Your edits haven't been saved.</p>
                        
                        <div className="flex gap-4 w-full max-w-[400px]">
                            <button
                                onClick={onCancel}
                                className="flex-1 py-3.5 rounded-xl border border-[#EF4444] text-[#EF4444] font-semibold text-[14px] bg-[#FEF2F2] hover:bg-[#FCE8E8] transition-colors"
                            >
                                Discard
                            </button>
                            <button
                                onClick={() => setShowDiscard(false)}
                                className="flex-1 py-3.5 rounded-xl bg-[#3B3F6E] text-white font-semibold text-[14px] hover:bg-[#2E3259] transition-colors"
                            >
                                Keep editing
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
