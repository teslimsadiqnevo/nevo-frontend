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

type OfflineLessonPackageMetadata = Pick<
  OfflineLessonPackage,
  | "lesson_id"
  | "original_lesson_id"
  | "title"
  | "subject"
  | "topic"
  | "version_hash"
  | "estimated_size_bytes"
  | "cached_at"
> & {
  storage_backend?: "indexeddb" | "localstorage";
};

const OFFLINE_LESSON_PREFIX = "nevo-offline-lesson-";
const OFFLINE_LESSON_DB_NAME = "nevo-offline-lessons";
const OFFLINE_LESSON_STORE_NAME = "lesson_packages";

function canUseWindow() {
  return typeof window !== "undefined";
}

function canUseStorage() {
  return canUseWindow() && typeof window.localStorage !== "undefined";
}

function canUseIndexedDb() {
  return canUseWindow() && typeof window.indexedDB !== "undefined";
}

function isQuotaError(error: unknown) {
  if (
    typeof DOMException !== "undefined" &&
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  ) {
    return true;
  }

  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return /quota|storage.*full|not enough space|quotaexceeded/i.test(message);
}

function isStorageBlockedError(error: unknown) {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return /indexeddb unavailable|offline storage unavailable|access.*denied|security/i.test(message);
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

function createMetadata(pkg: OfflineLessonPackage): OfflineLessonPackageMetadata {
  return {
    lesson_id: String(pkg.lesson_id),
    original_lesson_id: pkg.original_lesson_id ?? null,
    title: pkg.title || "Lesson",
    subject: pkg.subject || null,
    topic: pkg.topic || null,
    version_hash: pkg.version_hash,
    estimated_size_bytes: Number(pkg.estimated_size_bytes || 0),
    cached_at: pkg.cached_at || new Date().toISOString(),
  };
}

function stripEmbeddedMedia(pkg: OfflineLessonPackage): OfflineLessonPackage {
  return {
    ...pkg,
    content_blocks: pkg.content_blocks,
    media_urls: Array.isArray(pkg.media_urls) ? pkg.media_urls : [],
  };
}

function getLegacyPackageFromStorage(lessonId: string | number): OfflineLessonPackage | null {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(getOfflineLessonStorageKey(lessonId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OfflineLessonPackage>;
    if (!parsed || typeof parsed !== "object" || !parsed.lesson_id) return null;
    if (!Array.isArray(parsed.content_blocks)) return null;

    return {
      lesson_id: String(parsed.lesson_id),
      original_lesson_id: parsed.original_lesson_id ?? null,
      title: parsed.title || "Lesson",
      subject: parsed.subject || null,
      topic: parsed.topic || null,
      version_hash: parsed.version_hash || "",
      estimated_size_bytes: Number(parsed.estimated_size_bytes || 0),
      content_blocks: parsed.content_blocks as OfflineLessonContentBlock[],
      media_urls: Array.isArray(parsed.media_urls) ? parsed.media_urls : [],
      cached_at: parsed.cached_at,
    };
  } catch {
    return null;
  }
}

function getLegacyMetadataFromStorage(): OfflineLessonPackageMetadata[] {
  if (!canUseStorage()) return [];

  const packages: OfflineLessonPackageMetadata[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith(OFFLINE_LESSON_PREFIX)) continue;

    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as Partial<OfflineLessonPackageMetadata & OfflineLessonPackage>;
      if (parsed && typeof parsed === "object" && parsed.lesson_id) {
        packages.push({
          lesson_id: String(parsed.lesson_id),
          original_lesson_id: parsed.original_lesson_id ?? null,
          title: parsed.title || "Lesson",
          subject: parsed.subject || null,
          topic: parsed.topic || null,
          version_hash: parsed.version_hash || "",
          estimated_size_bytes: Number(parsed.estimated_size_bytes || 0),
          cached_at: parsed.cached_at,
          storage_backend: Array.isArray((parsed as any).content_blocks)
            ? "localstorage"
            : parsed.storage_backend || "localstorage",
        });
      }
    } catch {
      // Ignore malformed local entries.
    }
  }

  return packages;
}

function saveMetadataToStorage(metadata: OfflineLessonPackageMetadata) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(
      getOfflineLessonStorageKey(metadata.lesson_id),
      JSON.stringify({
        ...metadata,
        storage_backend: metadata.storage_backend || "indexeddb",
      }),
    );
  } catch {
    // Ignore metadata cache failures.
  }
}

function removeMetadataFromStorage(lessonId: string | number) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.removeItem(getOfflineLessonStorageKey(lessonId));
  } catch {
    // Ignore removal failures.
  }
}

function openOfflineLessonDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!canUseIndexedDb()) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }

    const request = window.indexedDB.open(OFFLINE_LESSON_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OFFLINE_LESSON_STORE_NAME)) {
        db.createObjectStore(OFFLINE_LESSON_STORE_NAME, { keyPath: "lesson_id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Failed to open offline lesson database"));
  });
}

