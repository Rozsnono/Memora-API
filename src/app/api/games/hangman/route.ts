import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Hangman } from '@/models/Hangman';
import { pusherServer } from '@/lib/pusher';
import { corsResponse, handleOptions } from '@/lib/cors';
import {
    MAX_CATEGORY_LENGTH,
    MAX_WORD_LENGTH,
    isGuessableChar,
    isWordSolved,
    normalizeLetter,
    normalizeWord,
    sanitizeHangman,
} from '@/lib/hangman';

export async function OPTIONS(request: Request) {
    return handleOptions(request);
}

function fail(req: Request, message: string, status: number) {
    return corsResponse(NextResponse.json({ error: message, message }, { status }), req);
}

/** Pusher hiba nem akaszthatja meg a játékot (nincs konfigurálva / átmeneti kiesés). */
async function notify(channel: string, event: string, payload: unknown) {
    try {
        await pusherServer.trigger(channel, event, payload);
    } catch (err) {
        console.warn(`Pusher '${event}' kihagyva:`, (err as Error)?.message);
    }
}

// Új játék: { spaceId, creatorId, creatorName, word, category, solo? }
export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const word = normalizeWord(body.word);
        const category = String(body.category ?? '').trim().slice(0, MAX_CATEGORY_LENGTH);

        if (!body.spaceId || !body.creatorId || !body.creatorName) {
            return fail(req, 'Hiányzó adatok (tér, feladó).', 400);
        }
        if (!word || word.length > MAX_WORD_LENGTH || !Array.from(word).some(isGuessableChar)) {
            return fail(req, `A szónak legalább egy betűt kell tartalmaznia (max. ${MAX_WORD_LENGTH} karakter).`, 400);
        }

        const solo = body.solo === true;
        const game = await Hangman.create({
            spaceId: String(body.spaceId),
            creatorId: String(body.creatorId),
            creatorName: String(body.creatorName),
            word,
            category: category || undefined,
            solo,
        });

        if (!solo) {
            await notify(game.spaceId, 'new-game', { type: 'hangman', gameId: game._id });
        }

        return corsResponse(NextResponse.json(sanitizeHangman(game, game.creatorId)), req);
    } catch (e: any) {
        console.error('Hangman POST hiba:', e);
        return fail(req, 'Nem sikerült létrehozni a játékot.', 500);
    }
}

// Tipp: { gameId, letter }
export async function PATCH(req: Request) {
    try {
        await connectDB();
        const { gameId, letter: rawLetter, userId } = await req.json();
        const letter = normalizeLetter(rawLetter);
        if (!letter) return fail(req, 'Érvénytelen betű.', 400);

        // Párhuzamos tippek ütközésekor (VersionError) újrapróbáljuk.
        for (let attempt = 0; attempt < 3; attempt++) {
            const game = await Hangman.findById(gameId);
            if (!game) return fail(req, 'A játék nem található.', 404);

            // Lezárt játékon nincs több tipp, de az aktuális állapotot visszaadjuk.
            if (game.status === 'won' || game.status === 'lost') {
                return corsResponse(NextResponse.json(sanitizeHangman(game, userId)), req);
            }

            if (!game.guessedLetters.includes(letter)) {
                game.guessedLetters.push(letter);
                if (!game.word.includes(letter)) game.wrongGuesses += 1;
            }

            if (isWordSolved(game.word, game.guessedLetters)) game.status = 'won';
            else if (game.wrongGuesses >= game.maxAttempts) game.status = 'lost';
            else game.status = 'playing';

            try {
                await game.save();
            } catch (err: any) {
                if (err?.name === 'VersionError' && attempt < 2) continue;
                throw err;
            }

            if (!game.solo) await notify(game.spaceId, 'game-update', sanitizeHangman(game));
            return corsResponse(NextResponse.json(sanitizeHangman(game, userId)), req);
        }
        return fail(req, 'Ütközés történt, próbáld újra.', 409);
    } catch (e: any) {
        console.error('Hangman PATCH hiba:', e);
        return fail(req, 'A tippelés sikertelen.', 500);
    }
}
