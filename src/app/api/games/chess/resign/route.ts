import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ChessGame } from '@/models/ChessGame';
import { pusherServer } from '@/lib/pusher';
import { corsResponse, handleOptions } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: Request) { return handleOptions(request); }

/** PATCH: feladás. Body: { gameId, userId } – az ellenfél nyer. */
export async function PATCH(req: Request) {
    try {
        await connectDB();
        const { gameId, userId } = await req.json();
        if (!gameId || !userId) {
            return corsResponse(NextResponse.json({ error: 'Hiányzó gameId vagy userId.' }, { status: 400 }), req);
        }
        const game = await ChessGame.findById(gameId);
        if (!game) return corsResponse(NextResponse.json({ error: 'A parti nem található.' }, { status: 404 }), req);
        if (game.status === 'won' || game.status === 'draw') {
            return corsResponse(NextResponse.json(game), req);
        }

        const uid = userId.toString();
        let winner: 'white' | 'black';
        if (game.whitePlayer?.id?.toString() === uid) winner = 'black';
        else if (game.blackPlayer?.id?.toString() === uid) winner = 'white';
        else return corsResponse(NextResponse.json({ error: 'Nem vagy játékos ebben a partiban.' }, { status: 403 }), req);

        // Várakozó (még egyedül lévő) partit nem lehet "nyerve" lezárni: ilyenkor a lépés mentés nélkül hibát kap.
        if (game.status === 'waiting') {
            return corsResponse(NextResponse.json({ error: 'Még nincs ellenfél, a parti nem adható fel.' }, { status: 409 }), req);
        }

        game.status = 'won';
        game.winner = winner;
        game.endReason = 'resign';
        await game.save();

        try {
            await pusherServer.trigger(game.spaceId, 'chess-move', {
                gameId: game._id.toString(),
                fen: game.fen,
                move: null,
                lastMove: game.lastMove,
                status: game.status,
                winner: game.winner,
                endReason: game.endReason,
                historyLength: game.history.length,
            });
        } catch (pushErr) {
            console.error('Chess pusher hiba:', pushErr);
        }
        return corsResponse(NextResponse.json(game), req);
    } catch (e: any) {
        console.error('Chess resign hiba:', e);
        return corsResponse(NextResponse.json({ error: 'Szerverhiba a feladáskor.' }, { status: 500 }), req);
    }
}