async function readPackageFromIndexedDb(lessonId: string | number) {
  const db = await openOfflineLessonDb();

  return new Promise<OfflineLessonPackage | null>((resolve, reject) => {
    const transaction = db.transaction(OFFLINE_LESSON_STORE_NAME, "readonly");
    const store = transaction.objectStore(OFFLINE_LESSON_STORE_NAME);
    const request = store.get(String(lessonId));

    request.onsuccess = () => {
      resolve((request.result as OfflineLessonPackage | undefined) ?? null);
    };
    request.onerror = () => reject(request.error || new Error("Failed to read offline lesson"));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("Offline lesson read transaction failed"));
    };
  });
}

async function listPackagesFromIndexedDb() {
  const db = await openOfflineLessonDb();

  return new Promise<OfflineLessonPackage[]>((resolve, reject) => {
    const transaction = db.transaction(OFFLINE_LESSON_STORE_NAME, "readonly");
    const store = transaction.objectStore(OFFLINE_LESSON_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve((request.result as OfflineLessonPackage[] | undefined) ?? []);
    };
    request.onerror = () => reject(request.error || new Error("Failed to list offline lessons"));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("Offline lesson list transaction failed"));
    };
  });
}

async function writePackageToIndexedDb(pkg: OfflineLessonPackage) {
  const db = await openOfflineLessonDb();

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(OFFLINE_LESSON_STORE_NAME, "readwrite");
    const store = transaction.objectStore(OFFLINE_LESSON_STORE_NAME);
    store.put(pkg);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("Failed to save offline lesson"));
    };
  });
}

async function deletePackageFromIndexedDb(lessonId: string | number) {
  const db = await openOfflineLessonDb();

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(OFFLINE_LESSON_STORE_NAME, "readwrite");
    const store = transaction.objectStore(OFFLINE_LESSON_STORE_NAME);
    store.delete(String(lessonId));

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("Failed to remove offline lesson"));
    };
  });
}

async function saveLegacyPackageToStorage(pkg: OfflineLessonPackage) {
  if (!canUseStorage()) {
    throw new Error("Offline storage unavailable on this device");
  }

  window.localStorage.setItem(
    getOfflineLessonStorageKey(pkg.lesson_id),
    JSON.stringify({
      ...pkg,
      cached_at: pkg.cached_at || new Date().toISOString(),
      storage_backend: "localstorage",
    }),
  );
}

export function getOfflineLessonStorageKey(lessonId: string | number) {
  return `${OFFLINE_LESSON_PREFIX}${lessonId}`;
}

export async function getStoredOfflineLessonPackage(
  lessonId: string | number,
): Promise<OfflineLessonPackage | null> {
  try {
    if (canUseIndexedDb()) {
      const indexedPackage = await readPackageFromIndexedDb(lessonId);
      if (indexedPackage) {
        return indexedPackage;
      }
    }
  } catch {
    // Fall through to legacy storage.
  }

  return getLegacyPackageFromStorage(lessonId);
}

export async function listStoredOfflineLessonPackages(): Promise<OfflineLessonPackage[]> {
  try {
    if (canUseIndexedDb()) {
      const packages = await listPackagesFromIndexedDb();
      if (packages.length > 0) {
        return packages.sort((a, b) => {
          const left = new Date(a.cached_at || 0).getTime();
          const right = new Date(b.cached_at || 0).getTime();
          return right - left;
        });
      }
    }
  } catch {
    // Fall through to legacy storage.
  }

  return getLegacyMetadataFromStorage()
    .map((metadata) => getLegacyPackageFromStorage(metadata.lesson_id))
    .filter((pkg): pkg is OfflineLessonPackage => Boolean(pkg))
    .sort((a, b) => {
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

export async function saveOfflineLessonPackage(pkg: OfflineLessonPackage) {
  const nextPackage = {
    ...pkg,
    cached_at: pkg.cached_at || new Date().toISOString(),
  };

  if (canUseIndexedDb()) {
    try {
      await writePackageToIndexedDb(nextPackage);
      saveMetadataToStorage({
        ...createMetadata(nextPackage),
        storage_backend: "indexeddb",
      });
      return;
    } catch {
      // Fall back to localStorage below.
    }
  }

  try {
    await saveLegacyPackageToStorage(nextPackage);
  } catch (error) {
    try {
      const compactPackage = stripEmbeddedMedia(nextPackage);
      await saveLegacyPackageToStorage(compactPackage);
    } catch (fallbackError) {
      if (isQuotaError(fallbackError) || isQuotaError(error)) {
        throw new Error("Your device does not have enough storage space to save this lesson offline.");
      }

      if (isStorageBlockedError(fallbackError) || isStorageBlockedError(error)) {
        throw new Error(
          "Offline downloads are not available in this browser mode. Turn off private browsing or allow device storage and try again.",
        );
      }

      throw new Error("This device could not save the lesson for offline use.");
    }
  }
}

export async function removeOfflineLessonPackage(lessonId: string | number) {
  let indexedDbError: unknown = null;

  if (canUseIndexedDb()) {
    try {
      await deletePackageFromIndexedDb(lessonId);
    } catch (error) {
      indexedDbError = error;
    }
  }

  removeMetadataFromStorage(lessonId);

  try {
    if (canUseStorage()) {
      window.localStorage.removeItem(getOfflineLessonStorageKey(lessonId));
    }
  } catch {
    // Ignore legacy storage removal failures.
  }

  if (indexedDbError && !canUseStorage()) {
    throw indexedDbError;
  }
}
