import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Hangman } from '@/models/Hangman';
import { corsResponse, handleOptions } from '@/lib/cors';
import { sanitizeHangman } from '@/lib/hangman';

export async function OPTIONS(request: Request) {
    return handleOptions(request);
}

// GET ?id=...&userId=... – a `word` mező csak a feladónak / lezárt játéknál érkezik.
export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const userId = searchParams.get('userId');

        const game = id && /^[a-f\d]{24}$/i.test(id) ? await Hangman.findById(id) : null;
        if (!game) {
            return corsResponse(NextResponse.json({ error: 'A játék nem található.' }, { status: 404 }), req);
        }

        return corsResponse(NextResponse.json(sanitizeHangman(game, userId)), req);
    } catch (e: any) {
        console.error('Hangman single hiba:', e);
        return corsResponse(NextResponse.json({ error: 'Nem sikerült betölteni a játékot.' }, { status: 500 }), req);
    }
}
