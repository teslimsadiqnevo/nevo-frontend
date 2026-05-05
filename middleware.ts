import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

function decodeBase64Url(value: string): string | null {
    try {
        const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
        return atob(padded);
    } catch {
        return null;
    }
}

function getApiTokenExpiryMs(apiToken?: string | null): number | null {
    if (!apiToken) return null;
    const [, payload = ''] = apiToken.split('.');
    const decoded = decodeBase64Url(payload);
    if (!decoded) return null;

    try {
        const parsed = JSON.parse(decoded) as { exp?: unknown };
        return typeof parsed.exp === 'number' && Number.isFinite(parsed.exp) ? parsed.exp * 1000 : null;
    } catch {
        return null;
    }
}

function getLoginPath(role?: string | null): string {
    const normalized = role?.toLowerCase();
    if (normalized === 'teacher') return '/login/teacher';
    if (normalized === 'school_admin' || normalized === 'school') return '/login/school';
    return '/login/student';
}

export async function middleware(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.AUTH_SECRET || 'fallback-secret-for-development-only-123',
    });

    const apiToken =
        token && typeof token === 'object' && 'apiToken' in token
            ? String((token as { apiToken?: unknown }).apiToken || '')
            : '';

    const expiryMs = getApiTokenExpiryMs(apiToken);
    if (expiryMs && expiryMs <= Date.now()) {
        const loginUrl = new URL(getLoginPath(typeof token?.role === 'string' ? token.role : null), request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard', '/lesson/:path*'],
};
