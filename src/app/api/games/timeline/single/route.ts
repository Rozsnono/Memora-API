import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { TimelineGame } from '@/models/TimeLineGame';
import { corsResponse, handleOptions } from '@/lib/cors';
import { sanitizeTimeline } from '@/lib/timeline';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: Request) {
    return handleOptions(request);
}

/** GET: egy idővonal játék (aktuális közös sorrenddel, dátumok nélkül amíg nincs megnyerve). */
export async function GET(req: Request) {
    try {
        await connectDB();
        const id = new URL(req.url).searchParams.get('id');

        if (!id || !mongoose.isValidObjectId(id)) {
            return corsResponse(NextResponse.json({ error: 'Érvénytelen játékazonosító.' }, { status: 400 }), req);
        }

        const game = await TimelineGame.findById(id);
        if (!game) {
            return corsResponse(NextResponse.json({ error: 'A játék lejárt vagy nem létezik.' }, { status: 404 }), req);
        }
        return corsResponse(NextResponse.json(sanitizeTimeline(game)), req);
    } catch (error: any) {
        console.error('Timeline Single API Error:', error.message);
        return corsResponse(NextResponse.json({ error: 'Szerverhiba az idővonal betöltésekor.' }, { status: 500 }), req);
    }
}
