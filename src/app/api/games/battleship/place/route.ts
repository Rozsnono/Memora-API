import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { BattleshipGame } from '@/models/BattleshipGame';
import { pusherServer } from '@/lib/pusher';
import { corsResponse, handleOptions } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: Request) {
    return handleOptions(request);
}

export async function PATCH(req: Request) {
    try {
        await connectDB();
        const { gameId, userId, ships, spaceId } = await req.json();

        const game = await BattleshipGame.findById(gameId);
        if (!game) {
            return corsResponse(NextResponse.json({ error: 'Game not found' }, { status: 404 }), req);
        }

        const isP1 = game.player1.id === userId;
        const isP2 = game.player2?.id === userId;

        if (!isP1 && !isP2) {
            return corsResponse(NextResponse.json({ error: 'Player not part of game' }, { status: 403 }), req);
        }

        if (isP1) {
            game.player1.ships = ships;
            game.player1.ready = true;
        } else if (isP2) {
            game.player2.ships = ships;
            game.player2.ready = true;
        }

        // If both ready (or in AI mode where AI is already ready)
        if (game.player1.ready && game.player2?.ready) {
            game.status = 'playing';
            game.turn = game.player1.id; // Player 1 starts
        }

        await game.save();

        try {
            await pusherServer.trigger(spaceId || game.spaceId, 'battleship-ready', {
                gameId: game._id,
                userId,
                status: game.status,
                player1Ready: game.player1.ready,
                player2Ready: game.player2?.ready,
            });
        } catch (pusherErr) {
            console.error('Pusher trigger failed:', pusherErr);
        }

        return corsResponse(NextResponse.json(game), req);
    } catch (e: any) {
        return corsResponse(NextResponse.json({ error: e.message }, { status: 500 }), req);
    }
}
