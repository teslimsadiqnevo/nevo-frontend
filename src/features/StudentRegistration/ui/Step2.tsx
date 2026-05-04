'use client'

import { useState, useEffect } from "react";
import { Icon } from "@/shared/ui";
import { fetchSchools, type SchoolSearchOption } from "../api/schoolLookup";
import { useRegistrationStore } from "@/shared/store/useRegistrationStore";
import Link from "next/link";

export function Step2({ onNext, onBack }: { onNext: () => void, onBack?: () => void }) {
    const { setSchoolId } = useRegistrationStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSchool, setSelectedSchool] = useState<SchoolSearchOption | null>(null);
    const [schools, setSchools] = useState<SchoolSearchOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (selectedSchool || !searchQuery.trim()) {
            setSchools([]);
            setError(null);
            setIsLoading(false);
            return;
        }

        let isCancelled = false;
        const timeoutId = setTimeout(async () => {
            setIsLoading(true);
            setError(null);
            try {
                const results = await fetchSchools(searchQuery);
                if (!isCancelled) {
                    setSchools(results);
                }
            } catch (err) {
                if (!isCancelled) {
                    setSchools([]);
                    setError(err instanceof Error ? err.message : "Failed to search for schools.");
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        }, 180);

        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
        };
    }, [searchQuery, selectedSchool]);

    return (
        <div className="flex flex-col justify-center items-center">
            {onBack ? (
                <button type="button" onClick={onBack} className="icon p-2.5 pl-6 cursor-pointer mt-10 flex w-full justify-start bg-transparent outline-none border-none">
                    <Icon type="back" width={24} height={24} />
                </button>
            ) : (
                <Link href="/register" className="icon p-2.5 pl-6 cursor-pointer mt-10 flex w-full justify-start">
                    <Icon type="back" width={24} height={24} />
                </Link>
            )}

            <main className="px-6 w-full flex flex-col items-center">
                <header className="pt-8 flex w-full flex-col gap-2 items-center justify-center pb-10">
                    <p className="font-semibold text-sm text-lavender">Step 2 of 6</p>
                    <h1 className="font-extrabold text-[22px] text-indigo mt-7">Find your school</h1>
                    <h2 className="text-sm">Type your school name and select it from the list.</h2>
                </header>

                <div className="w-full flex flex-col items-center">
                    <div className="w-full  relative">
                        <div className="flex items-center w-full border border-indigo rounded-xl px-4 py-4 bg-transparent outline-none focus-within:border-2 transition-colors">
                            <input 
                                type="text"
                                placeholder="Search for your school..."
                                value={selectedSchool ? selectedSchool.name : searchQuery}
                                onChange={(e) => {
                                    if (!selectedSchool) {
                                        setSearchQuery(e.target.value);
                                    }
                                }}
                                disabled={selectedSchool !== null}
                                className="w-full bg-transparent outline-none text-indigo font-medium disabled:text-indigo"
                            />
                            {selectedSchool ? (
                                <Icon type="tick" className="shrink-0 ml-3" width={20} height={20} />
                            ) : (
                                <div className="shrink-0 ml-3 p-1">
                                    <Icon type="search-II" width={20} height={20} />
                                </div>
                            )}
                        </div>

                        {!selectedSchool && searchQuery && (
                            <div className="mt-2 w-full bg-white border border-indigo-10 rounded-xl overflow-hidden shadow-sm">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center p-8 text-center bg-white">
                                        <p className="text-sm text-graphite">Searching...</p>
                                    </div>
                                ) : error ? (
                                    <div className="flex flex-col items-center justify-center p-8 text-center bg-white">
                                        <p className="text-sm text-[#E57661]">{error}</p>
                                        <p className="text-[13px] text-graphite mt-1">Please try again in a moment.</p>
                                    </div>
                                ) : schools.length > 0 ? (
                                    <div className="flex flex-col">
                                        {schools.map((school, index) => (
                                            <div 
                                                key={school.id}
                                                onClick={() => setSelectedSchool(school)}
                                                className={`flex items-center justify-between p-4 bg-white hover:bg-slate-50 cursor-pointer ${index !== schools.length - 1 ? 'border-b border-indigo-10' : ''}`}
                                            >
                                                <span className="font-medium text-sm text-indigo">{school.name}</span>
                                                <span className="text-xs">{school.location}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8 text-center bg-white">
                                        <p className="text-sm text-graphite">No schools found matching &apos;{searchQuery}&apos;.</p>
                                        <p className="text-[13px] text-graphite mt-1">Your school may not be registered on Nevo yet.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Selected School Banner */}
                        {selectedSchool && (
                            <div className="mt-2 w-full bg-white border border-transparent rounded-xl p-4 flex justify-between items-start">
                                <div className="flex flex-col gap-1">
                                    <span className="font-bold text-sm text-indigo">{selectedSchool.name}</span>
                                    <span className="text-xs font-medium text-graphite-50">{selectedSchool.location}</span>
                                </div>
                                <button 
                                    onClick={() => {
                                        setSelectedSchool(null);
                                        setSchools([]);
                                        setError(null);
                                    }}
                                    className="text-xs text-lavender hover:opacity-100 transition-opacity"
                                >
                                    Not your school? Clear
                                </button>
                            </div>
                        )}
                        
                    </div>

                    <button 
                        type="button" 
                        onClick={() => {
                            if (selectedSchool) {
                                console.log("Step 2 complete - School selected:", selectedSchool);
                                setSchoolId(selectedSchool.id);
                                onNext();
                            }
                        }}
                        disabled={!selectedSchool}
                        className={`w-full text-white font-semibold rounded-xl mt-10 px-6 py-4 outline-none transition-opacity ${
                            selectedSchool ? "bg-indigo hover:opacity-90 cursor-pointer" : "bg-indigo opacity-50 cursor-not-allowed"
                        }`}
                    >
                        Continue
                    </button>
                </div>
            </main>
        </div>
    )
}
