"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  resetSchoolPassword,
  resetTeacherPassword,
} from "@/features/TeacherLogin/api/teacherAuth";

type PasswordRole = "teacher" | "school";

function resolveRole(rawRole: string | null): PasswordRole {
  return rawRole === "school" ? "school" : "teacher";
}

function buildErrorMessage(
  password: string,
  confirmPassword: string,
  token: string,
) {
  if (!token) return "Missing reset token.";
  if (password.length > 0 && password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (confirmPassword.length > 0 && password !== confirmPassword) {
    return "Passwords do not match.";
  }
  return null;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const role = useMemo<PasswordRole>(
    () => resolveRole(searchParams.get("role")),
    [searchParams],
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const validationError = buildErrorMessage(password, confirmPassword, token);
  const canSubmit =
    Boolean(token) &&
    password.length >= 8 &&
    password === confirmPassword &&
    !isLoading;

  const signInHref = role === "school" ? "/login/school" : "/login/teacher";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setServerError(null);

    const result =
      role === "school"
        ? await resetSchoolPassword(token, password)
        : await resetTeacherPassword(token, password);

    setIsLoading(false);

    if (result.error) {
      setServerError(result.error);
      return;
    }

    setDone(true);
  };

  const inlineError = serverError || validationError;

  return (
    <div className="min-h-screen bg-[#F7F1E6]">
      <div className="mx-auto flex h-[900px] w-[1024px] flex-col bg-[#F7F1E6]">
        <div className="h-[70.5px]">
          <Link
            href={signInHref}
            className="ml-10 mt-9 inline-flex h-[44px] items-center gap-2 text-[15px] font-normal leading-[22px] text-[#3B3F6E]"
          >
            <BackIcon />
            <span>Sign in</span>
          </Link>
        </div>

        <div className="flex h-[829.5px] items-center justify-center">
          <div className="w-[480px]">
            {done ? (
              <div className="mx-auto flex w-[432px] flex-col items-center">
                <ResetPasswordIllustration />
                <div className="mt-6 flex flex-col items-center gap-2">
                  <h1 className="text-center text-[22px] font-bold leading-[33px] text-[#3B3F6E]">
                    Password updated
                  </h1>
                  <p className="max-w-[320px] text-center text-[15px] leading-6 text-[#2B2B2F]/65">
                    Your password has been reset successfully. You can now sign in with your new password.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(signInHref)}
                  className="mt-8 h-[52px] w-[448px] rounded-[12px] bg-[#3B3F6E] text-[16px] font-semibold text-[#F7F1E6]"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mx-auto flex w-[480px] flex-col items-center">
                <div className="flex w-[432px] justify-center">
                  <ResetPasswordIllustration />
                </div>

                <div className="mt-6 flex w-[432px] flex-col items-center gap-[10px]">
                  <h1 className="text-center text-[22px] font-bold leading-[33px] text-[#3B3F6E]">
                    Reset your password
                  </h1>
                  <p className="text-center text-[15px] leading-6 text-[#2B2B2F]/65">
                    Create your new password below
                  </p>
                </div>

                <div className="mt-8 flex w-[448px] flex-col gap-[17px]">
                  <PasswordField
                    value={password}
                    onChange={setPassword}
                    visible={showPassword}
                    onToggleVisibility={() => setShowPassword((current) => !current)}
                    placeholder="Password"
                    hasError={Boolean(inlineError)}
                  />

                  <div className="flex flex-col gap-[6px]">
                    <PasswordField
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      visible={showConfirmPassword}
                      onToggleVisibility={() =>
                        setShowConfirmPassword((current) => !current)
                      }
                      placeholder="Confirm password"
                      hasError={Boolean(inlineError)}
                    />
                    {inlineError ? (
                      <p className="text-[13px] leading-5 text-[#C0392B]">
                        {inlineError}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className={`h-[52px] w-[448px] rounded-[12px] text-[16px] font-semibold text-[#F7F1E6] ${
                      canSubmit
                        ? "bg-[#3B3F6E]"
                        : "cursor-not-allowed bg-[#3B3F6E]/40"
                    }`}
                  >
                    {isLoading ? "Resetting..." : "Reset password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordField({
  value,
  onChange,
  visible,
  onToggleVisibility,
  placeholder,
  hasError,
}: {
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisibility: () => void;
  placeholder: string;
  hasError: boolean;
}) {
  return (
    <div className="relative h-[56px] w-[448px]">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`h-[56px] w-[448px] rounded-[8px] border bg-[#F7F1E6] px-4 pr-12 text-[16px] leading-6 text-[#2B2B2F] outline-none placeholder:text-[rgba(43,43,47,0.6)] ${
          hasError
            ? "border-[rgba(192,57,43,0.4)]"
            : "border-[rgba(59,63,110,0.4)] focus:border-[#3B3F6E]"
        }`}
      />
      <button
        type="button"
        onClick={onToggleVisibility}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(43,43,47,0.6)]"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        <EyeIcon />
      </button>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 6L9 12L15 18" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.333" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.333 8C2.667 5.333 5.067 4 8 4s5.333 1.333 6.667 4c-1.334 2.667-3.734 4-6.667 4S2.667 10.667 1.333 8Z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

function ResetPasswordIllustration() {
  return (
    <div className="relative flex h-[64px] w-[76px] items-center justify-center">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <rect x="6" y="12" width="52" height="40" rx="8" stroke="#9A9CCB" strokeWidth="4" />
        <path d="M18 22L32 34L46 22" stroke="#9A9CCB" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <svg className="absolute right-0 top-5" width="24" height="44" viewBox="0 0 24 44" fill="none">
        <path d="M8 14.5C8 10.9101 10.9101 8 14.5 8C18.0899 8 21 10.9101 21 14.5V18.5H19V14.5C19 12.0147 16.9853 10 14.5 10C12.0147 10 10 12.0147 10 14.5V18.5H8V14.5Z" fill="#9A9CCB" />
        <rect x="6" y="18.5" width="17" height="15" rx="3" stroke="#9A9CCB" strokeWidth="2" />
        <circle cx="14.5" cy="25.5" r="1.75" fill="#9A9CCB" />
        <path d="M14.5 27.5V30.5" stroke="#9A9CCB" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
