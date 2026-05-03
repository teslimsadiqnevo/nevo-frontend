'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VerificationStatusScreen } from "@/shared/ui";

type VerifyStatus = "verifying" | "success" | "expired" | "invalid";

function setCookie(name: string, value: string) {
  // Accessible to middleware (not HttpOnly).
  // Token sizes may be large, but cookies are still required for server-side middleware checks.
  const maxAge = 60 * 60 * 24 * 30;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
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

        const res = await fetch(`/api/auth/verify-email`, {
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

          const role = String(userFromBackend?.role || "").toUpperCase();
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
            if (role === "SCHOOL_ADMIN") {
              router.replace("/register/school/data-agreement");
              return;
            }
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

  const getPendingUser = () => {
    try {
      const userRaw = localStorage.getItem("user");
      if (!userRaw) return null;
      return JSON.parse(userRaw);
    } catch {
      return null;
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendError(null);

    const pendingUser = getPendingUser();
    const email = typeof pendingUser?.email === "string" ? pendingUser.email : null;
    if (!email) {
      setResendError("No email found to resend. Please go back to the check-your-email screen.");
      return;
    }

    try {
        const resendPath =
          String(pendingUser?.role || "").toUpperCase() === "SCHOOL_ADMIN"
            ? `/api/auth/resend-verification`
            : `/api/auth/resend-verification`;
        const res = await fetch(resendPath, {
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

  const title =
    status === "verifying"
      ? "Verifying your email"
      : status === "success"
        ? "You're verified."
        : status === "expired"
          ? "Check your email"
          : "Verification issue";

  const description =
    status === "success" ? (
      <>Taking you to your dashboard.</>
    ) : (
      <>{message}</>
    );

  return (
    <VerificationStatusScreen
      icon={status === "success" ? "check" : "mail"}
      title={title}
      description={description}
      primaryLabel={
        showResend ? (resendCooldown > 0 ? `Resend again in ${resendCooldown}s` : "Resend email") : undefined
      }
      onPrimaryClick={showResend ? handleResend : undefined}
      primaryDisabled={!showResend || resendCooldown > 0}
      primaryMuted={showResend && resendCooldown > 0}
      helperText={
        resendError
          ? resendError
          : status === "invalid"
            ? "This link may have already been used, or it may be invalid."
            : null
      }
      helperTone={resendError ? "error" : "info"}
    />
  );
}
