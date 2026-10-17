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
        const { code, playerName } = await request.json();

        if (!code || !playerName) {
            return corsResponse(NextResponse.json({ success: false, error: 'Hiányzó adatok.' }, { status: 400 }), request);
        }

        const lobby = await Lobby.findOne({ code: code.toUpperCase() });

        if (!lobby) {
            return corsResponse(NextResponse.json({ success: false, error: 'A keresett szoba nem található.' }, { status: 404 }), request);
        }

        // Játék közben a pontszám-tömbök és az aktív játékos indexe együtt mozog a players listával
        const leaverIdx = lobby.players.indexOf(playerName);
        if (leaverIdx !== -1 && lobby.status === 'active') {
            const wasActive = lobby.activePlayerIdx === leaverIdx;
            lobby.playerScores.splice(leaverIdx, 1);
            lobby.playerTotalScores.splice(leaverIdx, 1);
            if (leaverIdx < lobby.activePlayerIdx) lobby.activePlayerIdx -= 1;
            const remaining = lobby.players.length - 1;
            if (remaining > 0 && lobby.activePlayerIdx >= remaining) lobby.activePlayerIdx = 0;
            if (wasActive) lobby.turnState = 'idle';
        }

        // Filter out the player who requested to leave
        lobby.players = lobby.players.filter((p) => p !== playerName);

        // If the room is empty, or if the host leaves, terminate the matchmaker lobby
        if (lobby.players.length === 0 || lobby.hostName === playerName) {
            lobby.status = 'finished';
        }

        await lobby.save();
        return corsResponse(NextResponse.json({ success: true, data: lobby }, { status: 200 }), request);
    } catch (error: any) {
        return corsResponse(NextResponse.json({ success: false, error: error.message }, { status: 500 }), request);
    }
}