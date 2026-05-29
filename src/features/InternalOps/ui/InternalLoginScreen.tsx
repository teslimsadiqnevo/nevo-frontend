"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { NevoLogo } from "@/shared/ui/NevoLogo";

function EyeIcon({ muted = false }: { muted?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={muted ? "opacity-40" : ""}
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
    >
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function InternalLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/internal/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setError("Invalid credentials");
        return;
      }

      router.replace("/internal/live");
      router.refresh();
    } catch {
      setError("Invalid credentials");
    } finally {
      setIsSubmitting(false);
    }
  }

  const fieldClassName = `h-[52px] w-full rounded-[12px] border bg-[#2b2b2fcc] px-4 text-[15px] text-[#f7f1e6] outline-none transition placeholder:text-[#f7f1e64d] focus:border-[#f7f1e6] ${
    error ? "border-[#c0392b]" : "border-[#f7f1e633]"
  }`;

  return (
    <main className="min-h-dvh bg-[#3b3f6e] text-[#f7f1e6]">
      <section className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col px-4">
        <div className="flex flex-col items-center pt-16">
          <NevoLogo alt="Nevo" height={28} variant="light" width={93} />
          <p className="mt-2 text-[12px] font-normal text-[#f7f1e666]">
            Internal Dashboard
          </p>
        </div>

        <form className="mt-20" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="internal-email">
            Email
          </label>
          <input
            autoComplete="email"
            className={fieldClassName}
            id="internal-email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            type="email"
            value={email}
          />

          <label className="sr-only" htmlFor="internal-password">
            Password
          </label>
          <div className="relative mt-4">
            <input
              autoComplete="current-password"
              className={`${fieldClassName} pr-12`}
              id="internal-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#f7f1e6]"
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              <EyeIcon muted={!showPassword} />
            </button>
          </div>

          {error ? (
            <p className="mt-3 text-[13px] font-normal text-[#c0392b]">
              {error}
            </p>
          ) : null}

          <button
            className="mt-6 h-[52px] w-full rounded-[12px] bg-[#f7f1e6] text-[15px] font-semibold text-[#3b3f6e] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting || !email || !password}
            type="submit"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
