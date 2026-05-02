'use client';

import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useAuthGuard } from '@/shared/lib';
import { deleteSchoolAccount, getSchoolSettings, updateSchoolSettings } from '../api/school';

type SectionId = 'school-profile' | 'features' | 'permissions' | 'data-privacy' | 'danger-zone';

type SettingsForm = {
    schoolName: string;
    region: string;
    schoolType: string;
};

type FeatureState = {
    camera: boolean;
    messaging: boolean;
    offlineAccess: boolean;
};

const SECTION_ITEMS: { id: SectionId; label: string }[] = [
    { id: 'school-profile', label: 'School profile' },
    { id: 'features', label: 'Features' },
    { id: 'permissions', label: 'Permissions' },
    { id: 'data-privacy', label: 'Data & Privacy' },
    { id: 'danger-zone', label: 'Danger zone' },
];

export function SettingsView() {
    const guardAuth = useAuthGuard('school');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingFeature, setSavingFeature] = useState<keyof FeatureState | null>(null);
    const [deletingSchool, setDeletingSchool] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [settings, setSettings] = useState<any | null>(null);
    const [activeSection, setActiveSection] = useState<SectionId>('school-profile');
    const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm'>('idle');
    const [form, setForm] = useState<SettingsForm>({
        schoolName: '',
        region: '',
        schoolType: '',
    });
    const [features, setFeatures] = useState<FeatureState>({
        camera: true,
        messaging: true,
        offlineAccess: false,
    });

    const sectionRefs: Record<SectionId, RefObject<HTMLElement | null>> = {
        'school-profile': useRef<HTMLElement>(null),
        features: useRef<HTMLElement>(null),
        permissions: useRef<HTMLElement>(null),
        'data-privacy': useRef<HTMLElement>(null),
        'danger-zone': useRef<HTMLElement>(null),
    };

    useEffect(() => {
        let mounted = true;

        void (async () => {
            const res = await getSchoolSettings();
            if (!mounted) return;
            if (guardAuth(res)) return;

            if ('error' in res && res.error) {
                setError(res.error);
                setLoading(false);
                return;
            }

            const data = 'data' in res ? res.data : null;
            setSettings(data);
            setForm({
                schoolName: data?.school_name || '',
                region: data?.state || data?.region || 'Lagos State',
                schoolType: data?.school_type || inferSchoolType(data) || 'Secondary School',
            });
            setFeatures({
                camera: data?.camera_enabled ?? true,
                messaging: data?.messaging_enabled ?? true,
                offlineAccess: data?.offline_access_enabled ?? false,
            });
            setLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const entries = SECTION_ITEMS.map((item) => {
                const rect = sectionRefs[item.id].current?.getBoundingClientRect();
                return {
                    id: item.id,
                    top: rect?.top ?? Number.POSITIVE_INFINITY,
                };
            });

            const current =
                entries
                    .filter((entry) => entry.top <= 180)
                    .sort((a, b) => b.top - a.top)[0]?.id || 'school-profile';

            setActiveSection(current);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [sectionRefs]);

    async function handleSaveProfile() {
        setSaving(true);
        setError(null);
        setSuccess(null);

        const res = await updateSchoolSettings({
            name: form.schoolName,
            state: form.region,
            school_type: form.schoolType,
        });

        setSaving(false);
        if (guardAuth(res)) return;

        if ('error' in res && res.error) {
            setError(res.error);
            return;
        }

        const nextData = 'data' in res ? res.data : null;
        if (nextData) {
            setSettings(nextData);
        }
        setSuccess('School profile updated.');
    }

    async function handleToggleFeature(key: keyof FeatureState) {
        const previousValue = features[key];
        const nextValue = !previousValue;

        setFeatures((current) => ({ ...current, [key]: nextValue }));
        setSavingFeature(key);
        setError(null);
        setSuccess(null);

        const fieldMap: Record<keyof FeatureState, string> = {
            camera: 'camera_enabled',
            messaging: 'messaging_enabled',
            offlineAccess: 'offline_access_enabled',
        };

        const res = await updateSchoolSettings({
            [fieldMap[key]]: nextValue,
        });

        setSavingFeature(null);
        if (guardAuth(res)) return;

        if ('error' in res && res.error) {
            setFeatures((current) => ({ ...current, [key]: previousValue }));
            setError(res.error);
            return;
        }

        const nextData = 'data' in res ? res.data : null;
        if (nextData) {
            setSettings(nextData);
        }
        setSuccess('Feature settings updated.');
    }

    async function handleDeleteSchool() {
        if (!settings?.school_name) {
            setError('School details are unavailable.');
            return;
        }

        setDeletingSchool(true);
        setError(null);
        setSuccess(null);

        const res = await deleteSchoolAccount(settings.school_name);

        setDeletingSchool(false);
        if (guardAuth(res)) return;

        if ('error' in res && res.error) {
            setError(res.error);
            return;
        }

        setSuccess('School account deleted.');
        window.location.assign('/');
    }

    function jumpToSection(sectionId: SectionId) {
        setActiveSection(sectionId);
        sectionRefs[sectionId].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center text-[14px] text-[#2B2B2F]/60">
                Loading settings...
            </div>
        );
    }

    if (error && !settings) {
        return (
            <div className="mx-auto flex w-full max-w-[1136px] flex-col gap-3 rounded-[12px] border border-[#E0D9CE] bg-white px-6 py-8 text-center">
                <h1 className="text-[22px] font-bold text-[#3B3F6E]">Settings</h1>
                <p className="text-[14px] text-[#2B2B2F]/60">{error}</p>
            </div>
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-[1136px] gap-8">
            <aside className="sticky top-8 h-fit w-[200px] shrink-0">
                <nav className="flex flex-col">
                    {SECTION_ITEMS.map((item) => {
                        const active = activeSection === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => jumpToSection(item.id)}
                                className={`flex h-[44px] items-center border-l-[3px] px-4 text-left text-[15px] font-medium transition-colors ${
                                    active
                                        ? 'border-[#3B3F6E] text-[#3B3F6E]'
                                        : 'border-transparent text-[#2B2B2F]/55 hover:text-[#3B3F6E]'
                                }`}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </nav>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col gap-10 pb-10">
                {success ? <Banner tone="success" text={success} /> : null}
                {error && settings ? <Banner tone="error" text={error} /> : null}

                <section ref={sectionRefs['school-profile']} className="scroll-mt-8">
                    <h1 className="mb-6 text-[20px] font-bold leading-[30px] text-[#3B3F6E]">School profile</h1>
                    <div className="rounded-[12px] border border-[#E0D9CE] bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        <div className="flex flex-col gap-6">
                            <TextInput
                                value={form.schoolName}
                                onChange={(value) => setForm((current) => ({ ...current, schoolName: value }))}
                            />

                            <div className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-full bg-[#3B3F6E]/10 text-center text-[13px] leading-5 text-[#3B3F6E]/60">
                                <UploadLogoIcon />
                                <span>Upload logo</span>
                            </div>

                            <SelectLikeInput
                                value={form.region}
                                onClick={() => setForm((current) => ({ ...current, region: current.region || 'Lagos State' }))}
                            />

                            <SelectLikeInput
                                value={form.schoolType}
                                onClick={() => setForm((current) => ({ ...current, schoolType: current.schoolType || 'Secondary School' }))}
                            />

                            <div>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                    className="flex h-12 items-center justify-center rounded-[12px] bg-[#3B3F6E] px-8 text-[15px] font-semibold text-[#F7F1E6] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving ? 'Saving...' : 'Save changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section ref={sectionRefs.features} className="scroll-mt-8">
                    <h2 className="mb-6 text-[20px] font-bold leading-[30px] text-[#3B3F6E]">Features</h2>
                    <div className="overflow-hidden rounded-[12px] border border-[#E0D9CE] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        <FeatureRow
                            title="Learning camera"
                            description="Allow teachers to enable camera-based learning signals"
                            enabled={features.camera}
                            disabled={savingFeature !== null}
                            onToggle={() => void handleToggleFeature('camera')}
                        />
                        <FeatureRow
                            title="Student-teacher messaging"
                            description="Enable direct messaging between students and teachers"
                            enabled={features.messaging}
                            disabled={savingFeature !== null}
                            onToggle={() => void handleToggleFeature('messaging')}
                        />
                        <FeatureRow
                            title="Offline lesson access"
                            description="Allow students to access lesson materials without internet"
                            enabled={features.offlineAccess}
                            disabled={savingFeature !== null}
                            onToggle={() => void handleToggleFeature('offlineAccess')}
                            last
                        />
                    </div>
                </section>

                <section ref={sectionRefs.permissions} className="scroll-mt-8">
                    <h2 className="mb-6 text-[20px] font-bold leading-[30px] text-[#3B3F6E]">Permissions</h2>
                    <div className="rounded-[12px] border border-[#E0D9CE] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        <div className="space-y-4">
                            <InfoRow
                                label="Primary admin"
                                value={settings?.admin_name || 'School administrator'}
                            />
                            <InfoRow
                                label="Admin email"
                                value={settings?.admin_email || settings?.email || 'Not available'}
                            />
                            <InfoRow
                                label="Access scope"
                                value="Admins can manage school profile, classes, teachers, students, and reporting."
                                muted
                            />
                        </div>
                    </div>
                </section>

                <section ref={sectionRefs['data-privacy']} className="scroll-mt-8">
                    <h2 className="mb-6 text-[20px] font-bold leading-[30px] text-[#3B3F6E]">Data & Privacy</h2>
                    <div className="rounded-[12px] border border-[#E0D9CE] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        <div className="space-y-6">
                            <p className="text-[15px] leading-[22px] text-[#2B2B2F]/70">
                                Data retention policy: {settings?.data_retention_policy || '7 years'}
                            </p>
                            <p className="text-[15px] leading-[22px] text-[#2B2B2F]/70">
                                Consent acknowledgment: {formatConsentDate(settings)}
                            </p>
                            <a href="#" className="text-[15px] leading-[22px] text-[#3B3F6E] underline">
                                Privacy policy
                            </a>
                        </div>
                    </div>
                </section>

                <section ref={sectionRefs['danger-zone']} className="scroll-mt-8">
                    <h2 className="mb-6 text-[20px] font-bold leading-[30px] text-[#3B3F6E]">Danger zone</h2>
                    <div className="rounded-[12px] border border-[#C0392B] bg-[#FDF0F0] p-6">
                        <h3 className="text-[15px] font-semibold leading-[22px] text-[#2B2B2F]">Delete school account</h3>
                        <p className="mt-3 text-[13px] leading-5 text-[#2B2B2F]/65">
                            This will permanently remove all school data, classes, teacher and student accounts.
                        </p>

                        {deleteStep === 'idle' ? (
                            <button
                                onClick={() => setDeleteStep('confirm')}
                                className="mt-5 flex h-11 items-center justify-center rounded-[12px] border border-[#C0392B] px-5 text-[14px] font-medium text-[#C0392B]"
                            >
                                Delete school account
                            </button>
                        ) : (
                            <div className="mt-5 flex flex-wrap items-center gap-3">
                                <button
                                    onClick={() => void handleDeleteSchool()}
                                    disabled={deletingSchool}
                                    className="flex h-11 items-center justify-center rounded-[12px] border border-[#C0392B] px-5 text-[14px] font-medium text-[#C0392B] disabled:cursor-not-allowed disabled:text-[#C0392B]/60"
                                >
                                    {deletingSchool ? 'Deleting school...' : 'Confirm delete school account'}
                                </button>
                                <button
                                    onClick={() => setDeleteStep('idle')}
                                    className="text-[13px] font-medium text-[#3B3F6E]"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

function TextInput({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-14 w-full rounded-[12px] border border-[#3B3F6E]/40 bg-white px-4 text-[15px] leading-[22px] text-[#2B2B2F] outline-none"
        />
    );
}

function SelectLikeInput({
    value,
    onClick,
}: {
    value: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="flex h-14 w-full items-center justify-between rounded-[12px] border border-[#3B3F6E]/40 bg-white px-4 text-left text-[15px] leading-[22px] text-[#2B2B2F]"
        >
            <span>{value}</span>
            <ChevronDownIcon />
        </button>
    );
}

function FeatureRow({
    title,
    description,
    enabled,
    onToggle,
    disabled = false,
    last = false,
}: {
    title: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
    disabled?: boolean;
    last?: boolean;
}) {
    return (
        <div className={`flex min-h-[64px] items-center justify-between px-7 py-4 ${last ? '' : 'border-b border-[#E0D9CE]'}`}>
            <div>
                <p className="text-[15px] leading-[22px] text-[#2B2B2F]">{title}</p>
                <p className="mt-1 text-[13px] leading-5 text-[#2B2B2F]/55">{description}</p>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-[13px] leading-5 text-[#2B2B2F]/55">{enabled ? 'Enabled' : 'Disabled'}</span>
                <button
                    onClick={onToggle}
                    disabled={disabled}
                    className={`relative h-[31px] w-[51px] rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${enabled ? 'bg-[#34C759]' : 'bg-[#8E8E93]'}`}
                >
                    <span
                        className={`absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white transition-all ${enabled ? 'left-[22px]' : 'left-[2px]'}`}
                    />
                </button>
            </div>
        </div>
    );
}

function InfoRow({
    label,
    value,
    muted = false,
}: {
    label: string;
    value: string;
    muted?: boolean;
}) {
    return (
        <div className="space-y-1">
            <p className="text-[12px] font-medium uppercase tracking-[0.03em] text-[#2B2B2F]/45">{label}</p>
            <p className={`text-[15px] leading-[22px] ${muted ? 'text-[#2B2B2F]/70' : 'text-[#2B2B2F]'}`}>{value}</p>
        </div>
    );
}

function Banner({ tone, text }: { tone: 'success' | 'error'; text: string }) {
    return (
        <div
            className={`rounded-[12px] px-4 py-3 text-[13px] font-medium ${
                tone === 'success'
                    ? 'bg-[#E5F6E9] text-[#1D6B34]'
                    : 'bg-[#FCE8E6] text-[#B3261E]'
            }`}
        >
            {text}
        </div>
    );
}

function UploadLogoIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3.125 12.5V13.75C3.125 14.7449 3.52009 15.699 4.22335 16.4022C4.92661 17.1055 5.88071 17.5006 6.875 17.5006H13.125C14.1193 17.5006 15.0734 17.1055 15.7766 16.4022C16.4799 15.699 16.875 14.7449 16.875 13.75V12.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6.875 7.5L10 4.375L13.125 7.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 4.375V12.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function ChevronDownIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 7.5L10 12.5L15 7.5" stroke="rgba(43,43,47,0.6)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function inferSchoolType(settings: any) {
    const raw = `${settings?.school_level || ''} ${settings?.category || ''}`.toLowerCase();
    if (raw.includes('primary')) return 'Primary School';
    if (raw.includes('secondary')) return 'Secondary School';
    return '';
}

function formatConsentDate(settings: any) {
    const value = settings?.consent_acknowledgment_date || settings?.dpa_accepted_at || settings?.created_at;
    if (!value) return 'January 15, 2024';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
