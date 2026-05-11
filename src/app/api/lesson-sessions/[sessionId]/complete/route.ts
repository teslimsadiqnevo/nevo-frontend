import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/features/Auth/api/auth';
import { API_BASE_URL } from '@/shared/lib/api';

type AuthSession = {
    user?: {
        apiToken?: string;
    };
};

async function authHeader() {
    const session = (await auth()) as AuthSession | null;
    const tokenFromSession = session?.user?.apiToken;
    if (tokenFromSession) {
        return { Authorization: `Bearer ${tokenFromSession}` };
    }

    const cookieStore = await cookies();
    const tokenFromCookie = cookieStore.get('access_token')?.value;
    if (tokenFromCookie) {
        return { Authorization: `Bearer ${tokenFromCookie}` };
    }

    return null;
}

export async function POST(
    req: Request,
    context: { params: Promise<{ sessionId: string }> },
) {
    try {
        const headers = await authHeader();
        if (!headers) {
            return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
        }

        const { sessionId } = await context.params;
        const body = await req.json().catch(() => ({}));
        const backendRes = await fetch(
            `${API_BASE_URL}/sessions/${encodeURIComponent(sessionId)}/complete`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
                body: JSON.stringify(body),
            },
        );

        const data = await backendRes.json().catch(() => ({}));
        return NextResponse.json(data, { status: backendRes.status });
    } catch {
        return NextResponse.json(
            { detail: 'Could not complete lesson session.' },
            { status: 500 },
        );
    }
}
