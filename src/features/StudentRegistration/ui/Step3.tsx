'use client'

import { useState, useEffect } from "react";
import { Icon } from "@/shared/ui";
import { fetchClassesBySchoolId, type SchoolClassOption } from "../api/schoolLookup";
import { useRegistrationStore } from "@/shared/store/useRegistrationStore";

export function Step3({ onNext, onBack }: { onNext?: () => void, onBack?: () => void }) {
    const { schoolId, setClassId } = useRegistrationStore();
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [classes, setClasses] = useState<SchoolClassOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const loadClasses = async () => {
            if (!schoolId) {
                if (isMounted) {
                    setClasses([]);
                    setError("Please go back and choose a school first.");
                    setIsLoading(false);
                }
                return;
            }

            setIsLoading(true);
            setError(null);
            try {
                const results = await fetchClassesBySchoolId(schoolId);
                if (isMounted) setClasses(results);
            } catch (err) {
                if (isMounted) {
                    setClasses([]);
                    setError(err instanceof Error ? err.message : "Failed to load classes.");
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadClasses();
        return () => { isMounted = false; };
    }, [schoolId]);

    return (
        <div className="flex flex-col justify-center items-center">
            {onBack ? (
                <button type="button" onClick={onBack} className="icon p-2.5 pl-6 cursor-pointer mt-10 flex w-full justify-start bg-transparent outline-none border-none">
                    <Icon type="back" width={24} height={24} />
                </button>
            ) : (
                <a href="/register" className="icon p-2.5 pl-6 cursor-pointer mt-10 flex w-full justify-start">
                    <Icon type="back" width={24} height={24} />
                </a>
            )}

            <main className="px-6 w-full flex flex-col items-center">
                <header className="pt-8 flex w-full flex-col gap-2 items-center justify-center pb-10">
                    <p className="font-semibold text-sm text-lavender">Step 3 of 6</p>
                    <h1 className="font-extrabold text-[22px] text-indigo mt-7">Select your class</h1>
                    <h2 className="text-sm text-graphite">Choose the class you belong to.</h2>
                </header>

                <div className="w-full flex flex-col items-center">
                    <div className="w-full flex flex-col gap-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-10 mt-6 text-center">
                                <p className="text-sm text-graphite">Loading classes...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-10 mt-6 text-center">
                                <p className="text-sm text-[#E57661]">{error}</p>
                                <p className="text-[13px] text-graphite opacity-60 mt-2">Please try again or go back to reselect your school.</p>
                            </div>
                        ) : classes.length > 0 ? (
                            classes.map((cls) => {
                                const isSelected = selectedClassId === cls.id;
                                return (
                                    <div 
                                        key={cls.id}
                                        onClick={() => setSelectedClassId(cls.id)}
                                        className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors border ${
                                            isSelected ? 'border-2 border-indigo' : 'border-indigo-10 bg-transparent hover:bg-slate-50'
                                        }`}
                                    >
                                        <span className={`font-semibold text-sm ${isSelected ? 'text-indigo' : 'text-indigo'}`}>
                                            {cls.name}
                                        </span>
                                        <div className="flex justify-center items-center gap-3">
                                            <span className={`text-xs ${cls.teacher === 'No teacher assigned' ? 'opacity-40' : 'opacity-60'}`}>
                                                {cls.teacher}
                                            </span>
                                            {isSelected && (
                                                <div className="shrink-0 flex items-center justify-center">
                                                    <Icon type="tick-II" width={20} height={20} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 mt-6 text-center">
                                <p className="text-sm text-graphite opacity-60">No classes have been set up for this school yet.</p>
                                <p className="text-[13px] text-graphite opacity-40 mt-2">Please speak to your teacher or school admin.</p>
                            </div>
                        )}
                    </div>

                    <button 
                        type="button" 
                        onClick={() => {
                            if (selectedClassId) {
                                console.log("Step 3 complete - Class selected:", selectedClassId);
                                setClassId(selectedClassId);
                                if (onNext) onNext();
                            }
                        }}
                        disabled={!selectedClassId}
                        className={`w-full text-white font-semibold rounded-xl mt-12 px-6 py-4 outline-none transition-opacity ${
                            selectedClassId ? "bg-indigo hover:opacity-90 cursor-pointer" : "bg-indigo opacity-50 cursor-not-allowed"
                        }`}
                    >
                        Continue
                    </button>
                </div>
            </main>
        </div>
    )
}
