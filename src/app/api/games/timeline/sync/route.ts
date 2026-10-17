import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { TimelineGame } from '@/models/TimeLineGame';
import { pusherServer } from '@/lib/pusher';
import { corsResponse, handleOptions } from '@/lib/cors';
import { isValidOrder } from '@/lib/timeline';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: Request) {
    return handleOptions(request);
}

/** POST { gameId, newOrder: string[], userId? }: sorrend mentése és szétküldése a családnak. */
export async function POST(req: Request) {
    try {
        await connectDB();
        const { gameId, newOrder, userId } = await req.json();

        if (!gameId || !mongoose.isValidObjectId(gameId)) {
            return corsResponse(NextResponse.json({ error: 'Érvénytelen játékazonosító.' }, { status: 400 }), req);
        }
        const game = await TimelineGame.findById(gameId);
        if (!game) {
            return corsResponse(NextResponse.json({ error: 'A játék nem létezik.' }, { status: 404 }), req);
        }
        if (game.status === 'won') {
            return corsResponse(NextResponse.json({ error: 'A játék már megnyerve.' }, { status: 409 }), req);
        }
        if (!isValidOrder(newOrder, game.photos)) {
            return corsResponse(NextResponse.json({ error: 'Érvénytelen sorrend.' }, { status: 400 }), req);
        }

        game.order = newOrder;
        game.moves = (game.moves || 0) + 1;
        await game.save();

        try {
            await pusherServer.trigger(game.spaceId, 'timeline-move', {
                gameId: String(game._id), newOrder, by: userId || null
            });
        } catch (pusherErr) {
            console.warn('Timeline Pusher szinkron kihagyva:', pusherErr);
        }

        return corsResponse(NextResponse.json({ success: true }), req);
    } catch (e: any) {
        console.error('Timeline sync error:', e.message);
        return corsResponse(NextResponse.json({ error: 'A sorrend mentése nem sikerült.' }, { status: 500 }), req);
    }
}
