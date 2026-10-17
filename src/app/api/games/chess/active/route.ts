import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectDB from '@/lib/mongodb';
import { ChessGame } from '@/models/ChessGame';
import { corsResponse, handleOptions } from '@/lib/cors';

export async function OPTIONS(req: Request) { return handleOptions(req); }

export async function GET(req: Request) {
    headers();
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const spaceId = searchParams.get('spaceId');
        if (!spaceId) return corsResponse(NextResponse.json({ error: 'Hiányzó spaceId.' }, { status: 400 }), req);

        // Find games in this space that are still "waiting" or "playing"
        const games = await ChessGame.find({
            spaceId,
            status: { $in: ['waiting', 'playing'] }
        }).sort({ createdAt: -1 });

        return corsResponse(NextResponse.json(games), req);
    } catch (e: any) {
        console.error('Chess active hiba:', e);
        return corsResponse(NextResponse.json({ error: 'Szerverhiba.' }, { status: 500 }), req);
    }
}