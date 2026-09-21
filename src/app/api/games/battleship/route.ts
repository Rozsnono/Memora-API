import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectDB from '@/lib/mongodb';
import { BattleshipGame } from '@/models/BattleshipGame';
import { pusherServer } from '@/lib/pusher';
import { corsResponse, handleOptions } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: Request) {
    return handleOptions(request);
}

// Generate valid non-overlapping random ship placements on an 8x8 grid
export function generateRandomFleet() {
    const fleetDefs = [
        { id: 'cruise', type: 'cruise', name: 'Grand Voyage', size: 4 },
        { id: 'sailboat', type: 'sailboat', name: 'Sunset Sailboat', size: 3 },
        { id: 'catamaran', type: 'catamaran', name: 'Adventure Catamaran', size: 2 },
        { id: 'island', type: 'island', name: 'Beacon Island', size: 1 },
    ];

    const occupied = new Set<string>();
    const ships: any[] = [];

    for (const def of fleetDefs) {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 200) {
            attempts++;
            const horizontal = Math.random() > 0.5;
            const maxR = horizontal ? 8 : 8 - def.size + 1;
            const maxC = horizontal ? 8 - def.size + 1 : 8;
            const startR = Math.floor(Math.random() * maxR);
            const startC = Math.floor(Math.random() * maxC);

            const positions: { r: number; c: number }[] = [];
            let canPlace = true;

            for (let i = 0; i < def.size; i++) {
                const r = horizontal ? startR : startR + i;
                const c = horizontal ? startC + i : startC;
                // Leave 1 cell buffer or just no direct overlap
                if (occupied.has(`${r},${c}`)) {
                    canPlace = false;
                    break;
                }
                positions.push({ r, c });
            }

            if (canPlace) {
                positions.forEach(p => occupied.add(`${p.r},${p.c}`));
                ships.push({
                    id: def.id,
                    type: def.type,
                    name: def.name,
                    size: def.size,
                    positions,
                    hits: 0,
                    sunk: false,
                });
                placed = true;
            }
        }
    }

    return ships;
}

// GET: List active/waiting games
export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const spaceId = searchParams.get('spaceId');
        const gameId = searchParams.get('gameId');

        if (gameId) {
            const game = await BattleshipGame.findById(gameId);
            if (!game) {
                return corsResponse(NextResponse.json({ error: 'Game not found' }, { status: 404 }), req);
            }
            return corsResponse(NextResponse.json(game), req);
        }

        const games = await BattleshipGame.find({
            spaceId,
            status: { $in: ['setup', 'playing'] },
        }).sort({ updatedAt: -1 });

        return corsResponse(NextResponse.json(games), req);
    } catch (e: any) {
        return corsResponse(NextResponse.json({ error: e.message }, { status: 500 }), req);
    }
}

// POST: Create a new game (AI or Multiplayer)
export async function POST(req: Request) {
    headers();
    try {
        await connectDB();
        const { spaceId, userId, userName, isAiMode } = await req.json();

        let player2 = null;
        if (isAiMode) {
            player2 = {
                id: 'ai-bot',
                name: 'A Széf Szelleme',
                ready: true,
                ships: generateRandomFleet(),
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
            boardSize: 8,
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

        return corsResponse(NextResponse.json(game), req);
    } catch (e: any) {
        return corsResponse(NextResponse.json({ error: e.message }, { status: 500 }), req);
    }
}
