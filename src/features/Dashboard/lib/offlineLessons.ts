"use client";

export type OfflineLessonContentBlock = Record<string, unknown>;

export type OfflineLessonPackage = {
  lesson_id: string;
  original_lesson_id?: string | null;
  title: string;
  subject?: string | null;
  topic?: string | null;
  version_hash: string;
  estimated_size_bytes: number;
  content_blocks: OfflineLessonContentBlock[];
  media_urls: string[];
  cached_at?: string;
};

const OFFLINE_LESSON_PREFIX = "nevo-offline-lesson-";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function fetchUrlAsDataUrl(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}

function replaceMediaUrls(value: unknown, mediaMap: Map<string, string>): unknown {
  if (typeof value === "string") {
    return mediaMap.get(value) || value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => replaceMediaUrls(entry, mediaMap));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        replaceMediaUrls(entry, mediaMap),
      ]),
    );
  }

  return value;
}

export function getOfflineLessonStorageKey(lessonId: string | number) {
  return `${OFFLINE_LESSON_PREFIX}${lessonId}`;
}

export function getStoredOfflineLessonPackage(
  lessonId: string | number,
): OfflineLessonPackage | null {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(getOfflineLessonStorageKey(lessonId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OfflineLessonPackage;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function listStoredOfflineLessonPackages(): OfflineLessonPackage[] {
  if (!canUseStorage()) return [];

  const packages: OfflineLessonPackage[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith(OFFLINE_LESSON_PREFIX)) continue;

    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as OfflineLessonPackage;
      if (parsed && typeof parsed === "object" && parsed.lesson_id) {
        packages.push(parsed);
      }
    } catch {
      // Ignore malformed local entries.
    }
  }

  return packages.sort((a, b) => {
    const left = new Date(a.cached_at || 0).getTime();
    const right = new Date(b.cached_at || 0).getTime();
    return right - left;
  });
}

export async function prepareOfflineLessonPackage(
  pkg: OfflineLessonPackage,
): Promise<OfflineLessonPackage> {
  const mediaUrls = Array.isArray(pkg.media_urls) ? pkg.media_urls : [];
  if (mediaUrls.length === 0) {
    return {
      ...pkg,
      cached_at: new Date().toISOString(),
    };
  }

  const mediaEntries = await Promise.all(
    mediaUrls.map(async (url) => [url, await fetchUrlAsDataUrl(url)] as const),
  );

  const mediaMap = new Map<string, string>(
    mediaEntries.filter((entry): entry is readonly [string, string] => Boolean(entry[1])),
  );

  return {
    ...pkg,
    content_blocks: replaceMediaUrls(pkg.content_blocks, mediaMap) as OfflineLessonContentBlock[],
    cached_at: new Date().toISOString(),
  };
}

export function saveOfflineLessonPackage(pkg: OfflineLessonPackage) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    getOfflineLessonStorageKey(pkg.lesson_id),
    JSON.stringify({
      ...pkg,
      cached_at: pkg.cached_at || new Date().toISOString(),
    }),
  );
}

export function removeOfflineLessonPackage(lessonId: string | number) {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(getOfflineLessonStorageKey(lessonId));
}
