import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Hangman } from '@/models/Hangman';
import { corsResponse, handleOptions } from '@/lib/cors';
import { sanitizeHangman } from '@/lib/hangman';

export async function OPTIONS(request: Request) {
    return handleOptions(request);
}

// GET ?spaceId=... – a tér futó, családi (nem szóló) játékai; a szó sosem szerepel benne.
export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const spaceId = searchParams.get('spaceId');

        if (!spaceId) {
            return corsResponse(NextResponse.json({ error: 'Hiányzó spaceId.' }, { status: 400 }), req);
        }

        const activeGames = await Hangman.find({
            spaceId,
            solo: { $ne: true },
            status: { $in: ['waiting', 'playing'] },
        }).sort({ createdAt: -1 });

        return corsResponse(NextResponse.json(activeGames.map((g) => sanitizeHangman(g))), req);
    } catch (e: any) {
        console.error('Hangman active hiba:', e);
        return corsResponse(NextResponse.json({ error: 'Nem sikerült lekérni az aktív játékokat.' }, { status: 500 }), req);
    }
}
