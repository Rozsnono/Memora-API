import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { BattleshipGame } from '@/models/BattleshipGame';
import { pusherServer } from '@/lib/pusher';
import { sanitizeGame } from '@/lib/battleship';
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
            return corsResponse(NextResponse.json(sanitizeGame(game, userId)), req);
        }

        // Már csatlakozott (újranyitás): állapot megtartása, nincs felülírás
        if (game.player2?.id === userId) {
            return corsResponse(NextResponse.json(sanitizeGame(game, userId)), req);
        }

        // Másik játékos már foglalja a helyet (vagy AI játék)
        if (game.player2 && game.player2.id) {
            return corsResponse(NextResponse.json({ error: 'Game is full' }, { status: 400 }), req);
        }

        if (game.status !== 'setup') {
            return corsResponse(NextResponse.json({ error: 'Game already started' }, { status: 400 }), req);
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
                player2: { id: game.player2.id, name: game.player2.name, ready: false, ships: [] },
            });
        } catch (pusherErr) {
            console.error('Pusher trigger failed:', pusherErr);
        }

        return corsResponse(NextResponse.json(sanitizeGame(game, userId)), req);
    } catch (e: any) {
        return corsResponse(NextResponse.json({ error: e.message }, { status: 500 }), req);
    }
}
