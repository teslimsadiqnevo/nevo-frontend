'use client';

import { useEffect } from "react";

export function PwaRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        registration.update().catch(() => undefined);
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Failed to register service worker", error);
        }
      }
    };

    register();
  }, []);

  return null;
}
