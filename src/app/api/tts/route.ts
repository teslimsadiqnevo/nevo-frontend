import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/features/Auth/api/auth';

type TtsRequestBody = {
    text?: string;
};

type SessionWithToken = {
    user?: {
        apiToken?: string;
    };
};

async function authHeader() {
    const session = (await auth()) as SessionWithToken | null;
    const tokenFromSession = session?.user?.apiToken;
    if (typeof tokenFromSession === 'string' && tokenFromSession.length > 0) {
        return { Authorization: `Bearer ${tokenFromSession}` };
    }

    const cookieStore = await cookies();
    const tokenFromCookie = cookieStore.get('access_token')?.value;
    if (tokenFromCookie) {
        return { Authorization: `Bearer ${tokenFromCookie}` };
    }

    return null;
}

export async function POST(req: Request) {
    try {
        const headers = await authHeader();
        if (!headers) {
            return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
        }

        const apiKey = process.env.YARNGPT_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { detail: 'Audio narration is not configured yet.' },
                { status: 503 },
            );
        }

        const body = (await req.json().catch(() => ({}))) as TtsRequestBody;
        const text = typeof body.text === 'string' ? body.text.trim() : '';
        if (!text) {
            return NextResponse.json({ detail: 'Text is required.' }, { status: 400 });
        }

        const clippedText = text.slice(0, 2000);
        const upstream = await fetch('https://yarngpt.ai/api/v1/tts', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: clippedText,
                voice: 'Idera',
                response_format: 'mp3',
            }),
            cache: 'no-store',
        });

        if (!upstream.ok) {
            const contentType = upstream.headers.get('content-type') || '';
            const errorPayload = contentType.includes('application/json')
                ? await upstream.json().catch(() => null)
                : await upstream.text().catch(() => '');

            const detail =
                typeof errorPayload === 'object' &&
                errorPayload !== null &&
                'detail' in errorPayload &&
                typeof errorPayload.detail === 'string'
                    ? errorPayload.detail
                    : typeof errorPayload === 'string' && errorPayload
                        ? errorPayload
                        : 'Could not generate audio.';

            return NextResponse.json({ detail }, { status: upstream.status });
        }

        return new Response(upstream.body, {
            status: 200,
            headers: {
                'Content-Type': upstream.headers.get('content-type') || 'audio/mpeg',
                'Cache-Control': 'private, max-age=3600',
            },
        });
    } catch {
        return NextResponse.json(
            { detail: 'Could not generate audio.' },
            { status: 500 },
        );
    }
}
