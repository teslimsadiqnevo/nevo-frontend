"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

const prefetchedRoutes = new Set<string>();

type IdleCallbackHandle = number;
type IdleCallbackDeadline = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (
    callback: (deadline: IdleCallbackDeadline) => void,
    options?: { timeout?: number },
  ) => IdleCallbackHandle;
  cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
};

export function useIdleRoutePrefetch(
  routes: Array<string | null | undefined | false>,
  options: { enabled?: boolean; delayMs?: number } = {},
) {
  const router = useRouter();
  const enabled = options.enabled ?? true;
  const delayMs = options.delayMs ?? 1800;
  const routeKey = routes.filter(Boolean).join("|");
  const normalizedRoutes = useMemo(
    () => Array.from(new Set(routes.filter((route): route is string => Boolean(route)))),
    [routeKey],
  );

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const uniqueRoutes = normalizedRoutes.filter((route) => !prefetchedRoutes.has(route));

    if (uniqueRoutes.length === 0) return;

    const win = window as WindowWithIdleCallback;
    let idleHandle: IdleCallbackHandle | null = null;
    let cancelled = false;

    const timer = window.setTimeout(() => {
      const run = () => {
        if (cancelled) return;
        for (const route of uniqueRoutes) {
          prefetchedRoutes.add(route);
          router.prefetch(route);
        }
      };

      if (win.requestIdleCallback) {
        idleHandle = win.requestIdleCallback(run, { timeout: 2500 });
      } else {
        window.setTimeout(run, 0);
      }
    }, delayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (idleHandle !== null && win.cancelIdleCallback) {
        win.cancelIdleCallback(idleHandle);
      }
    };
  }, [delayMs, enabled, normalizedRoutes, router]);
}
