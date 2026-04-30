"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetTeacherPassword } from "@/features/TeacherLogin/api/teacherAuth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const canSubmit = token && password.length >= 8 && password === confirmPassword && !isLoading;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsLoading(true);
    setError(null);
    const result = await resetTeacherPassword(token, password);
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-[#F6F5F2] flex items-center justify-center px-6">
      <div className="w-full max-w-[420px] bg-white rounded-2xl border border-[#E9E7E2] p-7">
        <h1 className="text-[22px] font-bold text-[#3B3F6E] mb-2">Set a new password</h1>
        {done ? (
          <div>
            <p className="text-[14px] text-graphite-60 mb-5">Your password has been reset successfully.</p>
            <button
              type="button"
              onClick={() => router.push("/login/teacher")}
              className="w-full bg-[#3B3F6E] text-white rounded-xl py-3 font-semibold text-[14px]"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#E0DDD8] rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#3B3F6E]"
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-[#E0DDD8] rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#3B3F6E]"
            />
            {error && <p className="text-[12px] text-[#E57661]">{error}</p>}
            {!token && <p className="text-[12px] text-[#E57661]">Missing reset token.</p>}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full rounded-xl py-3 font-semibold text-[14px] ${
                canSubmit ? "bg-[#3B3F6E] text-white" : "bg-[#9A9BB5] text-white/90 cursor-not-allowed"
              }`}
            >
              {isLoading ? "Resetting..." : "Reset password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
