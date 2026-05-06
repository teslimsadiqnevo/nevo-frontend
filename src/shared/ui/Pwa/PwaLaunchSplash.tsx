'use client';

import { useEffect, useState } from "react";
import { SplashScreen } from "@/shared/ui/SplashScreen";

function shouldShowStandaloneSplash() {
  if (typeof window === "undefined") return false;

  const standalone =
    window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return standalone;
}

export function PwaLaunchSplash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!shouldShowStandaloneSplash()) {
      return;
    }

    setVisible(true);
    const timeout = window.setTimeout(() => {
      setVisible(false);
    }, 900);

    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) {
    return null;
  }

  return <SplashScreen />;
}
