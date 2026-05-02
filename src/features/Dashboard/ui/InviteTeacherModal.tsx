'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
    checkSchoolTeacherInviteEmail,
    getSchoolTeacherInviteForm,
    inviteSchoolTeacher,
} from '../api/school';

type ClassOption = {
    class_id: string;
    class_name: string;
};

type EmailCheck = {
    exists_on_nevo: boolean;
    is_existing_teacher: boolean;
    already_in_school: boolean;
    in_other_school: boolean;
    is_non_teacher_account: boolean;
    can_invite: boolean;
    notice: string | null;
};

type InviteTeacherModalProps = {
    onClose: () => void;
    onSuccess: () => Promise<void> | void;
};

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export function InviteTeacherModal({ onClose, onSuccess }: InviteTeacherModalProps) {
    const [formLoading, setFormLoading] = useState(true);
    const [formOptions, setFormOptions] = useState<{
        school_code: string | null;
        classes: ClassOption[];
        empty_classes_label: string;
    } | null>(null);
    const [email, setEmail] = useState('');
    const [classId, setClassId] = useState<string>('');
    const [check, setCheck] = useState<EmailCheck | null>(null);
    const [checking, setChecking] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [sentEmail, setSentEmail] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastCheckedEmailRef = useRef<string>('');

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            const res = await getSchoolTeacherInviteForm();
            if (cancelled) return;
            if ('data' in res && res.data) {
                setFormOptions({
                    school_code: res.data.school_code ?? null,
                    classes: Array.isArray(res.data.classes) ? res.data.classes : [],
                    empty_classes_label: res.data.empty_classes_label || 'No classes yet',
                });
            }
            setFormLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        const trimmed = email.trim();
        if (!isValidEmail(trimmed)) {
            setCheck(null);
            setChecking(false);
            lastCheckedEmailRef.current = '';
            return;
        }

        if (trimmed === lastCheckedEmailRef.current && check) return;

        debounceRef.current = setTimeout(async () => {
            setChecking(true);
            const res = await checkSchoolTeacherInviteEmail(trimmed);
            lastCheckedEmailRef.current = trimmed;
            if ('data' in res && res.data) {
                setCheck(res.data as EmailCheck);
            } else {
                setCheck(null);
            }
            setChecking(false);
        }, 350);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [email, check]);

    const inputState = useMemo<'default' | 'active' | 'success' | 'blocked'>(() => {
        const trimmed = email.trim();
        if (!trimmed) return 'default';
        if (!isValidEmail(trimmed) || checking || !check) return 'active';
        if (check.can_invite) return 'success';
        return 'blocked';
    }, [email, check, checking]);

    const helperText = useMemo(() => {
        if (!email.trim() || checking) return null;
        return check?.notice || null;
    }, [email, checking, check]);

    const helperTone: 'lavender' | 'amber' | null = useMemo(() => {
        if (!helperText) return null;
        if (inputState === 'success') return 'lavender';
        return 'amber';
    }, [helperText, inputState]);

    const canSubmit = useMemo(() => {
        if (submitting) return false;
        if (!isValidEmail(email.trim())) return false;
        if (!check) return false;
        return check.can_invite === true;
    }, [submitting, email, check]);

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitError(null);
        setSubmitting(true);
        const payload: Record<string, any> = { email: email.trim() };
        if (classId) payload.class_ids = [classId];
        const res = await inviteSchoolTeacher(payload);
        setSubmitting(false);
        if ('error' in res && res.error) {
            setSubmitError(res.error);
            return;
        }
        setSentEmail(email.trim());
    };

    const resetForAnother = () => {
        setEmail('');
        setClassId('');
        setCheck(null);
        setSubmitError(null);
        setSentEmail(null);
        lastCheckedEmailRef.current = '';
    };

    const handleDone = async () => {
        await onSuccess();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6" onClick={onClose}>
            <div
                className="w-[480px] rounded-[16px] bg-[#FCFCFC] shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
                onClick={(event) => event.stopPropagation()}
            >
                {sentEmail ? (
                    <SentState email={sentEmail} onAnother={resetForAnother} onDone={handleDone} onClose={onClose} />
                ) : (
                    <FormState
                        formLoading={formLoading}
                        formOptions={formOptions}
                        email={email}
                        onEmailChange={setEmail}
                        classId={classId}
                        onClassIdChange={setClassId}
                        inputState={inputState}
                        helperText={helperText}
                        helperTone={helperTone}
                        canSubmit={canSubmit}
                        submitting={submitting}
                        submitError={submitError}
                        onSubmit={handleSubmit}
                        onClose={onClose}
                    />
                )}
            </div>
        </div>
    );
}

type FormStateProps = {
    formLoading: boolean;
    formOptions: { classes: ClassOption[]; empty_classes_label: string } | null;
    email: string;
    onEmailChange: (value: string) => void;
    classId: string;
    onClassIdChange: (value: string) => void;
    inputState: 'default' | 'active' | 'success' | 'blocked';
    helperText: string | null;
    helperTone: 'lavender' | 'amber' | null;
    canSubmit: boolean;
    submitting: boolean;
    submitError: string | null;
    onSubmit: () => void;
    onClose: () => void;
};

