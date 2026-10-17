import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ChessGame } from '@/models/ChessGame';
import { pusherServer } from '@/lib/pusher';
import { corsResponse, handleOptions } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: Request) { return handleOptions(request); }

/**
 * PATCH: csatlakozás egy partihoz. A válasz mindig a játék dokumentuma;
 * ha nincs szabad hely, `spectator: true` jelzi a nézői módot (nem hiba).
 */
export async function PATCH(req: Request) {
    try {
        await connectDB();
        const { gameId, userId, userName } = await req.json();
        if (!gameId || !userId) {
            return corsResponse(NextResponse.json({ error: 'Hiányzó gameId vagy userId.' }, { status: 400 }), req);
        }
        const game = await ChessGame.findById(gameId);
        if (!game) return corsResponse(NextResponse.json({ error: 'A parti nem található.' }, { status: 404 }), req);

        const uid = userId.toString();
        // Már játékos: csak visszaadjuk
        if (game.whitePlayer?.id?.toString() === uid || game.blackPlayer?.id?.toString() === uid) {
            return corsResponse(NextResponse.json(game), req);
        }
        // Befejezett parti: csak megtekinthető
        if (game.status === 'won' || game.status === 'draw') {
            return corsResponse(NextResponse.json({ ...game.toObject(), spectator: true }), req);
        }

        // Atomikus ülésfoglalás: két egyidejű csatlakozó nem kaphatja ugyanazt a helyet
        const seat = { id: uid, name: userName || 'Családtag' };
        let updated = await ChessGame.findOneAndUpdate(
            { _id: gameId, 'whitePlayer.id': null },
            { whitePlayer: seat, status: game.blackPlayer?.id ? 'playing' : 'waiting' },
            { new: true }
        );
        if (!updated) {
            updated = await ChessGame.findOneAndUpdate(
                { _id: gameId, 'blackPlayer.id': null },
                { blackPlayer: seat, status: game.whitePlayer?.id ? 'playing' : 'waiting' },
                { new: true }
            );
        }
        if (!updated) {
            return corsResponse(NextResponse.json({ ...game.toObject(), spectator: true }), req);
        }

        try {
            await pusherServer.trigger(updated.spaceId, 'chess-join', updated);
        } catch (pushErr) {
            console.error('Chess pusher hiba:', pushErr);
        }
        return corsResponse(NextResponse.json(updated), req);
    } catch (e: any) {
        console.error('Chess join hiba:', e);
        return corsResponse(NextResponse.json({ error: 'Szerverhiba a csatlakozáskor.' }, { status: 500 }), req);
    }
}
