import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ChessGame } from '@/models/ChessGame';
import { pusherServer } from '@/lib/pusher';
import { corsResponse, handleOptions } from '@/lib/cors';
import { applyMove } from '@/lib/chessRules';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: Request) { return handleOptions(request); }

/**
 * PATCH: lépés végrehajtása. A szerver validálja (játékos, soron lévő fél, szabályos lépés),
 * és a tárolt FEN-ből számolja az új állást – a kliens FEN-jében nem bízunk.
 * Body: { gameId, userId, from, to, promotion? }
 */
export async function PATCH(req: Request) {
    try {
        await connectDB();
        const { gameId, userId, from, to, promotion } = await req.json();
        if (!gameId || !userId) {
            return corsResponse(NextResponse.json({ error: 'Hiányzó gameId vagy userId.' }, { status: 400 }), req);
        }

        const game = await ChessGame.findById(gameId);
        if (!game) return corsResponse(NextResponse.json({ error: 'A parti nem található.' }, { status: 404 }), req);
        if (game.status !== 'playing') {
            return corsResponse(NextResponse.json({ error: 'A parti nem folyamatban van.' }, { status: 409 }), req);
        }

        const turn = game.fen.split(' ')[1] === 'b' ? 'b' : 'w';
        const mover = turn === 'w' ? game.whitePlayer : game.blackPlayer;
        if (!mover?.id || mover.id.toString() !== userId.toString()) {
            return corsResponse(NextResponse.json({ error: 'Most nem te lépsz.' }, { status: 403 }), req);
        }

        const result = applyMove(game.fen, { from, to, promotion });
        if (!result.ok) {
            return corsResponse(NextResponse.json({ error: result.error }, { status: 400 }), req);
        }

        // Verseny elleni védelem: csak akkor írunk, ha közben nem változott az állás.
        const update: any = {
            fen: result.fen,
            status: result.outcome.status,
            winner: result.outcome.winner,
            endReason: result.outcome.endReason,
            lastMove: { from: result.from, to: result.to },
            $push: { history: result.san },
        };
        const updated = await ChessGame.findOneAndUpdate(
            { _id: gameId, fen: game.fen, status: 'playing' },
            update,
            { new: true }
        );
        if (!updated) {
            return corsResponse(NextResponse.json({ error: 'Az állás közben megváltozott, próbáld újra.' }, { status: 409 }), req);
        }

        const spaceId = updated.spaceId;
        try {
            await pusherServer.trigger(spaceId, 'chess-move', {
                gameId: updated._id.toString(),
                fen: updated.fen,
                move: result.san,
                lastMove: updated.lastMove,
                status: updated.status,
                winner: updated.winner,
                endReason: updated.endReason,
                historyLength: updated.history.length,
            });
        } catch (pushErr) {
            console.error('Chess pusher hiba:', pushErr);
        }

        return corsResponse(NextResponse.json(updated), req);
    } catch (e: any) {
        console.error('Chess move hiba:', e);
        return corsResponse(NextResponse.json({ error: 'Szerverhiba a lépés mentésekor.' }, { status: 500 }), req);
    }
}
