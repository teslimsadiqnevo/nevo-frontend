import Link from "next/link";
import type { ReactNode } from "react";

type VerificationStatusScreenProps = {
  title: string;
  description: ReactNode;
  icon: "mail" | "check";
  primaryLabel?: string;
  onPrimaryClick?: () => void;
  primaryDisabled?: boolean;
  primaryMuted?: boolean;
  helperText?: string | null;
  helperTone?: "info" | "error";
  secondaryText?: string | null;
  secondaryLinkLabel?: string;
  secondaryLinkHref?: string;
  secondaryLinkOnClick?: () => void;
};

function MailIcon() {
  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-[#9A9CCB]/20" />
      <svg
        className="relative z-10"
        width="40"
        height="32"
        viewBox="0 0 40 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 4H36C38.2 4 40 5.8 40 8V24C40 26.2 38.2 28 36 28H4C1.8 28 0 26.2 0 24V8C0 5.8 1.8 4 4 4Z"
          stroke="#3B3F6E"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M40 8L20 21L0 8"
          stroke="#3B3F6E"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function CheckIcon() {
  return (
    <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#7AB87A]">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10 20L17 27L30 14"
          stroke="#F7F1E6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function VerificationStatusScreen({
  title,
  description,
  icon,
  primaryLabel,
  onPrimaryClick,
  primaryDisabled = false,
  primaryMuted = false,
  helperText,
  helperTone = "info",
  secondaryText,
  secondaryLinkLabel,
  secondaryLinkHref,
  secondaryLinkOnClick,
}: VerificationStatusScreenProps) {
  const secondaryLink = secondaryLinkHref ? (
    <Link
      href={secondaryLinkHref}
      className="text-[13px] leading-5 text-[#3B3F6E]/65 transition-opacity hover:opacity-100"
    >
      {secondaryLinkLabel}
    </Link>
  ) : secondaryLinkOnClick ? (
    <button
      type="button"
      onClick={secondaryLinkOnClick}
      className="text-[13px] leading-5 text-[#3B3F6E]/65 transition-opacity hover:opacity-100"
    >
      {secondaryLinkLabel}
    </button>
  ) : null;

  return (
    <div className="min-h-screen bg-[#F7F1E6] px-6">
      <div className="mx-auto flex min-h-screen w-full max-w-[1024px] items-center justify-center">
        <div className="flex w-full max-w-[292px] flex-col items-center text-center">
          {icon === "mail" ? <MailIcon /> : <CheckIcon />}

          <h1 className="mt-6 text-[22px] font-bold leading-[33px] tracking-[-0.2px] text-[#3B3F6E]">
            {title}
          </h1>

          <div className="mt-[10px] text-[15px] font-normal leading-[22px] text-[#1A1A1A]">
            {description}
          </div>

          {primaryLabel ? (
            <button
              type="button"
              onClick={onPrimaryClick}
              disabled={primaryDisabled}
              className={`mt-8 flex h-12 w-full items-center justify-center rounded-xl border border-[#3B3F6E] text-[15px] font-medium leading-[22px] transition-all ${
                primaryDisabled
                  ? "cursor-not-allowed text-[#3B3F6E]/40"
                  : "cursor-pointer text-[#3B3F6E] hover:bg-[#3B3F6E]/[0.02] active:scale-[0.98]"
              } ${primaryMuted ? "opacity-50" : ""}`}
            >
              {primaryLabel}
            </button>
          ) : null}

          {helperText ? (
            <p
              className={`mt-4 text-[13px] leading-5 ${
                helperTone === "error" ? "text-[#E57661]" : "text-[#9A9CCB]"
              }`}
            >
              {helperText}
            </p>
          ) : null}

          {secondaryText ? (
            <p className="mt-2 text-[12px] leading-[18px] text-[#1A1A1A]/50">{secondaryText}</p>
          ) : null}

          {secondaryLink ? <div className="mt-3">{secondaryLink}</div> : null}
        </div>
      </div>
    </div>
  );
}
