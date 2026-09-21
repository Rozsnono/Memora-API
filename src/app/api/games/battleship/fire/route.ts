import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { BattleshipGame } from '@/models/BattleshipGame';
import { Memory } from '@/models/Memory';
import { pusherServer } from '@/lib/pusher';
import { corsResponse, handleOptions } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: Request) {
    return handleOptions(request);
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const { gameId, userId, r, c, spaceId } = await req.json();

        const game = await BattleshipGame.findById(gameId);
        if (!game) {
            return corsResponse(NextResponse.json({ error: 'Game not found' }, { status: 404 }), req);
        }

        if (game.status !== 'playing') {
            return corsResponse(NextResponse.json({ error: 'Game is not in playing state' }, { status: 400 }), req);
        }

        if (game.turn !== userId) {
            return corsResponse(NextResponse.json({ error: 'Not your turn' }, { status: 403 }), req);
        }

        const isP1 = game.player1.id === userId;
        const myShots = isP1 ? game.player1Shots : game.player2Shots;
        const enemyShips = isP1 ? game.player2.ships : game.player1.ships;
        const nextTurnUser = isP1 ? game.player2.id : game.player1.id;

        // Check if coordinate was already shot
        const alreadyFired = myShots.some((s: any) => s.r === r && s.c === c);
        if (alreadyFired) {
            return corsResponse(NextResponse.json({ error: 'Coordinate already targeted' }, { status: 400 }), req);
        }

        // Check hit
        let hitShip: any = null;
        for (const ship of enemyShips) {
            const hitPos = ship.positions.find((p: any) => p.r === r && p.c === c);
            if (hitPos) {
                hitShip = ship;
                break;
            }
        }

        let shotResult: 'hit' | 'miss' | 'sunk' = 'miss';
        let newlyUnlockedMemory: any = null;

        if (hitShip) {
            hitShip.hits = (hitShip.hits || 0) + 1;
            if (hitShip.hits >= hitShip.size) {
                hitShip.sunk = true;
                shotResult = 'sunk';

                // Fetch a random memory from this space to unlock as reward!
                try {
                    const sampleMem = await Memory.aggregate([
                        { $match: { spaceId: game.spaceId, 'media.0': { $exists: true } } },
                        { $sample: { size: 1 } },
                    ]);
                    if (sampleMem && sampleMem.length > 0) {
                        newlyUnlockedMemory = sampleMem[0];
                        game.unlockedMemories.push({
                            shipName: hitShip.name,
                            shipType: hitShip.type,
                            memory: newlyUnlockedMemory,
                            unlockedAt: new Date(),
                            unlockedBy: userId,
                        });
                    }
                } catch (memErr) {
                    console.error('Failed fetching memory reward:', memErr);
                }
            } else {
                shotResult = 'hit';
            }
        } else {
            shotResult = 'miss';
        }

        myShots.push({
            r,
            c,
            result: shotResult,
            shipId: hitShip ? hitShip.id : null,
        });

        // Check if all enemy ships are sunk
        const allEnemySunk = enemyShips.every((s: any) => s.sunk);
        if (allEnemySunk) {
            game.status = 'won';
            game.winner = userId;
        } else {
            // If miss, switch turn. If hit/sunk, shooter continues!
            if (shotResult === 'miss') {
                game.turn = nextTurnUser;
            }
        }

        // AI counter-attack if in AI mode and it's AI's turn
        if (game.isAiMode && game.status === 'playing' && game.turn === 'ai-bot') {
            executeAiTurns(game);
        }

        game.markModified('player1');
        game.markModified('player2');
        game.markModified('player1Shots');
        game.markModified('player2Shots');
        game.markModified('unlockedMemories');

        await game.save();

        try {
            await pusherServer.trigger(spaceId || game.spaceId, 'battleship-shot', {
                gameId: game._id,
                shooterId: userId,
                r,
                c,
                result: shotResult,
                sunkShip: shotResult === 'sunk' ? hitShip : null,
                turn: game.turn,
                status: game.status,
                winner: game.winner,
            });
        } catch (pusherErr) {
            console.error('Pusher trigger failed:', pusherErr);
        }

        return corsResponse(NextResponse.json({
            game,
            shot: { r, c, result: shotResult, ship: hitShip },
            unlockedMemory: newlyUnlockedMemory,
        }), req);
    } catch (e: any) {
        return corsResponse(NextResponse.json({ error: e.message }, { status: 500 }), req);
    }
}

// Smart AI counter-attack loop
function executeAiTurns(game: any) {
    let aiContinuing = true;
    let guardCounter = 0;

    while (aiContinuing && guardCounter < 10) {
        guardCounter++;
        const targetShips = game.player1.ships;
        const aiShots = game.player2Shots;

        // Smart target search: find an unsunk hit
        const unsunkHits: { r: number; c: number }[] = [];
        for (const shot of aiShots) {
            if (shot.result === 'hit') {
                const ship = targetShips.find((s: any) => s.id === shot.shipId);
                if (ship && !ship.sunk) {
                    unsunkHits.push({ r: shot.r, c: shot.c });
                }
            }
        }

        let chosenR = -1;
        let chosenC = -1;

        if (unsunkHits.length > 0) {
            // Probe neighbors of unsunk hit
            const directions = [
                { dr: -1, dc: 0 },
                { dr: 1, dc: 0 },
                { dr: 0, dc: -1 },
                { dr: 0, dc: 1 },
            ];

            for (const hit of unsunkHits) {
                for (const d of directions) {
                    const nr = hit.r + d.dr;
                    const nc = hit.c + d.dc;
                    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                        const alreadyShot = aiShots.some((s: any) => s.r === nr && s.c === nc);
                        if (!alreadyShot) {
                            chosenR = nr;
                            chosenC = nc;
                            break;
                        }
                    }
                }
                if (chosenR !== -1) break;
            }
        }

        // If no candidate found from hits, pick random unvisited cell
        if (chosenR === -1) {
            const availableCells: { r: number; c: number }[] = [];
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const alreadyShot = aiShots.some((s: any) => s.r === r && s.c === c);
                    if (!alreadyShot) {
                        availableCells.push({ r, c });
                    }
                }
            }
            if (availableCells.length === 0) break;
            const pick = availableCells[Math.floor(Math.random() * availableCells.length)];
            chosenR = pick.r;
            chosenC = pick.c;
        }

        // Evaluate shot against Player 1
        let hitShip: any = null;
        for (const ship of targetShips) {
            const hitPos = ship.positions.find((p: any) => p.r === chosenR && p.c === chosenC);
            if (hitPos) {
                hitShip = ship;
                break;
            }
        }

        let shotResult: 'hit' | 'miss' | 'sunk' = 'miss';
        if (hitShip) {
            hitShip.hits = (hitShip.hits || 0) + 1;
            if (hitShip.hits >= hitShip.size) {
                hitShip.sunk = true;
                shotResult = 'sunk';
            } else {
                shotResult = 'hit';
            }
        } else {
            shotResult = 'miss';
        }

        aiShots.push({
            r: chosenR,
            c: chosenC,
            result: shotResult,
            shipId: hitShip ? hitShip.id : null,
        });

        // Check if AI won
        if (targetShips.every((s: any) => s.sunk)) {
            game.status = 'won';
            game.winner = 'ai-bot';
            aiContinuing = false;
        } else if (shotResult === 'miss') {
            game.turn = game.player1.id;
            aiContinuing = false;
        } else {
            // Hit or sunk: AI gets another shot (up to guard counter limit)
            aiContinuing = true;
        }
    }
}
