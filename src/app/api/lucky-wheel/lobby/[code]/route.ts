import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Lobby from '@/models/Lobby';
import { corsResponse, handleOptions } from '@/lib/cors';

// A PIN nem hagyhatja el a szervert
const withoutPin = ({ passcode, ...rest }: any) => ({ ...rest, hasPasscode: !!passcode });


export async function OPTIONS(request: Request) {
    return handleOptions(request); // Pass request here
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        await dbConnect();
        const { code } = await params;

        // Use .lean() to bypass Mongoose's hydration/schema-filtering and return raw DB properties [6]
        const lobby = await Lobby.findOne({ code: code.toUpperCase() }).lean();

        if (!lobby) {
            return corsResponse(NextResponse.json({ success: false, error: 'Szoba nem található.' }, { status: 404 }), request);
        }

        return corsResponse(NextResponse.json({ success: true, data: withoutPin(lobby) }, { status: 200 }), request);
    } catch (error: any) {
        return corsResponse(NextResponse.json({ success: false, error: error.message }, { status: 500 }), request);
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        await dbConnect();
        const { code } = await params;
        const body = await request.json();

        // Csak a játékállapot módosítható; a szoba azonosító jellegű mezői (players, hostName, passcode, themes...) nem
        const ALLOWED = ['status', 'phrase', 'category', 'activePlayerIdx', 'revealedLetters', 'playerScores',
            'playerTotalScores', 'currentTurnScore', 'currentWheelValue', 'turnState', 'round'];
        const update: Record<string, unknown> = {};
        for (const key of ALLOWED) {
            if (body && key in body) update[key] = body[key];
        }
        if (Object.keys(update).length === 0) {
            return corsResponse(NextResponse.json({ success: false, error: 'Nincs módosítható mező.' }, { status: 400 }), request);
        }

        // Use findOneAndUpdate with $set to bypass stale in-memory Mongoose schema validation on writes [1]
        const lobby = await Lobby.findOneAndUpdate(
            { code: code.toUpperCase() },
            { $set: update },
            { new: true, runValidators: false } // return updated document
        ).lean(); // return raw JSON

        if (!lobby) {
            return corsResponse(NextResponse.json({ success: false, error: 'Szoba nem található.' }, { status: 404 }), request);
        }

        return corsResponse(NextResponse.json({ success: true, data: withoutPin(lobby) }, { status: 200 }), request);
    } catch (error: any) {
        return corsResponse(NextResponse.json({ success: false, error: error.message }, { status: 500 }), request);
    }
}