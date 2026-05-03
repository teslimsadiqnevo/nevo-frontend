"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VerificationStatusScreen } from "@/shared/ui";

export default function SchoolVerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your school email";

  const displayEmail = useMemo(() => email || "your school email", [email]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const accessToken = localStorage.getItem("access_token");
      if (accessToken) {
        router.replace("/register/school/data-agreement");
      }
    } catch {
      // Ignore storage errors.
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === "access_token" && e.newValue) {
        router.replace("/register/school/data-agreement");
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setResendError(null);
    setNotice(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: displayEmail }),
      });

      if (!res.ok) {
        setResendError("Could not resend verification email. Please try again.");
        return;
      }

      setResendCooldown(60);
      setNotice("Email sent. Check your inbox.");
    } catch {
      setResendError("Could not resend verification email. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const buttonLabel = resending
    ? "Sending..."
    : resendCooldown > 0
      ? `Resend again in ${Math.floor(resendCooldown / 60)}:${(resendCooldown % 60)
          .toString()
          .padStart(2, "0")}`
      : "Resend email";

  return (
    <VerificationStatusScreen
      icon="mail"
      title="Check your email"
      description={
        <>
          We sent a verification link to <strong>{displayEmail}</strong>.
          <br />
          Click the link to confirm your account.
        </>
      }
      primaryLabel={buttonLabel}
      onPrimaryClick={handleResend}
      primaryDisabled={resending || resendCooldown > 0}
      primaryMuted={resending || resendCooldown > 0}
      helperText={resendError ?? notice}
      helperTone={resendError ? "error" : "info"}
      secondaryText={resendCooldown > 0 ? buttonLabel : null}
      secondaryLinkLabel="Change email address"
      secondaryLinkHref="/register/school"
    />
  );
}
