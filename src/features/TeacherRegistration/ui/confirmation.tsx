"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { VerificationStatusScreen } from "@/shared/ui";

export function RegistrationConfirmation({
    email,
    nextPath = "/register/teacher/workspace",
}: {
    email: string;
    nextPath?: string;
}) {
    const router = useRouter();
    const displayEmail = useMemo(() => email || "your email", [email]);

    const [resendCooldown, setResendCooldown] = useState<number>(0);
    const [resending, setResending] = useState<boolean>(false);
    const [resendError, setResendError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    useEffect(() => {
        // Keep a pending "user" object for resend on other tabs (verify-email page).
        // Do not mark the user verified here; only backend token validation should do that.
        try {
            const existingRaw = localStorage.getItem("user");
            const existing = existingRaw ? JSON.parse(existingRaw) : null;
            if (!existing || existing?.emailVerified !== true) {
                localStorage.setItem(
                    "user",
                    JSON.stringify({
                        ...(existing || {}),
                        email,
                        role: existing?.role || "TEACHER",
                        emailVerified: false,
                    }),
                );
            }
        } catch {
            // Ignore localStorage errors (private mode etc.)
        }
        // Push on mount if the token already exists.
        try {
            const accessToken = localStorage.getItem("access_token");
            if (accessToken) router.push(nextPath);
        } catch {
            // ignore
        }

        const onStorage = (e: StorageEvent) => {
            if (e.key !== "access_token") return;
            if (e.newValue) {
                router.push(nextPath);
            }
        };

        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, [email, nextPath, router]);

    useEffect(() => {
        if (resendCooldown <= 0) return;

        const t = window.setInterval(() => {
            setResendCooldown((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => window.clearInterval(t);
    }, [resendCooldown]);

    const handleResend = async () => {
        setResendError(null);
        setNotice(null);
        if (resendCooldown > 0 || resending) return;

        const emailToSend = email;
        if (!emailToSend) {
            setResendError("Missing email address. Please go back and register again.");
            return;
        }

        setResending(true);
        try {
                const res = await fetch(`/api/auth/teacher/resend-verification`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailToSend }),
            });

            if (!res.ok) {
                setResendError("Could not resend verification email. Please try again.");
                return;
            }

            setResendCooldown(60);
            setNotice("Email resent. Check your inbox.");
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

    const helperText = resendError ?? notice;
    const secondaryText = resendCooldown > 0 ? buttonLabel : null;

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
        helperText={helperText}
        helperTone={resendError ? "error" : "info"}
        secondaryText={secondaryText}
        secondaryLinkLabel="Change email address"
        secondaryLinkHref="/register/teacher"
      />
    );
}
