import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/features/Auth/api/auth';
import { API_BASE_URL } from '@/shared/lib/api';

async function authHeader() {
    const session = await auth();
    const tokenFromSession = (session?.user as { apiToken?: string } | undefined)
        ?.apiToken;
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

export async function POST(request: Request) {
    try {
        const headers = await authHeader();
        if (!headers) {
            return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const backendRes = await fetch(`${API_BASE_URL}/content/reorientation`, {
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await backendRes.json().catch(() => ({}));
        return NextResponse.json(data, { status: backendRes.status });
    } catch {
        return NextResponse.json(
            { detail: 'Could not load reorientation options.' },
            { status: 500 },
        );
    }
}
