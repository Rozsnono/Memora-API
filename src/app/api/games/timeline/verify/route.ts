import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { TimelineGame } from '@/models/TimeLineGame';
import { pusherServer } from '@/lib/pusher';
import { corsResponse, handleOptions } from '@/lib/cors';
import { isValidOrder, isChronological, countCorrect, sanitizeTimeline } from '@/lib/timeline';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: Request) {
    return handleOptions(request);
}

/**
 * POST { gameId, order?, userName? }: szerveroldali ellenőrzés (a dátumok nem hagyják el a szervert
 * a győzelemig). Helyes sorrendnél a játék 'won' lesz, és a családnak 'timeline-won' esemény megy.
 */
export async function POST(req: Request) {
    try {
        await connectDB();
        const { gameId, order, userName } = await req.json();

        if (!gameId || !mongoose.isValidObjectId(gameId)) {
            return corsResponse(NextResponse.json({ error: 'Érvénytelen játékazonosító.' }, { status: 400 }), req);
        }
        const game = await TimelineGame.findById(gameId);
        if (!game) {
            return corsResponse(NextResponse.json({ error: 'A játék nem létezik.' }, { status: 404 }), req);
        }

        const candidate = order ?? game.order;
        if (!isValidOrder(candidate, game.photos)) {
            return corsResponse(NextResponse.json({ error: 'Érvénytelen sorrend.' }, { status: 400 }), req);
        }

        if (game.status !== 'won') {
            game.attempts = (game.attempts || 0) + 1;
        }
        const correct = isChronological(candidate, game.photos);
        const correctCount = countCorrect(candidate, game.photos);

        if (correct && game.status !== 'won') {
            game.order = candidate;
            game.status = 'won';
            game.wonBy = userName || 'Családtag';
        }
        await game.save();

        const view = sanitizeTimeline(game);
        if (correct) {
            try {
                await pusherServer.trigger(game.spaceId, 'timeline-won', { gameId: String(game._id), game: view });
            } catch (pusherErr) {
                console.warn('Timeline Pusher győzelem kihagyva:', pusherErr);
            }
        }

        return corsResponse(NextResponse.json({
            correct: game.status === 'won' && correct,
            correctCount,
            total: game.photos.length,
            game: correct ? view : undefined,
        }), req);
    } catch (e: any) {
        console.error('Timeline verify error:', e.message);
        return corsResponse(NextResponse.json({ error: 'Az ellenőrzés nem sikerült.' }, { status: 500 }), req);
    }
}
