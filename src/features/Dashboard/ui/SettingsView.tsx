'use client';

import { useState } from 'react';

const SETTINGS_TABS = ['School profile', 'Features', 'Permissions', 'Data & Privacy', 'Danger zone'] as const;
type SettingsTab = typeof SETTINGS_TABS[number];

const NIGERIAN_STATES = ['Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos State', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'FCT'];
const SCHOOL_TYPES = ['Primary School', 'Secondary School', 'Primary & Secondary', 'Tertiary'];

export function SettingsView() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('School profile');

    return (
        <div className="w-full flex gap-8">
            {/* Left nav */}
            <nav className="w-[160px] shrink-0 flex flex-col gap-1 pt-1">
                {SETTINGS_TABS.map(tab => (
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

            {/* Content */}
            <div className="flex-1 min-w-0 w-full">
                {activeTab === 'School profile' && <SchoolProfileSection />}
                {activeTab === 'Features' && <FeaturesSection />}
                {activeTab === 'Permissions' && <PermissionsSection />}
                {activeTab === 'Data & Privacy' && <DataPrivacySection />}
                {activeTab === 'Danger zone' && <DangerZoneSection />}
            </div>
        </div>
    );
}

// ─── School Profile ───

function SchoolProfileSection() {
    const [schoolName, setSchoolName] = useState('Lagos International Academy');
    const [state, setState] = useState('Lagos State');
    const [schoolType, setSchoolType] = useState('Secondary School');
    const [showStateDropdown, setShowStateDropdown] = useState(false);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);

    return (
        <div className="flex flex-col gap-8">
            <section>
                <h2 className="text-[18px] font-bold text-[#3B3F6E] mb-5">School profile</h2>
                <div className="flex flex-col gap-4">
                    <input
                        type="text"
                        value={schoolName}
                        onChange={e => setSchoolName(e.target.value)}
                        className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px] text-[#3B3F6E] bg-white focus:outline-none focus:border-[#3B3F6E] transition-colors"
                    />

                    {/* Logo upload */}
                    <div className="flex items-center gap-4">
                        <div className="w-[56px] h-[56px] rounded-full bg-[#EAE8F2] flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#A29ECA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 4V16M4 10H16" />
                            </svg>
                        </div>
                        <button className="text-[12px] font-medium text-[#3B3F6E] hover:underline cursor-pointer">Upload logo</button>
                    </div>

                    {/* State dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowStateDropdown(!showStateDropdown)}
                            className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px] bg-white flex items-center justify-between cursor-pointer"
                        >
                            <span className="text-[#3B3F6E] font-medium">{state}</span>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#9a9ccb" strokeWidth="2" strokeLinecap="round" className={`transition-transform ${showStateDropdown ? 'rotate-180' : ''}`}>
                                <path d="M4 6L8 10L12 6" />
                            </svg>
                        </button>
                        {showStateDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E9E7E2] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] z-10 max-h-[200px] overflow-y-auto">
                                {NIGERIAN_STATES.map(s => (
                                    <button key={s} onClick={() => { setState(s); setShowStateDropdown(false); }} className="w-full px-4 py-3 text-left text-[13px] font-medium text-[#3B3F6E] hover:bg-[#F7F1E6] cursor-pointer transition-colors">
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* School type dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                            className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px] bg-white flex items-center justify-between cursor-pointer"
                        >
                            <span className="text-[#3B3F6E] font-medium">{schoolType}</span>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#9a9ccb" strokeWidth="2" strokeLinecap="round" className={`transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`}>
                                <path d="M4 6L8 10L12 6" />
                            </svg>
                        </button>
                        {showTypeDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E9E7E2] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] z-10">
                                {SCHOOL_TYPES.map(t => (
                                    <button key={t} onClick={() => { setSchoolType(t); setShowTypeDropdown(false); }} className="w-full px-4 py-3 text-left text-[13px] font-medium text-[#3B3F6E] hover:bg-[#F7F1E6] cursor-pointer transition-colors first:rounded-t-xl last:rounded-b-xl">
                                        {t}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button className="self-start px-5 py-[10px] bg-[#3B3F6E] text-white rounded-lg text-[13px] font-semibold hover:bg-[#2C2F52] transition-colors cursor-pointer">
                        Save changes
                    </button>
                </div>
            </section>

            <FeaturesSection />
            <DataPrivacySection />
            <DangerZoneSection />
        </div>
    );
}

// ─── Features ───

function FeaturesSection() {
    const [learningCamera, setLearningCamera] = useState(true);
    const [messaging, setMessaging] = useState(true);
    const [offlineAccess, setOfflineAccess] = useState(false);

    return (
        <section>
            <h2 className="text-[18px] font-bold text-[#3B3F6E] mb-5">Features</h2>
            <div className="bg-white border border-[#E9E7E2] rounded-xl divide-y divide-[#F0EDE6]">
                <ToggleRow
                    label="Learning camera"
                    description="Allow teachers to enable camera-based learning signals"
                    enabled={learningCamera}
                    onToggle={() => setLearningCamera(!learningCamera)}
                />
                <ToggleRow
                    label="Student-teacher messaging"
                    description="Enable direct messaging between students and teachers"
                    enabled={messaging}
                    onToggle={() => setMessaging(!messaging)}
                />
                <ToggleRow
                    label="Offline lesson access"
                    description="Allow students to access lesson materials without internet"
                    enabled={offlineAccess}
                    onToggle={() => setOfflineAccess(!offlineAccess)}
                />
            </div>
        </section>
    );
}

function ToggleRow({ label, description, enabled, onToggle }: {
    label: string; description: string; enabled: boolean; onToggle: () => void;
}) {
    return (
        <div className="flex items-center justify-between px-5 py-4">
            <div>
                <p className="text-[13px] font-semibold text-[#3B3F6E]">{label}</p>
                <p className="text-[12px] text-graphite-40">{description}</p>
            </div>
            <button onClick={onToggle} className={`w-[44px] h-[24px] rounded-full transition-colors cursor-pointer relative shrink-0 ${enabled ? 'bg-[#3B3F6E]' : 'bg-[#D1D0D6]'}`}>
                <div className={`w-[20px] h-[20px] rounded-full bg-white shadow-sm absolute top-[2px] transition-transform ${enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
            </button>
        </div>
    );
}

// ─── Permissions (placeholder) ───

function PermissionsSection() {
    return (
        <section>
            <h2 className="text-[18px] font-bold text-[#3B3F6E] mb-5">Permissions</h2>
            <div className="bg-[#FDFBF9] border border-[#E9E7E2] rounded-xl px-6 py-8 flex items-center justify-center">
                <p className="text-[13px] text-graphite-40">Permission settings coming soon.</p>
            </div>
        </section>
    );
}

// ─── Data & Privacy ───

function DataPrivacySection() {
    return (
        <section>
            <h2 className="text-[18px] font-bold text-[#3B3F6E] mb-5">Data & Privacy</h2>
            <div className="bg-[#FDFBF9] border border-[#E9E7E2] rounded-xl px-5 py-4">
                <div className="flex flex-col gap-2">
                    <p className="text-[13px] text-[#3B3F6E]">
                        <span className="text-graphite-40">Data retention policy:</span> <span className="font-medium">7 years</span>
                    </p>
                    <p className="text-[13px] text-[#3B3F6E]">
                        <span className="text-graphite-40">Consent acknowledgment:</span> <span className="font-medium">January 15, 2024</span>
                    </p>
                    <button className="text-[13px] font-medium text-[#3B3F6E] underline self-start cursor-pointer hover:opacity-70">
                        Privacy policy
                    </button>
                </div>
            </div>
        </section>
    );
}

// ─── Danger Zone ───

function DangerZoneSection() {
    return (
        <section>
            <h2 className="text-[18px] font-bold text-[#3B3F6E] mb-5">Danger zone</h2>
            <div className="bg-[#FFF5F0] border border-[#F0D9CC] rounded-xl px-5 py-5">
                <p className="text-[14px] font-bold text-[#3B3F6E] mb-1">Delete school account</p>
                <p className="text-[12px] text-graphite-60 mb-4">This will permanently remove all school data, classes, teacher and student accounts.</p>
                <button className="px-4 py-[8px] border border-[#D4534A] rounded-lg text-[13px] font-semibold text-[#D4534A] hover:bg-[#FDEAEA] transition-colors cursor-pointer">
                    Delete school account
                </button>
            </div>
        </section>
    );
}
