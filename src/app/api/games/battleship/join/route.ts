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
        const { gameId, userId, userName, spaceId } = await req.json();

        const game = await BattleshipGame.findById(gameId);
        if (!game) {
            return corsResponse(NextResponse.json({ error: 'Game not found' }, { status: 404 }), req);
        }

        // If player 1 is joining or already in
        if (game.player1.id === userId) {
            return corsResponse(NextResponse.json(game), req);
        }

        // If player 2 already joined
        if (game.player2 && game.player2.id && game.player2.id !== userId) {
            return corsResponse(NextResponse.json({ error: 'Game is full' }, { status: 400 }), req);
        }

        game.player2 = {
            id: userId,
            name: userName,
            ready: false,
            ships: [],
        };

        await game.save();

        try {
            await pusherServer.trigger(spaceId || game.spaceId, 'battleship-join', {
                gameId: game._id,
                player2: game.player2,
            });
        } catch (pusherErr) {
            console.error('Pusher trigger failed:', pusherErr);
        }

        return corsResponse(NextResponse.json(game), req);
    } catch (e: any) {
        return corsResponse(NextResponse.json({ error: e.message }, { status: 500 }), req);
    }
}
