"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/shared/ui";
import { updateTeachingContext } from "@/features/Dashboard/api/teacher";

type TeachingMode = boolean;

export default function WorkspaceSelectionPage() {
    const router = useRouter();
    const [independent, setIndependent] = useState<TeachingMode>(false);
    const [schoolCode, setSchoolCode] = useState("");
    const [schoolId, setSchoolId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const normalizedSchoolCode = useMemo(() => schoolCode.trim(), [schoolCode]);

    useEffect(() => {
        let cancelled = false;

        async function resolve() {
            if (independent) {
                setSchoolId(null);
                return;
            }

            if (!normalizedSchoolCode) {
                setSchoolId(null);
                return;
            }

            try {
                const res = await fetch(`/api/schools/search?q=${encodeURIComponent(normalizedSchoolCode)}`);
                const data = await res.json().catch(() => ({}));
                if (cancelled) return;

                const schools: any[] = Array.isArray(data)
                    ? data
                    : data.schools || data.results || [];

                const match = schools.find(
                    (s) => String(s.id || s.school_id || "").trim().length > 0,
                ) || schools[0];

                setSchoolId(match ? String(match.id || match.school_id) : null);
            } catch {
                if (!cancelled) setSchoolId(null);
            }
        }

        resolve();
        return () => {
            cancelled = true;
        };
    }, [independent, normalizedSchoolCode]);

    // "Independent" means no school_id is required.
    const isComplete = independent ? true : !!schoolId;

    const handleContinue = async () => {
        if (!isComplete) return;
        setLoading(true);
        setError(null);

        const payload: Record<string, any> = {
            independent,
        };

        if (!independent) {
            if (!schoolId) {
                setError("Please enter a valid school code.");
                setLoading(false);
                return;
            }
            payload.school_id = schoolId;
        }

        const result = await updateTeachingContext(payload);
        setLoading(false);
        if (result.error) {
            setError(result.error);
            return;
        }
        router.push("/register/teacher/profile");
    };

    return (
        <div className="flex-1 w-full flex flex-col items-center mt-6 mb-10 px-6 mx-auto h-full relative">
            <div className="w-full mb-10">
                <button type="button" onClick={() => router.back()} className="text-[#3B3F6E] opacity-70 hover:opacity-100 transition-opacity p-2 -ml-2 cursor-pointer">
                    <Icon type="back" width={16} height={16} />
                </button>
            </div>

            <header className="flex flex-col items-center gap-3 w-full mb-8">
                <h1 className="font-extrabold text-[#3B3F6E] text-[20px] text-center">How are you teaching?</h1>
                <p className="font-medium text-[13px] opacity-70 text-graphite text-center max-w-sm">
                    This helps us set up the right workspace for you.
                </p>
            </header>

            <div className="flex flex-col w-full gap-4 flex-1">
                {/* Join a school Option */}
                <div className="flex flex-col w-full gap-4">
                    <button
                        type="button"
                    onClick={() => { setIndependent(false); setError(null); }}
                        className={`w-full flex items-center gap-4 p-5 rounded-xl border transition-all text-left cursor-pointer ${
                            !independent
                                ? "border-[#3B3F6E] bg-transparent"
                                : "border-[#3B3F6E]/15 hover:border-[#3B3F6E]/30 bg-transparent"
                        }`}
                    >
                        <div className="flex items-center justify-center w-12 h-12 shrink-0">
                            {/* Graduation cap SVG */}
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="#3B3F6E"
                                className={!independent ? "opacity-80" : ""}
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3ZM12 12.8L4.34 8.64L12 4.48L19.66 8.64L12 12.8ZM5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" />
                            </svg>
                        </div>
                        <div className="flex flex-col flex-1 gap-1">
                            <span className="font-bold text-[14px] text-[#3B3F6E]">Join a school</span>
                            <span className="text-[12px] text-graphite opacity-70 font-medium">Access your school's lesson library, manage your classes, and track student progress.</span>
                        </div>
                        <div className="shrink-0 ml-2">
                            {!independent ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 12L10 17L20 7" stroke="#76B97A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" opacity="0.3" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 18L15 12L9 6" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            )}
                        </div>
                    </button>

                    {/* School Search Section (Only shown if mode === school) */}
                    {!independent && (
                        <div className="w-full flex flex-col gap-2 animate-fade-in pl-1">
                            <input
                                type="text"
                                placeholder="Enter your school code"
                                value={schoolCode}
                                onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                                className="w-full bg-transparent border border-[#3B3F6E]/20 focus:border-[#3B3F6E]/50 rounded-[10px] px-4 py-3 outline-none transition-colors text-[13.5px] font-medium placeholder:text-[#3B3F6E]/40 text-[#3B3F6E]"
                            />
                            <p className="text-[11px] text-graphite opacity-60 font-medium">Use the code from your school administrator.</p>
                        </div>
                    )}
                </div>

                {/* I teach independently Option */}
                <button
                    type="button"
                    onClick={() => { setIndependent(true); setSchoolCode(""); setError(null); }}
                    className={`w-full flex items-center gap-4 p-5 rounded-xl border transition-all text-left cursor-pointer ${
                        independent ? "border-[#3B3F6E] bg-transparent" : "border-[#3B3F6E]/15 hover:border-[#3B3F6E]/30 bg-transparent"
                    }`}
                >
                    <div className="flex items-center justify-center w-12 h-12 shrink-0">
                        {/* Person SVG */}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill={independent ? "#3B3F6E" : "#3B3F6E"} className={independent ? "opacity-80" : ""} xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" />
                        </svg>
                    </div>
                    <div className="flex flex-col flex-1 gap-1">
                        <span className="font-bold text-[14px] text-[#3B3F6E]">I teach independently</span>
                        <span className="text-[12px] text-graphite opacity-70 font-medium">Create your own lessons, manage your own students, work at your own pace.</span>
                    </div>
                    <div className="shrink-0 ml-2">
                        {independent ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 12L10 17L20 7" stroke="#76B97A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" opacity="0.3" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 18L15 12L9 6" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        )}
                    </div>
                </button>
            </div>

            <div className="w-full mt-10">
                {error && <p className="text-[12px] text-[#E57661] mb-2">{error}</p>}
                <button
                    type="button"
                    onClick={handleContinue}
                    disabled={!isComplete || loading}
                    className={`w-full text-white font-bold rounded-xl py-[14px] text-[14px] outline-none transition-all ${
                        !isComplete || loading
                            ? 'bg-[#9A9BB5] cursor-not-allowed opacity-90'
                            : 'bg-[#3B3F6E] hover:opacity-90 active:scale-[0.98] cursor-pointer'
                    }`}
                >
                    {loading ? "Saving..." : "Continue"}
                </button>
            </div>
        </div>
    );
}
