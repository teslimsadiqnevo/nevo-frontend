"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/shared/ui";
import { completeTeacherProfileSetup, getTeacherUploadUrl } from "@/features/Dashboard/api/teacher";

const SUBJECTS = [
    "Mathematics", "English", "Science", "History", 
    "Geography", "Arts", "Physical Education", "Other"
];

const EDUCATION_LEVELS = [
    "Primary", "Secondary", "Tertiary"
];

export default function ProfileSetupPage() {
    const router = useRouter();
    
    const [fullName, setFullName] = useState("");
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            setPhotoUrl(url);
            setPhotoFile(file);
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const toggleSubject = (subject: string) => {
        setSelectedSubjects(prev => 
            prev.includes(subject) 
                ? prev.filter(s => s !== subject) 
                : [...prev, subject]
        );
    };

    const toggleLevel = (level: string) => {
        setSelectedLevels(prev => 
            prev.includes(level) 
                ? prev.filter(l => l !== level) 
                : [...prev, level]
        );
    };

    const isComplete = fullName.trim() !== "" && selectedSubjects.length > 0 && selectedLevels.length > 0;

    const handleComplete = async () => {
        if (!isComplete) return;
        setLoading(true);
        setError(null);

        let uploadedPhotoUrl: string | null = null;
        if (photoFile) {
            const uploadRes = await getTeacherUploadUrl({
                filename: photoFile.name,
                content_type: photoFile.type || "image/jpeg",
            });
            if (!uploadRes.error && "data" in uploadRes) {
                uploadedPhotoUrl = uploadRes.data?.file_url || uploadRes.data?.url || null;
            }
        }

        const result = await completeTeacherProfileSetup({
            display_name: fullName.trim(),
            subjects: selectedSubjects,
            education_levels: selectedLevels,
            avatar_url: uploadedPhotoUrl,
        });
        setLoading(false);
        if (result.error) {
            setError(result.error);
            return;
        }
        router.push("/dashboard");
    };

    return (
        <div className="flex-1 w-full flex flex-col items-center mt-6 mb-10 px-6 mx-auto min-h-screen relative">
            <div className="w-full flex items-center justify-between mb-8">
                <button type="button" onClick={() => router.back()} className="text-[#3B3F6E] opacity-70 hover:opacity-100 transition-opacity p-2 -ml-2 cursor-pointer">
                    <Icon type="back" width={16} height={16} />
                </button>
                <span className="text-[13px] text-[#A29ECA] font-medium tracking-wide">Final step</span>
            </div>

            <h1 className="font-extrabold text-[#3B3F6E] text-[20px] text-center mb-8">Set up your profile</h1>

            <div className="flex flex-col items-center mb-8 w-full">
                <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handlePhotoChange} 
                />
                <button 
                    type="button" 
                    onClick={triggerFileSelect}
                    className="w-[72px] h-[72px] rounded-full bg-indigo-20 flex items-center justify-center mb-3 cursor-pointer hover:bg-[#3B3F6E]/20 transition-colors overflow-hidden"
                >
                    {photoUrl ? (
                        <img src={photoUrl} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : (
                        <Icon type="camera" width={28} height={28} />
                    )}
                </button>
                <span onClick={triggerFileSelect} className="text-[12px] text-[#A29ECA] font-medium cursor-pointer hover:text-[#3B3F6E] transition-colors">
                    {photoUrl ? "Change photo" : "Add photo"}
                </span>
            </div>

            <div className="w-full flex flex-col gap-8 mb-10 pl-1">
                <input
                    type="text"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-transparent border border-[#3B3F6E]/30 focus:border-[#3B3F6E] rounded-[8px] px-4 py-[14px] outline-none transition-colors text-[14px] font-medium placeholder:text-[#3B3F6E]/60 text-[#3B3F6E]"
                />

                <div className="flex flex-col gap-3">
                    <label className="text-[11px] font-bold text-graphite/60 tracking-wider uppercase">Subjects You Teach</label>
                    <div className="flex flex-wrap gap-2.5">
                        {SUBJECTS.map((subject) => {
                            const isSelected = selectedSubjects.includes(subject);
                            return (
                                <button
                                    key={subject}
                                    type="button"
                                    onClick={() => toggleSubject(subject)}
                                    className={`px-4 py-[8px] rounded-[10px] text-[13px] font-medium transition-colors cursor-pointer border ${
                                        isSelected 
                                            ? "bg-[#3B3F6E] text-white border-[#3B3F6E]" 
                                            : "bg-transparent text-[#3B3F6E]/80 border-[#3B3F6E]/40 hover:border-[#3B3F6E]"
                                    }`}
                                >
                                    {subject}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <label className="text-[11px] font-bold text-graphite/60 tracking-wider uppercase">Education Level(s)</label>
                    <div className="flex flex-wrap gap-2.5">
                        {EDUCATION_LEVELS.map((level) => {
                            const isSelected = selectedLevels.includes(level);
                            return (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => toggleLevel(level)}
                                    className={`px-4 py-[8px] rounded-[10px] text-[13px] font-medium transition-colors cursor-pointer border ${
                                        isSelected 
                                            ? "bg-[#3B3F6E] text-white border-[#3B3F6E]" 
                                            : "bg-transparent text-[#3B3F6E]/80 border-[#3B3F6E]/40 hover:border-[#3B3F6E]"
                                    }`}
                                >
                                    {level}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="w-full mt-auto mb-6">
                {error && <p className="text-[12px] text-[#E57661] mb-2">{error}</p>}
                <button
                    type="button"
                    onClick={handleComplete}
                    disabled={!isComplete || loading}
                    className={`w-full text-white font-bold rounded-xl py-[14px] text-[14px] outline-none transition-all ${
                        !isComplete || loading
                            ? 'bg-[#9A9BB5] cursor-not-allowed opacity-90'
                            : 'bg-[#3B3F6E] hover:opacity-90 active:scale-[0.98] cursor-pointer'
                    }`}
                >
                    {loading ? "Completing..." : "Complete setup"}
                </button>
                <p className="text-[11px] text-graphite opacity-60 text-center mt-3 font-medium">
                    You can update this anytime in your profile.
                </p>
            </div>
        </div>
    );
}
