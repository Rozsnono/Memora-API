import { Chess } from 'chess.js';

/** Kezdőállás FEN-je (a ChessGame modell alapértelmezésével egyezik). */
export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export type ChessStatus = 'waiting' | 'playing' | 'draw' | 'won';
export type ChessEndReason = 'checkmate' | 'stalemate' | 'threefold' | 'insufficient' | 'fifty' | 'draw' | 'resign' | null;

export interface ChessOutcome {
    status: ChessStatus;
    /** 'white' | 'black' | null */
    winner: 'white' | 'black' | null;
    endReason: ChessEndReason;
}

/** A pozíció (és a lépéstörténet) alapján meghatározza a játék állapotát. */
export function evaluatePosition(chess: Chess): ChessOutcome {
    if (chess.isCheckmate()) {
        // a soron lévő fél kapott matt, tehát az ellenfele nyert
        return { status: 'won', winner: chess.turn() === 'w' ? 'black' : 'white', endReason: 'checkmate' };
    }
    if (chess.isStalemate()) return { status: 'draw', winner: null, endReason: 'stalemate' };
    if (chess.isInsufficientMaterial()) return { status: 'draw', winner: null, endReason: 'insufficient' };
    if (chess.isThreefoldRepetition()) return { status: 'draw', winner: null, endReason: 'threefold' };
    if (chess.isDraw()) return { status: 'draw', winner: null, endReason: 'fifty' };
    return { status: 'playing', winner: null, endReason: null };
}

export interface MoveInput {
    from?: string;
    to?: string;
    promotion?: string;
}

export type MoveResult =
    | { ok: true; fen: string; san: string; from: string; to: string; outcome: ChessOutcome }
    | { ok: false; error: string };

/**
 * Szerveroldali lépésvalidáció: a tárolt FEN-ből indulva lejátssza a lépést.
 * A kliens csak from/to/promotion adatot küld, a FEN-t a szerver számolja.
 */
export function applyMove(fen: string, input: MoveInput): MoveResult {
    if (!input.from || !input.to) return { ok: false, error: 'Hiányzó lépés (from/to).' };
    let chess: Chess;
    try {
        chess = new Chess(fen);
    } catch {
        return { ok: false, error: 'A tárolt állás hibás.' };
    }
    try {
        const move = chess.move({ from: input.from, to: input.to, promotion: input.promotion || 'q' });
        return {
            ok: true,
            fen: chess.fen(),
            san: move.san,
            from: move.from,
            to: move.to,
            outcome: evaluatePosition(chess),
        };
    } catch {
        return { ok: false, error: 'Szabálytalan lépés.' };
    }
}
