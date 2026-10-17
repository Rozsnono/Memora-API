import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectDB from '@/lib/mongodb';
import { BattleshipGame } from '@/models/BattleshipGame';
import { pusherServer } from '@/lib/pusher';
import { corsResponse, handleOptions } from '@/lib/cors';
import { sanitizeGame, resolveConfig, generateRandomFleet } from '@/lib/battleship';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: Request) {
    return handleOptions(request);
}

// GET: List active/waiting games
export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const spaceId = searchParams.get('spaceId');
        const gameId = searchParams.get('gameId');
        const viewerId = searchParams.get('userId');

        if (gameId) {
            const game = await BattleshipGame.findById(gameId);
            if (!game) {
                return corsResponse(NextResponse.json({ error: 'Game not found' }, { status: 404 }), req);
            }
            return corsResponse(NextResponse.json(sanitizeGame(game, viewerId)), req);
        }

        const games = await BattleshipGame.find({
            spaceId,
            status: { $in: ['setup', 'playing'] },
        }).sort({ updatedAt: -1 });

        return corsResponse(NextResponse.json(games.map((g: any) => sanitizeGame(g, viewerId))), req);
    } catch (e: any) {
        return corsResponse(NextResponse.json({ error: e.message }, { status: 500 }), req);
    }
}

// POST: Create a new game (AI or Multiplayer)
export async function POST(req: Request) {
    headers();
    try {
        await connectDB();
        const { spaceId, userId, userName, isAiMode, difficulty, boardSize, shipIds } = await req.json();

        const config = resolveConfig({ difficulty, boardSize, shipIds });
        if ('error' in config) {
            return corsResponse(NextResponse.json({ error: config.error }, { status: 400 }), req);
        }

        let player2 = null;
        if (isAiMode) {
            player2 = {
                id: 'ai-bot',
                name: 'A Széf Szelleme',
                ready: true,
                ships: generateRandomFleet(config.boardSize, config.fleet),
            };
        }

        const game = await BattleshipGame.create({
            spaceId,
            creatorName: userName,
            isAiMode: !!isAiMode,
            player1: {
                id: userId,
                name: userName,
                ready: false,
                ships: [],
            },
            player2,
            boardSize: config.boardSize,
            difficulty: config.difficulty,
            fleet: config.fleet,
            player1Shots: [],
            player2Shots: [],
            status: 'setup',
            turn: userId,
        });

        if (!isAiMode) {
            try {
                await pusherServer.trigger(spaceId, 'new-game', {
                    type: 'battleship',
                    gameId: game._id,
                    hostName: userName,
                });
            } catch (pusherErr) {
                console.error('Pusher trigger failed:', pusherErr);
            }
        }

        return corsResponse(NextResponse.json(sanitizeGame(game, userId)), req);
    } catch (e: any) {
        return corsResponse(NextResponse.json({ error: e.message }, { status: 500 }), req);
    }
}
