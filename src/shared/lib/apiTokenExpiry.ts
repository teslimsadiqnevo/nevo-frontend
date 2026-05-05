export function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const [, payload = ''] = token.split('.');
        if (!payload) return null;

        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');

        const decoded =
            typeof atob === 'function'
                ? atob(padded)
                : Buffer.from(padded, 'base64').toString('utf-8');

        return JSON.parse(decoded) as Record<string, unknown>;
    } catch {
        return null;
    }
}

export function getApiTokenExpiryMs(apiToken?: string | null): number | null {
    if (!apiToken) return null;
    const payload = decodeJwtPayload(apiToken);
    const exp = payload?.exp;
    if (typeof exp !== 'number' || !Number.isFinite(exp)) return null;
    return exp * 1000;
}

export function isApiTokenExpired(apiToken?: string | null, nowMs = Date.now()): boolean {
    const expiryMs = getApiTokenExpiryMs(apiToken);
    if (!expiryMs) return false;
    return expiryMs <= nowMs;
}
