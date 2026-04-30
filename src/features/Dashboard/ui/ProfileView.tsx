'use client';

import { useState, useEffect, useRef } from 'react';
import { getTeacherProfile, updateTeacherProfile } from '../api/teacher';

/* ─── Types ─── */
interface ProfileData {
    fullName: string;
    email: string;
    subjects: string[];
    educationLevels: string[];
    avatarUrl?: string;
}

const ALL_SUBJECTS = ['Mathematics', 'English', 'Physics', 'Chemistry'];
const ALL_LEVELS = ['Secondary', 'Primary', 'Tertiary'];

const initialProfile: ProfileData = {
    fullName: '',
    email: '',
    subjects: [],
    educationLevels: [],
    avatarUrl: '',
};

function isBlobUrl(url?: string) {
    return typeof url === 'string' && url.startsWith('blob:');
}

export function ProfileView({
    onBack,
    onProfileSaved,
}: {
    onBack: () => void;
    onProfileSaved?: (profile: ProfileData) => void;
}) {
    const [profile, setProfile] = useState<ProfileData>({ ...initialProfile });
    const [saved, setSaved] = useState<ProfileData>({ ...initialProfile });
    const [showDiscard, setShowDiscard] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [avatarBroken, setAvatarBroken] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewBlobRef = useRef<string | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            console.log('[TeacherProfile][GET] Fetching profile...');
            const res = await getTeacherProfile();
            console.log('[TeacherProfile][GET] Raw response:', res);
            if (!mounted) return;
            if ('data' in res) {
                const payload = res.data || {};
                const p = payload.teacher || payload.profile || payload.data || payload;
                console.log('[TeacherProfile][GET] Parsed profile payload:', p);
                console.log('[TeacherProfile][GET] avatar_url:', p.avatar_url || p.avatarUrl || null);
                const subjects = Array.isArray(p.subjects)
                    ? p.subjects
                    : Array.isArray(p.teaching_context?.subjects)
                        ? p.teaching_context.subjects
                        : [];
                const levels = Array.isArray(p.education_levels)
                    ? p.education_levels
                    : Array.isArray(p.teaching_context?.education_levels)
                        ? p.teaching_context.education_levels
                        : [];
                const mapped: ProfileData = {
                    fullName: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
                    email: p.email || '',
                    subjects,
                    educationLevels: levels,
                    avatarUrl: isBlobUrl(p.avatar_url || p.avatarUrl || '') ? '' : (p.avatar_url || p.avatarUrl || ''),
                };
                setProfile(mapped);
                setSaved(mapped);
                setAvatarBroken(false);
                onProfileSaved?.(mapped);
            } else {
                setNotice('Unable to load profile right now.');
            }
            setIsLoading(false);
        })();
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        return () => {
            if (previewBlobRef.current) {
                URL.revokeObjectURL(previewBlobRef.current);
                previewBlobRef.current = null;
            }
        };
    }, []);

    const hasChanges =
        profile.fullName !== saved.fullName ||
        profile.email !== saved.email ||
        JSON.stringify(profile.subjects) !== JSON.stringify(saved.subjects) ||
        JSON.stringify(profile.educationLevels) !== JSON.stringify(saved.educationLevels) ||
        profile.avatarUrl !== saved.avatarUrl;

    const handleBack = () => {
        if (hasChanges) {
            setShowDiscard(true);
        } else {
            onBack();
        }
    };

    const handleSave = async () => {
        setIsSaving(true);

        const trimmedName = profile.fullName.trim();
        const nameParts = trimmedName.split(/\s+/).filter(Boolean);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ');
        let uploadedAvatarUrl = isBlobUrl(profile.avatarUrl) ? '' : (profile.avatarUrl || '');

        if (avatarFile) {
            const uploadBody = new FormData();
            uploadBody.append('file', avatarFile);

            const uploadRes = await fetch('/api/teacher/avatar-upload', {
                method: 'POST',
                body: uploadBody,
            });
            const uploadJson = await uploadRes.json().catch(() => ({}));
            console.log('[TeacherProfile][UPLOAD] Proxy upload status:', uploadRes.status);
            console.log('[TeacherProfile][UPLOAD] Proxy upload response:', uploadJson);

            if (!uploadRes.ok || !uploadJson?.public_url) {
                setNotice('Could not upload avatar image. Please try again.');
                setIsSaving(false);
                return;
            }

            uploadedAvatarUrl = String(uploadJson.public_url);
        }

        const payload: Record<string, any> = {
            first_name: firstName,
            last_name: lastName,
            subjects: profile.subjects,
            education_levels: profile.educationLevels,
            avatar_url: uploadedAvatarUrl || null,
        };
        console.log('[TeacherProfile][PUT] Payload:', payload);

        const profileRes = await updateTeacherProfile(payload);
        console.log('[TeacherProfile][PUT] Response:', profileRes);

        if ('error' in profileRes) {
            setNotice('Could not save profile. Please try again.');
        } else {
            const nextProfile = { ...profile, avatarUrl: uploadedAvatarUrl };
            setProfile(nextProfile);
            setSaved(nextProfile);
            setAvatarFile(null);
            if (previewBlobRef.current) {
                URL.revokeObjectURL(previewBlobRef.current);
                previewBlobRef.current = null;
            }
            onProfileSaved?.(nextProfile);
            setNotice('Profile saved.');
            setTimeout(() => setNotice(null), 2200);
        }
        setIsSaving(false);
    };

    const handlePhotoPick = () => {
        if (isLoading || isSaving) return;
        fileInputRef.current?.click();
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (previewBlobRef.current) {
            URL.revokeObjectURL(previewBlobRef.current);
            previewBlobRef.current = null;
        }
        const previewUrl = URL.createObjectURL(file);
        previewBlobRef.current = previewUrl;
        setAvatarFile(file);
        setAvatarBroken(false);
        setProfile((prev) => ({ ...prev, avatarUrl: previewUrl }));
    };

    const toggleSubject = (s: string) => {
        setProfile(prev => ({
            ...prev,
            subjects: prev.subjects.includes(s)
                ? prev.subjects.filter(x => x !== s)
                : [...prev.subjects, s],
        }));
    };

    const toggleLevel = (l: string) => {
        setProfile(prev => ({
            ...prev,
            educationLevels: prev.educationLevels.includes(l)
                ? prev.educationLevels.filter(x => x !== l)
                : [...prev.educationLevels, l],
        }));
    };

    const initials = (profile.fullName || 'Teacher')
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    if (isLoading) {
        return <ProfileViewSkeleton />;
    }

    return (
        <div className="flex flex-col h-full w-full max-w-[900px] pb-12 relative">
            {/* Header row */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={handleBack}
                    className="p-1 hover:bg-white/40 rounded-lg transition-colors cursor-pointer"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#3B3F6E" strokeWidth="1.8">
                        <path d="M12 4L6 10L12 16" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                {hasChanges && (
                    <span className="text-[11px] font-semibold text-[#E5533D] bg-[#FDE8E4] px-2.5 py-1 rounded-full">
                        Unsaved changes
                    </span>
                )}

                <h2 className="text-[18px] font-semibold text-[#3B3F6E] flex-1 text-center pr-8">Edit profile</h2>
            </div>

            {notice && (
                <div className="mb-4 px-4 py-2.5 rounded-xl bg-[#E8E4DC] text-[#3B3F6E] text-[12px] font-medium">
                    {notice}
                </div>
            )}

            {/* Avatar */}
            <div className="flex flex-col items-center mb-8">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                />
                <div className="w-[80px] h-[80px] rounded-full bg-[#B0ADAD] overflow-hidden flex items-center justify-center text-white text-[22px] font-bold mb-2">
                    {profile.avatarUrl && !avatarBroken ? (
                        <img
                            src={profile.avatarUrl}
                            alt="Profile photo"
                            className="w-full h-full object-cover"
                            onError={() => setAvatarBroken(true)}
                        />
                    ) : (
                        initials
                    )}
                </div>
                <button
                    type="button"
                    onClick={handlePhotoPick}
                    disabled={isLoading || isSaving}
                    className="text-[13px] font-medium text-[#6E74AA] hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Change photo
                </button>
            </div>

            {/* Full name */}
            <div className="mb-5">
                <label className="text-[13px] text-graphite-60 mb-1.5 block">Full name</label>
                <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                    disabled={isLoading || isSaving}
                    className="w-full px-5 py-3.5 rounded-xl border border-[#E0DDD8] bg-white text-[14px] text-[#2B2B2F] font-medium outline-none focus:border-[#3B3F6E] transition-colors"
                />
            </div>

            {/* Email */}
            <div className="mb-1.5">
                <label className="text-[13px] text-graphite-60 mb-1.5 block">Email</label>
                <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    disabled={isLoading || isSaving}
                    className="w-full px-5 py-3.5 rounded-xl border border-[#E0DDD8] bg-white text-[14px] text-[#2B2B2F] font-medium outline-none focus:border-[#3B3F6E] transition-colors"
                />
            </div>
            <p className="text-[11.5px] text-[#6E74AA] mb-6">Changing email requires reverification</p>

            {/* Subjects */}
            <div className="mb-6">
                <label className="text-[13px] text-graphite-60 mb-2.5 block">Subject(s)</label>
                <div className="flex flex-wrap gap-2">
                    {ALL_SUBJECTS.map((s) => {
                        const selected = profile.subjects.includes(s);
                        return (
                            <button
                                key={s}
                                onClick={() => toggleSubject(s)}
                                disabled={isLoading || isSaving}
                                className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors cursor-pointer border ${
                                    selected
                                        ? 'bg-[#3B3F6E] text-white border-[#3B3F6E]'
                                        : 'bg-white text-[#2B2B2F] border-[#E0DDD8] hover:border-[#3B3F6E]'
                                }`}
                            >
                                {s}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Education levels */}
            <div className="mb-8">
                <label className="text-[13px] text-graphite-60 mb-2.5 block">Education level(s)</label>
                <div className="flex flex-wrap gap-2">
                    {ALL_LEVELS.map((l) => {
                        const selected = profile.educationLevels.includes(l);
                        return (
                            <button
                                key={l}
                                onClick={() => toggleLevel(l)}
                                disabled={isLoading || isSaving}
                                className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors cursor-pointer border ${
                                    selected
                                        ? 'bg-[#3B3F6E] text-white border-[#3B3F6E]'
                                        : 'bg-white text-[#2B2B2F] border-[#E0DDD8] hover:border-[#3B3F6E]'
                                }`}
                            >
                                {l}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Save button */}
            <button
                disabled={!hasChanges || isLoading || isSaving}
                onClick={handleSave}
                className={`w-full py-3.5 rounded-2xl font-semibold text-[14px] transition-all cursor-pointer ${
                    hasChanges && !isSaving && !isLoading
                        ? 'bg-[#3B3F6E] text-white hover:bg-[#2E3259]'
                        : 'bg-[#B0ADAD] text-white cursor-not-allowed'
                }`}
            >
                {isSaving ? 'Saving...' : 'Save changes'}
            </button>

            {/* Discard bottom sheet */}
            {showDiscard && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/30"
                        onClick={() => setShowDiscard(false)}
                    />
                    {/* Sheet */}
                    <div className="relative w-full max-w-[700px] bg-white rounded-t-3xl px-6 pt-4 pb-6 animate-fade-in">
                        {/* Handle */}
                        <div className="mx-auto w-10 h-1 bg-[#D0CCC5] rounded-full mb-6" />

                        <h3 className="text-[16px] font-semibold text-[#2B2B2F] text-center mb-1">Discard changes?</h3>
                        <p className="text-[13px] text-graphite-40 text-center mb-6">Your edits won&apos;t be saved.</p>

                        <button
                            onClick={() => {
                                if (previewBlobRef.current) {
                                    URL.revokeObjectURL(previewBlobRef.current);
                                    previewBlobRef.current = null;
                                }
                                setProfile({ ...saved });
                                setAvatarFile(null);
                                setAvatarBroken(false);
                                setShowDiscard(false);
                                onBack();
                            }}
                            className="w-full py-3.5 rounded-2xl border border-[#3B3F6E] text-[#3B3F6E] font-semibold text-[14px] bg-white hover:bg-indigo-5 transition-colors cursor-pointer mb-3"
                        >
                            Discard
                        </button>
                        <button
                            onClick={() => setShowDiscard(false)}
                            className="w-full py-3.5 rounded-2xl bg-[#3B3F6E] text-white font-semibold text-[14px] hover:bg-[#2E3259] transition-colors cursor-pointer"
                        >
                            Keep editing
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProfileViewSkeleton() {
    return (
        <div className="flex flex-col h-full w-full max-w-[900px] pb-12 relative animate-pulse">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-7 h-7 rounded-lg bg-[#E3DED3]" />
                <div className="h-5 w-[120px] rounded-md bg-[#E3DED3] ml-auto mr-auto" />
            </div>

            <div className="flex flex-col items-center mb-8">
                <div className="w-[80px] h-[80px] rounded-full bg-[#D8D2C5] mb-2" />
                <div className="h-4 w-[88px] rounded-md bg-[#E3DED3]" />
            </div>

            <div className="mb-5">
                <div className="h-4 w-[80px] rounded-md bg-[#E3DED3] mb-2" />
                <div className="w-full h-[52px] rounded-xl bg-white border border-[#E0DDD8]" />
            </div>

            <div className="mb-6">
                <div className="h-4 w-[56px] rounded-md bg-[#E3DED3] mb-2" />
                <div className="w-full h-[52px] rounded-xl bg-white border border-[#E0DDD8]" />
                <div className="h-3 w-[180px] rounded-md bg-[#E3DED3] mt-2" />
            </div>

            <div className="mb-6">
                <div className="h-4 w-[76px] rounded-md bg-[#E3DED3] mb-2.5" />
                <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 4 }).map((_, idx) => (
                        <div key={idx} className="h-9 w-[110px] rounded-full bg-white border border-[#E0DDD8]" />
                    ))}
                </div>
            </div>

            <div className="mb-8">
                <div className="h-4 w-[120px] rounded-md bg-[#E3DED3] mb-2.5" />
                <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 3 }).map((_, idx) => (
                        <div key={idx} className="h-9 w-[120px] rounded-full bg-white border border-[#E0DDD8]" />
                    ))}
                </div>
            </div>

            <div className="w-full h-[52px] rounded-2xl bg-[#B0ADAD]" />
        </div>
    );
}
