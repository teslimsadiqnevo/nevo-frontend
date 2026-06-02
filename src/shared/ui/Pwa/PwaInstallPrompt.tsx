'use client';

import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari() {
  if (typeof window === "undefined") return false;

  const ua = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(ua);
  const isSafari = /safari/.test(ua) && !/crios|fxios|edgios/.test(ua);
  return isIos && isSafari;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const dismissedAt = window.localStorage.getItem("nevo-pwa-install-dismissed");
    if (dismissedAt) {
      setDismissed(true);
    }

    if (!isStandalone() && isIosSafari()) {
      setShowIosHint(true);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setShowIosHint(false);
      window.localStorage.removeItem("nevo-pwa-install-dismissed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const shouldShow = useMemo(() => {
    if (dismissed || isStandalone()) return false;
    return Boolean(deferredPrompt) || showIosHint;
  }, [deferredPrompt, dismissed, showIosHint]);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("nevo-pwa-install-dismissed", new Date().toISOString());
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
      setDismissed(true);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("nevo-pwa-install-dismissed");
      }
    }
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-4 md:px-6">
      <div className="pointer-events-auto mx-auto flex w-full max-w-[760px] flex-col gap-4 rounded-[22px] border border-indigo/10 bg-[#FAF9F6]/95 px-4 py-4 shadow-[0_18px_50px_rgba(43,43,47,0.14)] backdrop-blur sm:rounded-[26px] sm:px-5 md:flex-row md:items-center md:justify-between md:gap-6 md:px-6">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo/70 sm:text-[12px]">
            Install Nevo
          </p>
          <p className="mt-1 max-w-[46rem] text-[13px] leading-5 text-graphite-70 sm:text-[14px] sm:leading-6">
            {showIosHint && !deferredPrompt
              ? "On iPad or iPhone, use Share and then Add to Home Screen for the full app experience."
              : "Add Nevo to your tablet home screen for faster launch, offline lessons, and a cleaner app shell."}
          </p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:gap-3 md:min-w-[244px]">
          {deferredPrompt ? (
            <button
              type="button"
              onClick={handleInstall}
              className="inline-flex h-11 min-w-0 items-center justify-center whitespace-nowrap rounded-[18px] bg-indigo px-4 text-[13px] font-semibold text-parchment shadow-[0_8px_20px_rgba(59,63,110,0.18)] transition hover:-translate-y-0.5 sm:min-w-[112px] sm:px-5"
            >
              Install app
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleDismiss}
            className={`${deferredPrompt ? "" : "col-span-2"} inline-flex h-11 min-w-0 items-center justify-center whitespace-nowrap rounded-[18px] border border-indigo/15 bg-parchment px-4 text-[13px] font-semibold text-indigo transition hover:border-indigo/35 sm:min-w-[112px] sm:px-5`}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
