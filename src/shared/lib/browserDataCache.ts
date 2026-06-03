"use client";

type CacheEnvelope<T> = {
  value: T;
  updatedAt: number;
};

const memoryCache = new Map<string, CacheEnvelope<unknown>>();

export function readBrowserDataCache<T>(key: string, maxAgeMs: number): T | null {
  if (typeof window === "undefined") return null;

  const fromMemory = memoryCache.get(key) as CacheEnvelope<T> | undefined;
  if (fromMemory && Date.now() - fromMemory.updatedAt <= maxAgeMs) {
    return fromMemory.value;
  }

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed?.updatedAt || Date.now() - parsed.updatedAt > maxAgeMs) {
      window.sessionStorage.removeItem(key);
      return null;
    }

    memoryCache.set(key, parsed);
    return parsed.value;
  } catch {
    return null;
  }
}

export function writeBrowserDataCache<T>(key: string, value: T) {
  if (typeof window === "undefined") return;

  const envelope: CacheEnvelope<T> = {
    value,
    updatedAt: Date.now(),
  };

  memoryCache.set(key, envelope);

  try {
    window.sessionStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // Storage can be unavailable or full. Memory cache still covers this tab.
  }
}
