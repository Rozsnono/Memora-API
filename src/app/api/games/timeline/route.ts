import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Memory } from '@/models/Memory';
import { TimelineGame } from '@/models/TimeLineGame';
import { pusherServer } from '@/lib/pusher';
import { corsResponse, handleOptions } from '@/lib/cors';
import { shuffleUnsolved, sanitizeTimeline, TIMELINE_MIN_PHOTOS, TIMELINE_ROUND_SIZE } from '@/lib/timeline';

export const dynamic = 'force-dynamic';

export async function OPTIONS(req: Request) { return handleOptions(req); }

/** POST: új idővonal játék – véletlen emlékek a széfből (min. 3, max. 5). */
export async function POST(req: Request) {
    try {
        await connectDB();
        const { spaceId, userId, userName } = await req.json();

        if (!spaceId || !userId) {
            return corsResponse(NextResponse.json({ error: 'Hiányzó széf vagy felhasználó azonosító.' }, { status: 400 }), req);
        }

        const memories = await Memory.aggregate([
            { $match: { spaceId, 'media.0': { $exists: true }, capturedAt: { $exists: true } } },
            { $sample: { size: TIMELINE_ROUND_SIZE } }
        ]);

        if (memories.length < TIMELINE_MIN_PHOTOS) {
            return corsResponse(NextResponse.json({
                error: `Legalább ${TIMELINE_MIN_PHOTOS} fotós emlék szükséges a széfben ehhez a játékhoz.`
            }, { status: 400 }), req);
        }

        const photos = memories.map((m: any) => ({
            id: String(m._id), url: m.media[0].url, date: m.capturedAt, title: m.title
        }));
        const shuffled = shuffleUnsolved(photos);

        const game = await TimelineGame.create({
            spaceId,
            hostId: userId,
            creatorId: userId,
            creatorName: userName || 'Családtag',
            photos,
            order: shuffled.map(p => p.id),
        });

        try {
            await pusherServer.trigger(spaceId, 'new-game', {
                type: 'timeline',
                gameId: String(game._id),
                hostName: game.creatorName
            });
        } catch (pusherErr) {
            console.warn('Timeline Pusher értesítés kihagyva:', pusherErr);
        }

        return corsResponse(NextResponse.json(sanitizeTimeline(game)), req);
    } catch (e: any) {
        console.error('Timeline create error:', e.message);
        return corsResponse(NextResponse.json({ error: 'Nem sikerült elindítani az idővonal játékot.' }, { status: 500 }), req);
    }
}
