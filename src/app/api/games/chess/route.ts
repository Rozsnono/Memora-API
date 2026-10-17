import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectDB from '@/lib/mongodb';
import { ChessGame } from '@/models/ChessGame';
import { pusherServer } from '@/lib/pusher';
import { corsResponse, handleOptions } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: Request) { return handleOptions(request); }

// GET: List active games for the Lounge
export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const spaceId = searchParams.get('spaceId');
        const gameId = searchParams.get('gameId');

        // Egy parti lekérdezése (polling / újratöltés)
        if (gameId) {
            const one = await ChessGame.findById(gameId);
            if (!one) return corsResponse(NextResponse.json({ error: 'A parti nem található.' }, { status: 404 }), req);
            return corsResponse(NextResponse.json(one), req);
        }
        if (!spaceId) {
            return corsResponse(NextResponse.json({ error: 'Hiányzó spaceId.' }, { status: 400 }), req);
        }

        const games = await ChessGame.find({
            spaceId,
            status: { $in: ['waiting', 'playing'] }
        }).sort({ updatedAt: -1 });

        return corsResponse(NextResponse.json(games), req);
    } catch (e: any) {
        console.error('Chess route hiba:', e);
        return corsResponse(NextResponse.json({ error: 'Szerverhiba.' }, { status: 500 }), req);
    }
}

// POST: Create a new game
export async function POST(req: Request) {
    headers();
    try {
        await connectDB();
        const { spaceId, userId, userName, side } = await req.json();
        if (!spaceId || !userId || !userName || (side !== 'white' && side !== 'black')) {
            return corsResponse(NextResponse.json({ error: 'Hiányzó vagy hibás adatok (spaceId, userId, userName, side).' }, { status: 400 }), req);
        }

        const gameData: any = {
            spaceId,
            status: 'waiting',
            whitePlayer: side === 'white' ? { id: userId, name: userName } : { id: null, name: null },
            blackPlayer: side === 'black' ? { id: userId, name: userName } : { id: null, name: null },
            creatorName: userName
        };

        const game = await ChessGame.create(gameData);

        // Broadcast to Lounge so others see the "Live Table"
        try {
            await pusherServer.trigger(spaceId, 'new-game', {
                type: 'chess',
                gameId: game._id,
                hostName: userName
            });
        } catch (pushErr) {
            console.error('Chess pusher hiba:', pushErr);
        }

        return corsResponse(NextResponse.json(game), req);
    } catch (e: any) {
        console.error('Chess route hiba:', e);
        return corsResponse(NextResponse.json({ error: 'Szerverhiba.' }, { status: 500 }), req);
    }
}