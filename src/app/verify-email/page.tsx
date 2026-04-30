'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type VerifyStatus = "verifying" | "success" | "expired" | "invalid";

function setCookie(name: string, value: string) {
  // Accessible to middleware (not HttpOnly).
  // Token sizes may be large, but cookies are still required for server-side middleware checks.
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=60*60*24*30; SameSite=Lax`;
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const safeToken = useMemo(() => token || "", [token]);

  const [status, setStatus] = useState<VerifyStatus>(safeToken ? "verifying" : "invalid");
  const [message, setMessage] = useState<string>(
    safeToken ? "Verifying your email..." : "Verification link is invalid or missing a token."
  );
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (!safeToken) return;

    let mounted = true;

    async function verify() {
      try {
        setStatus("verifying");
        setMessage("Verifying your email...");

        const res = await fetch(`/api/auth/teacher/verify-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: safeToken }),
        });

        const data = await res.json().catch(() => ({}));

        if (!mounted) return;

        if (res.ok) {
          const accessToken = String(data?.token || data?.access_token || "");
          const refreshToken = String(data?.refresh_token || data?.refreshToken || "");
          const userFromBackend = data?.user || {};

          const userForApp = {
            ...userFromBackend,
            // Email verified is true because the backend accepted the token.
            emailVerified: userFromBackend?.emailVerified ?? true,
          };

          // Also write to cookies so middleware can protect downstream onboarding routes.
          setCookie("access_token", accessToken);
          setCookie("refresh_token", refreshToken);
          setCookie("user", JSON.stringify(userForApp));

          // Then write localStorage so other tabs can detect via `storage` event.
          localStorage.setItem("access_token", accessToken);
          localStorage.setItem("refresh_token", refreshToken);
          localStorage.setItem("user", JSON.stringify(userForApp));

          setStatus("success");
          setMessage("Email verified. Redirecting...");

          setTimeout(() => {
            router.replace("/register/teacher/workspace");
          }, 1500);
          return;
        }

        // Error states
        if (res.status === 422) {
          const detail = String((data as any)?.detail || "");
          if (/(expired|expire)/i.test(detail) || /\bexp\b/i.test(detail)) {
            setStatus("expired");
            setMessage("This verification link has expired.");
            return;
          }

          setStatus("invalid");
          setMessage("This verification link may have already been used.");
          return;
        }

        if (res.status === 400 || res.status === 409) {
          // Backend may reject already-verified token with 400/409 (duplicate click).
          setStatus("invalid");
          setMessage("This verification link may have already been used.");
          return;
        }

        setStatus("invalid");
        setMessage("Verification failed. Please request a new link.");
      } catch {
        if (!mounted) return;
        setStatus("invalid");
        setMessage("Verification failed. Please request a new link.");
      }
    }

    verify();

    return () => {
      mounted = false;
    };
  }, [safeToken, router]);

  useEffect(() => {
    if (!resendCooldown || resendCooldown <= 0) return;

    const t = window.setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(t);
  }, [resendCooldown]);

  const getPendingEmail = () => {
    try {
      const userRaw = localStorage.getItem("user");
      if (!userRaw) return null;
      const user = JSON.parse(userRaw);
      return typeof user?.email === "string" ? user.email : null;
    } catch {
      return null;
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendError(null);

    const email = getPendingEmail();
    if (!email) {
      setResendError("No email found to resend. Please go back to the check-your-email screen.");
      return;
    }

    try {
        const res = await fetch(`/api/auth/teacher/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        setResendError("Could not resend verification email. Please try again.");
        return;
      }

      setResendCooldown(60);
      setMessage("Verification email resent. Check your inbox.");
    } catch {
      setResendError("Could not resend verification email. Please try again.");
    }
  };

  const showResend = status === "expired";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F1E6] px-6">
      <div className="w-full max-w-[420px] bg-white border border-[#E9E7E2] rounded-2xl p-7 text-center shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
        <h1 className="text-[22px] font-bold text-[#3B3F6E] mb-3">
          {status === "verifying"
            ? "Verifying Email"
            : status === "success"
              ? "Verified"
              : status === "expired"
                ? "Link Expired"
                : "Verification Issue"}
        </h1>

        <p className="text-[14px] text-[#4A4A50] leading-relaxed">{message}</p>

        {resendError && (
          <p className="text-[12px] text-[#E57661] mt-4 leading-relaxed font-medium">
            {resendError}
          </p>
        )}

        {showResend && (
          <div className="mt-6">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className={`w-full text-white font-bold rounded-xl py-[14px] text-[14px] outline-none transition-all ${
                resendCooldown > 0
                  ? "bg-[#9A9BB5] cursor-not-allowed opacity-90"
                  : "bg-[#3B3F6E] hover:opacity-90 active:scale-[0.98] cursor-pointer"
              }`}
            >
              {resendCooldown > 0 ? `Resending in ${resendCooldown}s` : "Resend verification email"}
            </button>
          </div>
        )}

        {status === "invalid" && (
          <p className="text-[12px] text-[#A29ECA] mt-4 leading-relaxed font-medium">
            This link may have already been used, or it may be invalid.
          </p>
        )}
      </div>
    </div>
  );
}
