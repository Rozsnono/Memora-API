import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { corsResponse, handleOptions } from '@/lib/cors';
import { TimelineGame } from '@/models/TimeLineGame';
import { sanitizeTimeline } from '@/lib/timeline';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: Request) {
    return handleOptions(request);
}

/** GET: a széf folyamatban lévő idővonal játékai. */
export async function GET(req: Request) {
    try {
        await connectDB();
        const spaceId = new URL(req.url).searchParams.get('spaceId');
        if (!spaceId) {
            return corsResponse(NextResponse.json({ error: 'Hiányzó spaceId.' }, { status: 400 }), req);
        }
        const active = await TimelineGame.find({ spaceId, status: 'playing' }).sort({ createdAt: -1 }).limit(20);
        return corsResponse(NextResponse.json(active.map(sanitizeTimeline)), req);
    } catch (e: any) {
        console.error('Timeline active error:', e.message);
        return corsResponse(NextResponse.json({ error: 'Nem sikerült lekérni az aktív játékokat.' }, { status: 500 }), req);
    }
}
