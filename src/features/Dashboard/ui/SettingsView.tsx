'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSchoolSettings, updateSchoolSettings } from '../api/school';

const SETTINGS_TABS = ['School profile', 'School status', 'Data & Privacy'] as const;
type SettingsTab = typeof SETTINGS_TABS[number];

type SettingsForm = {
    schoolName: string;
    address: string;
    city: string;
    state: string;
    country: string;
    phoneNumber: string;
    email: string;
    website: string;
};

export function SettingsView() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('School profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [settings, setSettings] = useState<any | null>(null);
    const [form, setForm] = useState<SettingsForm>({
        schoolName: '',
        address: '',
        city: '',
        state: '',
        country: 'Nigeria',
        phoneNumber: '',
        email: '',
        website: '',
    });

    useEffect(() => {
        let mounted = true;

        void (async () => {
            const res = await getSchoolSettings();
            if (!mounted) return;

            if ('error' in res && res.error) {
                setError(res.error);
                setLoading(false);
                return;
            }

            const data = 'data' in res ? res.data : null;
            setSettings(data);
            setForm({
                schoolName: data?.school_name || '',
                address: data?.address || '',
                city: data?.city || '',
                state: data?.state || '',
                country: data?.country || 'Nigeria',
                phoneNumber: data?.phone_number || '',
                email: data?.email || '',
                website: data?.website || '',
            });
            setLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, []);

    const statusRows = useMemo(
        () => [
            { label: 'Subscription tier', value: settings?.subscription_tier || 'N/A' },
            { label: 'School code', value: settings?.school_code || 'Not generated yet' },
            { label: 'Teachers', value: String(settings?.total_teachers ?? 0) },
            { label: 'Students', value: String(settings?.total_students ?? 0) },
            { label: 'Primary admin', value: settings?.admin_name || 'Not available' },
            { label: 'Admin email', value: settings?.admin_email || 'Not available' },
        ],
        [settings],
    );

    const featureRows = useMemo(
        () => [
            { label: 'Camera support', enabled: Boolean(settings?.camera_enabled) },
            { label: 'Messaging', enabled: Boolean(settings?.messaging_enabled) },
            { label: 'Onboarding complete', enabled: Boolean(settings?.onboarding_completed) },
        ],
        [settings],
    );

    async function handleSave() {
        setSaving(true);
        setError(null);
        setSuccess(null);

        const res = await updateSchoolSettings({
            name: form.schoolName,
            address: form.address,
            city: form.city,
            state: form.state,
            country: form.country,
            phone_number: form.phoneNumber,
            email: form.email,
            website: form.website,
        });

        setSaving(false);

        if ('error' in res && res.error) {
            setError(res.error);
            return;
        }

        const nextData = 'data' in res ? res.data : null;
        setSettings(nextData || settings);
        setSuccess('School settings saved.');
    }

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center text-[14px] text-graphite-60">
                Loading settings...
            </div>
        );
    }

    if (error && !settings) {
        return (
            <div className="rounded-2xl border border-[#E0D9CE] bg-white px-6 py-8 text-center">
                <p className="text-[16px] font-semibold text-[#3B3F6E] mb-2">Couldn’t load school settings.</p>
                <p className="text-[13px] text-graphite-60">{error}</p>
            </div>
        );
    }

    return (
        <div className="w-full flex gap-8">
            <nav className="w-[180px] shrink-0 flex flex-col gap-1 pt-1">
                {SETTINGS_TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                            activeTab === tab
                                ? 'text-[#3B3F6E] bg-[#EAE8F2]'
                                : 'text-graphite-40 hover:text-[#3B3F6E] hover:bg-black/5'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </nav>

            <div className="flex-1 min-w-0 w-full">
                {success ? <Banner tone="success" text={success} /> : null}
                {error && settings ? <Banner tone="error" text={error} /> : null}

                {activeTab === 'School profile' ? (
                    <section className="flex flex-col gap-6">
                        <div>
                            <h1 className="text-[22px] font-bold text-[#3B3F6E] tracking-tight">School profile</h1>
                            <p className="text-[13px] text-graphite-60 mt-1">Keep your school details current for teachers and students.</p>
                        </div>

                        <div className="bg-white rounded-2xl border border-[#E9E7E2] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="School name" value={form.schoolName} onChange={(value) => setForm({ ...form, schoolName: value })} />
                                <Field label="Contact email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
                                <Field label="Phone number" value={form.phoneNumber} onChange={(value) => setForm({ ...form, phoneNumber: value })} />
                                <Field label="Website" value={form.website} onChange={(value) => setForm({ ...form, website: value })} />
                                <Field label="Address" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />
                                <Field label="City" value={form.city} onChange={(value) => setForm({ ...form, city: value })} />
                                <Field label="State" value={form.state} onChange={(value) => setForm({ ...form, state: value })} />
                                <Field label="Country" value={form.country} onChange={(value) => setForm({ ...form, country: value })} />
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-[12px] text-graphite-40">
                                    Logo uploads are not yet wired for school admin, but the profile data is live.
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-5 py-[10px] bg-[#3B3F6E] text-white rounded-lg text-[13px] font-semibold hover:bg-[#2C2F52] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {saving ? 'Saving...' : 'Save changes'}
                                </button>
                            </div>
                        </div>
                    </section>
                ) : null}

                {activeTab === 'School status' ? (
                    <section className="flex flex-col gap-6">
                        <div>
                            <h1 className="text-[22px] font-bold text-[#3B3F6E] tracking-tight">School status</h1>
                            <p className="text-[13px] text-graphite-60 mt-1">Live account, staffing, and feature availability for your school.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-2xl border border-[#E9E7E2] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                                <h2 className="text-[14px] font-bold text-[#3B3F6E] mb-5 tracking-tight">Account snapshot</h2>
                                <div className="flex flex-col divide-y divide-[#F0EDE6]">
                                    {statusRows.map((row) => (
                                        <div key={row.label} className="flex items-center justify-between py-3">
                                            <span className="text-[13px] text-graphite-60">{row.label}</span>
                                            <span className="text-[13px] font-semibold text-[#3B3F6E]">{row.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-[#E9E7E2] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                                <h2 className="text-[14px] font-bold text-[#3B3F6E] mb-5 tracking-tight">Feature availability</h2>
                                <div className="flex flex-col gap-4">
                                    {featureRows.map((row) => (
                                        <div key={row.label} className="flex items-center justify-between rounded-xl bg-[#F7F1E6] px-4 py-4">
                                            <span className="text-[13px] font-medium text-[#3B3F6E]">{row.label}</span>
                                            <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${row.enabled ? 'bg-[#DFF3E2] text-[#1D6B34]' : 'bg-[#EAE8F2] text-[#5A5E8F]'}`}>
                                                {row.enabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                ) : null}

                {activeTab === 'Data & Privacy' ? (
                    <section className="flex flex-col gap-6">
                        <div>
                            <h1 className="text-[22px] font-bold text-[#3B3F6E] tracking-tight">Data & Privacy</h1>
                            <p className="text-[13px] text-graphite-60 mt-1">Consent and privacy signals currently stored for this school.</p>
                        </div>

                        <div className="bg-white rounded-2xl border border-[#E9E7E2] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                            <div className="grid grid-cols-2 gap-4">
                                <PrivacyCard
                                    title="DPA accepted"
                                    value={settings?.dpa_accepted ? 'Accepted' : 'Pending'}
                                    note={settings?.dpa_accepted_at ? `Accepted on ${formatDate(settings.dpa_accepted_at)}` : 'No acceptance timestamp yet'}
                                />
                                <PrivacyCard
                                    title="Data protection consent"
                                    value={settings?.data_protection_consent ? 'Granted' : 'Not granted'}
                                    note="Collected during school onboarding."
                                />
                                <PrivacyCard
                                    title="Camera consent"
                                    value={settings?.camera_consent ? 'Granted' : 'Not granted'}
                                    note="Controls whether camera-based learning signals can be enabled."
                                />
                                <PrivacyCard
                                    title="Onboarding status"
                                    value={settings?.onboarding_completed ? 'Complete' : 'In progress'}
                                    note="Used to decide whether the school can access the full dashboard."
                                />
                            </div>
                        </div>
                    </section>
                ) : null}
            </div>
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="flex flex-col gap-2">
            <span className="text-[12px] font-semibold text-[#3B3F6E]">{label}</span>
            <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px] text-[#3B3F6E] bg-[#FDFBF9] focus:outline-none focus:border-[#3B3F6E] transition-colors"
            />
        </label>
    );
}

function PrivacyCard({ title, value, note }: { title: string; value: string; note: string }) {
    return (
        <div className="rounded-xl bg-[#F7F1E6] px-4 py-4">
            <p className="text-[12px] font-semibold text-[#3B3F6E] mb-2">{title}</p>
            <p className="text-[16px] font-bold text-[#2B2B2F] mb-1">{value}</p>
            <p className="text-[12px] text-graphite-40">{note}</p>
        </div>
    );
}

function Banner({ tone, text }: { tone: 'success' | 'error'; text: string }) {
    return (
        <div className={`mb-4 rounded-xl px-4 py-3 text-[13px] font-medium ${
            tone === 'success'
                ? 'bg-[#E5F6E9] text-[#1D6B34]'
                : 'bg-[#FCE8E6] text-[#B3261E]'
        }`}>
            {text}
        </div>
    );
}

function formatDate(value?: string) {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
}
