import { NextResponse } from 'next/server';

type TtsRequestBody = {
    text?: string;
};

export async function POST(req: Request) {
    try {
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
