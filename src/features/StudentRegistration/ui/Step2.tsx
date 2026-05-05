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
        <div className="flex min-h-screen w-full justify-center bg-parchment">
            <div className="flex min-h-screen w-full max-w-[1024px] flex-col px-6 pt-[50px]">
                {onBack ? (
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex h-11 w-11 items-center justify-center bg-transparent outline-none border-none"
                    >
                        <Icon type="back" width={24} height={24} />
                    </button>
                ) : (
                    <Link href="/register" className="flex h-11 w-11 items-center justify-center">
                        <Icon type="back" width={24} height={24} />
                    </Link>
                )}

                <main className="mx-auto flex w-full max-w-[976px] flex-col items-center">
                    <div className="flex w-full justify-center pt-6">
                        <p className="text-[13px] font-normal leading-5 text-lavender">Step 2 of 6</p>
                    </div>

                    <header className="flex w-full flex-col items-center gap-2 pb-6 pt-8 text-center">
                        <h1 className="text-[22px] font-bold leading-[33px] text-indigo">Find your school</h1>
                        <h2 className="text-sm leading-[21px] text-graphite/60">
                            Type your school name and select it from the list.
                        </h2>
                    </header>

                    <div className="flex w-full flex-col items-center">
                        <div className="relative w-full">
                            <div className="flex h-14 w-full items-center rounded-xl border-2 border-indigo bg-transparent px-4 transition-colors focus-within:border-2">
                                <div className="mr-3 shrink-0">
                                    <Icon type="search-II" width={20} height={20} />
                                </div>
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
                                    className="w-full bg-transparent text-base font-medium text-indigo outline-none placeholder:text-graphite disabled:text-indigo"
                                />
                                {selectedSchool ? (
                                    <Icon type="tick" className="ml-3 shrink-0" width={20} height={20} />
                                ) : null}
                            </div>

                            {!selectedSchool && searchQuery && (
                                <div className="w-full overflow-hidden rounded-b-xl bg-white shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]">
                                    {isLoading ? (
                                        <div className="flex min-h-[140px] flex-col items-center justify-center px-6 py-8 text-center">
                                            <p className="text-sm leading-[21px] text-graphite/55">Searching...</p>
                                            <p className="mt-1 text-[13px] leading-5 text-graphite/45">
                                                Looking for matching schools on Nevo.
                                            </p>
                                        </div>
                                    ) : error ? (
                                        <div className="flex min-h-[140px] flex-col items-center justify-center px-6 py-8 text-center">
                                            <p className="text-sm text-[#E57661]">{error}</p>
                                            <p className="mt-1 text-[13px] text-graphite">Please try again in a moment.</p>
                                        </div>
                                    ) : schools.length > 0 ? (
                                        <div className="flex flex-col bg-[#FAF9F6]">
                                            {schools.map((school, index) => (
                                                <div
                                                    key={school.id}
                                                    onClick={() => setSelectedSchool(school)}
                                                    className={`flex min-h-14 items-center justify-between px-4 py-4 transition-colors hover:bg-slate-50 ${
                                                        index !== schools.length - 1 ? "border-b border-graphite/10" : ""
                                                    } cursor-pointer`}
                                                >
                                                    <span className="text-[15px] font-medium leading-[22px] text-indigo">
                                                        {school.name}
                                                    </span>
                                                    <span className="text-[13px] leading-5 text-graphite/50">{school.location}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex min-h-[140px] flex-col items-center justify-center px-6 py-8 text-center">
                                            <p className="text-sm leading-[21px] text-graphite/55">
                                                No schools found matching &apos;{searchQuery}&apos;.
                                            </p>
                                            <p className="mt-1 text-[13px] leading-5 text-graphite/45">
                                                Your school may not be registered on Nevo yet.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedSchool && (
                                <div className="mt-4 flex h-[60px] w-full items-center justify-between rounded-xl bg-white/40 px-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-semibold leading-[21px] text-indigo">{selectedSchool.name}</span>
                                        <span className="text-[13px] leading-5 text-graphite/55">{selectedSchool.location}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedSchool(null);
                                            setSchools([]);
                                            setError(null);
                                        }}
                                        className="text-[13px] leading-5 text-lavender transition-opacity hover:opacity-100"
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
                            className={`mt-10 h-[52px] w-full rounded-xl px-6 text-base font-semibold text-white outline-none transition-opacity ${
                                selectedSchool ? "bg-indigo hover:opacity-90 cursor-pointer" : "bg-indigo opacity-40 cursor-not-allowed"
                            }`}
                        >
                            Continue
                        </button>
                    </div>
                </main>
            </div>
        </div>
    )
}
