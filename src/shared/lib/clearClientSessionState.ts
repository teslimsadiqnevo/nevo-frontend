'use client';

import { useRegistrationStore } from '@/shared/store/useRegistrationStore';

const LEGACY_LOCAL_STORAGE_KEYS = ['access_token', 'refresh_token', 'user'];
const PWA_CACHE_PREFIX = 'nevo-pwa-';

export async function clearClientSessionState() {
    try {
        useRegistrationStore.getState().clearRegistration();
    } catch {
        // Ignore store reset failures outside the browser.
    }

    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.sessionStorage.removeItem('nevo_registration_data');
    } catch {
        // Ignore session storage failures.
    }

    try {
        for (const key of LEGACY_LOCAL_STORAGE_KEYS) {
            window.localStorage.removeItem(key);
        }
    } catch {
        // Ignore local storage failures.
    }

    try {
        if (typeof window.caches !== 'undefined') {
            const cacheKeys = await window.caches.keys();
            await Promise.all(
                cacheKeys
                    .filter((key) => key.startsWith(PWA_CACHE_PREFIX))
                    .map((key) => window.caches.delete(key)),
            );
        }
    } catch {
        // Ignore cache cleanup failures.
    }
}