function FormState({
    formLoading,
    formOptions,
    email,
    onEmailChange,
    classId,
    onClassIdChange,
    inputState,
    helperText,
    helperTone,
    canSubmit,
    submitting,
    submitError,
    onSubmit,
    onClose,
}: FormStateProps) {
    const inputBorder =
        inputState === 'success'
            ? 'border-[2px] border-[#9A9CCB]'
            : inputState === 'active'
                ? 'border-[2px] border-[#3B3F6E]'
                : inputState === 'blocked'
                    ? 'border-[2px] border-[#D4534A]/60'
                    : 'border-[1px] border-[#3B3F6E]/40';

    const helperColor =
        helperTone === 'lavender' ? 'text-[#9A9CCB]' : helperTone === 'amber' ? 'text-[#B85A2C]' : 'text-[#2B2B2F]/60';

    const noClasses = !formLoading && (formOptions?.classes.length ?? 0) === 0;

    return (
        <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <h2 className="text-[20px] font-bold leading-[30px] text-[#3B3F6E]">Invite a teacher</h2>
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="flex h-11 w-11 items-center justify-center text-[#3B3F6E]/70 cursor-pointer bg-transparent border-none"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.875" strokeLinecap="round" />
                    </svg>
                </button>
            </div>

            <div className="px-6 pb-6">
                <label className="block text-[14px] font-semibold uppercase tracking-[0.04em] leading-[21px] text-[#3B3F6E]/70">
                    Teacher's email address
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(event) => onEmailChange(event.target.value)}
                    placeholder="teacher@school.com"
                    autoFocus
                    className={`mt-2 h-[52px] w-full rounded-[12px] bg-[#F7F1E6] px-4 text-[15px] leading-[22px] text-[#2B2B2F] placeholder:text-[#9CA3AF] outline-none transition-colors ${inputBorder}`}
                />
                {helperText ? (
                    <p className={`mt-2 text-[13px] leading-5 ${helperColor}`}>{helperText}</p>
                ) : null}

                <div className="mt-5 flex items-center justify-between">
                    <label className="text-[14px] font-semibold leading-[21px] text-[#3B3F6E]/70">Assign to class</label>
                    <span className="rounded-[12px] bg-[#9A9CCB] px-2.5 py-1 text-[11px] font-medium leading-4 text-[#FCFCFC]">
                        Optional
                    </span>
                </div>
                <div className="mt-2 relative">
                    <select
                        value={classId}
                        onChange={(event) => onClassIdChange(event.target.value)}
                        disabled={formLoading || noClasses}
                        className="h-[52px] w-full rounded-[12px] border border-[#3B3F6E]/40 bg-[#F7F1E6] pl-4 pr-10 text-[15px] leading-[22px] text-[#2B2B2F] outline-none appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-55"
                    >
                        <option value="">{noClasses ? formOptions?.empty_classes_label : 'No class yet'}</option>
                        {formOptions?.classes.map((option) => (
                            <option key={option.class_id} value={option.class_id}>
                                {option.class_name}
                            </option>
                        ))}
                    </select>
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-60"
                    >
                        <path
                            d="M5 7.5L10 12.5L15 7.5"
                            stroke="#3B3F6E"
                            strokeWidth="1.875"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>

                {submitError ? <p className="mt-3 text-[13px] leading-5 text-[#D4534A]">{submitError}</p> : null}

                <button
                    onClick={onSubmit}
                    disabled={!canSubmit}
                    className={`mt-6 h-[52px] w-full rounded-[12px] text-[15px] font-semibold leading-[22px] text-[#F7F1E6] transition-opacity cursor-pointer disabled:cursor-not-allowed ${
                        canSubmit ? 'bg-[#3B3F6E]' : 'bg-[#3B3F6E] opacity-40'
                    }`}
                >
                    {submitting ? 'Sending invite...' : 'Send invite'}
                </button>
            </div>
        </>
    );
}

function SentState({
    email,
    onAnother,
    onDone,
    onClose,
}: {
    email: string;
    onAnother: () => void;
    onDone: () => void | Promise<void>;
    onClose: () => void;
}) {
    return (
        <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <h2 className="text-[20px] font-bold leading-[30px] text-[#3B3F6E]">Invite a teacher</h2>
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="flex h-11 w-11 items-center justify-center text-[#3B3F6E]/70 cursor-pointer bg-transparent border-none"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.875" strokeLinecap="round" />
                    </svg>
                </button>
            </div>

            <div className="flex flex-col items-center px-6 pb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7AB87A]/15">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <path
                            d="M7 14.5L11.5 19L21 9"
                            stroke="#7AB87A"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
                <h3 className="mt-5 text-center text-[16px] font-semibold leading-6 text-[#3B3F6E]">
                    Invite sent to {email}
                </h3>
                <p className="mt-3 max-w-[308px] text-center text-[14px] leading-[21px] text-[#2B2B2F]/65">
                    They'll receive an email with your school code.
                </p>

                <button
                    onClick={onAnother}
                    className="mt-7 h-12 w-full rounded-[12px] border border-[#3B3F6E] bg-[#FCFCFC] text-[15px] font-medium leading-[22px] text-[#3B3F6E] cursor-pointer"
                >
                    Invite another
                </button>
                <button
                    onClick={() => void onDone()}
                    className="mt-3 h-12 w-full rounded-[12px] bg-[#3B3F6E] text-[15px] font-semibold leading-[22px] text-[#F7F1E6] cursor-pointer"
                >
                    Done
                </button>
            </div>
        </>
    );
}
