import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Lobby from '@/models/Lobby';
import { corsResponse, handleOptions } from '@/lib/cors';

export async function OPTIONS(request: Request) {
    return handleOptions(request); // Pass request here
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { code, playerName, passcode } = await request.json();

        if (!code || !playerName) {
            return corsResponse(NextResponse.json({ success: false, error: 'Hiányzó szobakód vagy név.' }, { status: 400 }), request);
        }

        const lobby = await Lobby.findOne({ code: code.toUpperCase() });

        if (!lobby) {
            return corsResponse(NextResponse.json({ success: false, error: 'A keresett szoba nem található.' }, { status: 404 }), request);
        }

        if (lobby.status !== 'waiting') {
            return corsResponse(NextResponse.json({ success: false, error: 'A játék már elkezdődött ebben a szobában.' }, { status: 400 }), request);
        }

        // Verify passcode if room is private
        if (lobby.passcode && lobby.passcode !== passcode) {
            return corsResponse(NextResponse.json({ success: false, error: 'Hibás szobakód PIN.' }, { status: 401 }), request);
        }

        // Check capacity limit
        if (lobby.players.length >= lobby.maxPlayers) {
            return corsResponse(NextResponse.json({ success: false, error: 'A szoba megtelt.' }, { status: 400 }), request);
        }

        // Avoid duplicate names in the same session
        if (lobby.players.includes(playerName)) {
            return corsResponse(NextResponse.json({ success: false, error: 'Ez a név már foglalt ebben a szobában.' }, { status: 400 }), request);
        }

        // Atomikus hozzáadás: párhuzamos csatlakozásnál sem lépjük túl a létszámot / nem duplázódik a név
        const updated = await Lobby.findOneAndUpdate(
            {
                code: lobby.code,
                status: 'waiting',
                players: { $ne: playerName },
                [`players.${lobby.maxPlayers - 1}`]: { $exists: false },
            },
            { $push: { players: playerName } },
            { new: true }
        );
        if (!updated) {
            return corsResponse(NextResponse.json({ success: false, error: 'A szoba időközben megtelt vagy elindult.' }, { status: 409 }), request);
        }

        const { passcode: _pin, ...safe } = updated.toObject();
        return corsResponse(NextResponse.json({ success: true, data: { ...safe, hasPasscode: !!_pin } }, { status: 200 }), request);
    } catch (error: any) {
        return corsResponse(NextResponse.json({ success: false, error: error.message }, { status: 500 }), request);
    }
}