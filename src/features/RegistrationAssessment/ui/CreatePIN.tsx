"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { registerStudent } from "@/features/StudentRegistration/api/registerStudent";
import { submitAnswers } from "@/features/RegistrationAssessment";
import { Icon } from "@/shared/ui";
import { SplashScreen } from "@/shared/ui/SplashScreen";
import { useRegistrationStore } from "@/shared/store/useRegistrationStore";

export function CreatePIN({ onNext, onBack }: { onNext: () => void; onBack?: () => void; }) {
    const { setPin: setGlobalPin, firstName, surname, age, schoolId, classId, assessmentAnswers, isAutoAdapt } = useRegistrationStore();
    const [mode, setMode] = useState<"enter" | "confirm">("enter");
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const finishBackgroundSetup = async (finalPin: string, token: string, resolvedNevoId: string) => {
        try {
            if (Object.keys(assessmentAnswers).length > 0) {
                const formattedAnswers = Object.entries(assessmentAnswers).map(
                    ([questionId, value]) => ({
                        question_id: Number(questionId),
                        value,
                    })
                );

                const assessResult = await submitAnswers({
                    answers: formattedAnswers,
                    token,
                });

                if (assessResult.error) {
                    console.warn("Assessment submission failed (non-blocking):", assessResult.error);
                }
            }

            const adaptationRes = await fetch(
                `/api/students/me/adaptation?enabled=${encodeURIComponent(String(isAutoAdapt))}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            ).catch(() => null);

            if (adaptationRes && !adaptationRes.ok) {
                console.warn("Adaptation preference save failed during onboarding.");
            }

            const signInResult = await signIn("credentials", {
                firstName: firstName.trim(),
                nevoId: resolvedNevoId,
                pin: finalPin,
                redirect: false,
                callbackUrl: "/dashboard?view=home",
            });

            if (signInResult?.error) {
                console.warn("Automatic sign-in failed after onboarding.");
            }
        } catch (backgroundError) {
            console.warn("Background onboarding tasks failed:", backgroundError);
        }
    };

    if (isSubmitting) {
        return <SplashScreen />;
    }

    const handleKeyPress = (key: string) => {
        if (isSubmitting || status === "success") return;
        
        if (mode === "enter") {
            if (pin.length < 4) {
                const newPin = pin + key;
                setPin(newPin);
                if (newPin.length === 4) {
                    setTimeout(() => setMode("confirm"), 300);
                }
            }
        } else {
            if (status === "error") {
                setStatus("idle");
            }
            
            if (confirmPin.length < 4 && status !== "error") {
                const newConfirm = confirmPin + key;
                setConfirmPin(newConfirm);
                if (newConfirm.length === 4) {
                    if (newConfirm === pin) {
                        setStatus("success");
                        handleSave(newConfirm);
                    } else {
                        setStatus("error");
                        setTimeout(() => {
                            setConfirmPin("");
                        }, 500);
                    }
                }
            } else if (status === "error") {
                setStatus("idle");
                setConfirmPin(key);
            }
        }
    };

    const handleBackspace = () => {
        if (isSubmitting || status === "success") return;
        
        if (mode === "enter") {
            setPin(pin.slice(0, -1));
        } else {
            if (confirmPin.length > 0) {
                setConfirmPin(confirmPin.slice(0, -1));
                setStatus("idle");
            } else {
                setMode("enter");
            }
        }
    };

    const handleSave = async (finalPin: string) => {
        setIsSubmitting(true);
        setErrorMsg("");
        
        setGlobalPin(finalPin);

        try {
            const regResult = await registerStudent({
                fullName: `${firstName.trim()} ${surname.trim()}`.trim(),
                age,
                pin: finalPin,
                schoolId: schoolId || "",
                classId: classId || "",
            });

            if (regResult.error) {
                setErrorMsg(regResult.error);
                setStatus("idle");
                setConfirmPin("");
                setIsSubmitting(false);
                return;
            }

            const { setToken, setNevoId } = useRegistrationStore.getState();
            if (regResult.token) setToken(regResult.token);
            if (regResult.nevoId) setNevoId(regResult.nevoId);
            const resolvedNevoId = regResult.nevoId;

            if (!resolvedNevoId) {
                setErrorMsg("Your account was created, but we couldn't complete sign-in automatically.");
                setStatus("idle");
                setConfirmPin("");
                setIsSubmitting(false);
                return;
            }

            if (regResult.token) {
                void finishBackgroundSetup(finalPin, regResult.token, resolvedNevoId);
            }

            setIsSubmitting(false);
            onNext();
        } catch (error) {
            console.error("Registration flow error:", error);
            setErrorMsg("Something went wrong. Please try again.");
            setStatus("idle");
            setConfirmPin("");
            setIsSubmitting(false);
        }
    };

    const renderDots = (currentStr: string, activeMode: boolean, currentStatus: "idle"| "error" | "success") => {
        return (
            <div className="flex gap-4 items-center justify-center">
                {[0, 1, 2, 3].map(i => {
                    const isFilled = i < currentStr.length;
                    
                    let outerBorderClass = "border-[#E0D9CE]";
                    let showInner = false;
                    let innerBgClass = "bg-indigo";

                    if (isFilled) {
                        showInner = true;
                        if (currentStatus === "success") {
                            outerBorderClass = "border-[#7DBF83]/40";
                            innerBgClass = "bg-[#7DBF83]";
                        } else if (currentStatus === "error") {
                            outerBorderClass = "border-[#E57661]";
                            innerBgClass = "bg-[#E57661]";
                        } else {
                            outerBorderClass = "border-lavender";
                            innerBgClass = "bg-indigo";
                        }
                    } else if (currentStatus === "error" && activeMode) {
                        outerBorderClass = "border-[#E57661]";
                        showInner = false;
                    }
                    
                    return (
                        <div key={i} className={`w-[48px] h-[48px] rounded-full border transition-all duration-200 flex items-center justify-center ${outerBorderClass}`}>
                            {showInner && (
                                <div className={`w-[32px] h-[32px] rounded-full transition-all duration-200 shadow-sm ${innerBgClass}`} />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col flex-1 relative bg-parchment">
            <div className="w-full flex items-center justify-center px-6 xl:px-20 pt-6 z-10 relative">
                {onBack && (
                    <button className="absolute left-6 xl:left-20 cursor-pointer" onClick={onBack}>
                        <Icon type="back" width={24} height={24} />
                    </button>
                )}
                <span className="text-lavender font-medium text-[13px]">Step 5 of 6</span>
            </div>

            <main className="px-6 flex-1 flex flex-col items-center justify-center mt-6 w-full">
                <h1 className="text-2xl font-extrabold text-graphite mb-2">Create your PIN</h1>
                <p className="text-graphite-60 text-sm font-medium mb-10">You&apos;ll use this to log in. Keep it safe.</p>

                <div className="flex flex-col items-center gap-6 min-h-[160px] mb-12">
                     {renderDots(pin, mode === "enter", status === "success" ? "success" : "idle")}
                     
                     {mode === "confirm" && (
                         <>
                            <p className="text-[13px] font-medium text-graphite-60">Enter it again to confirm</p>
                            {renderDots(confirmPin, true, status)}
                            {status === "error" && <p className="text-[#E57661] text-[13px] font-medium">PINs don&apos;t match. Try again.</p>}
                            {status === "success" && (
                                <div className="mt-2 text-[#7DBF83]">
                                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="12" fill="currentColor"/>
                                        <path d="M7 12L10.5 15.5L18 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                     </svg>
                                </div>
                            )}
                            {errorMsg && status !== "error" && <p className="text-[#E57661] text-sm font-medium mt-2">{errorMsg}</p>}
                         </>
                     )}
                     
                     {errorMsg && mode === "enter" && status !== "error" && <p className="text-[#E57661] text-sm font-medium mt-2">{errorMsg}</p>}
                </div>

                <div className="grid grid-cols-3 gap-x-3 gap-y-3">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(num => (
                        <button
                            key={num}
                            onClick={() => handleKeyPress(num)}
                            className="w-[72px] h-[64px] flex items-center justify-center text-xl font-bold border border-[#E0D9CE] rounded-xl bg-transparent active:bg-[#EBE7DF] transition-colors text-indigo"
                        >
                            {num}
                        </button>
                    ))}
                    <div />
                    <button
                        onClick={() => handleKeyPress("0")}
                        className="w-[72px] h-[64px] flex items-center justify-center text-xl font-bold border border-[#E0D9CE] rounded-xl bg-transparent active:bg-[#EBE7DF] transition-colors text-indigo"
                    >
                        0
                    </button>
                    <button
                        onClick={() => handleBackspace()}
                        className="w-[72px] h-[64px] flex items-center justify-center border border-[#E0D9CE] rounded-xl bg-transparent active:bg-[#EBE7DF] transition-colors text-indigo"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 4H10.5C9.7 4 9 4.4 8.5 5.1L3.9 11.3C3.5 11.8 3.5 12.5 3.9 13L8.5 19.3C9 19.9 9.7 20.4 10.5 20.4H21C22.1 20.4 23 19.5 23 18.4V6C23 4.9 22.1 4 21 4ZM18.7 15.3C19.1 15.7 19.1 16.3 18.7 16.7C18.3 17.1 17.7 17.1 17.3 16.7L14.5 13.9L11.7 16.7C11.3 17.1 10.7 17.1 10.3 16.7C9.9 16.3 9.9 15.7 10.3 15.3L13.1 12.5L10.3 9.7C9.9 9.3 9.9 8.7 10.3 8.3C10.7 7.9 11.3 7.9 11.7 8.3L14.5 11.1L17.3 8.3C17.7 7.9 18.3 7.9 18.7 8.3C19.1 8.7 19.1 9.3 18.7 9.7L15.9 12.5L18.7 15.3Z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
            </main>
        </div>
    );
}
