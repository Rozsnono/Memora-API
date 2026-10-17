import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Lobby from '@/models/Lobby';
import { corsResponse, handleOptions } from '@/lib/cors';

export async function OPTIONS(request: Request) {
    return handleOptions(request); // Pass request here
}

function generateLobbyCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function GET(request: Request) {
    try {
        await dbConnect();
        const openLobbies = await Lobby.find({ status: 'waiting' }).sort({ createdAt: -1 }).lean();
        // A PIN soha nem hagyja el a szervert: csak azt jelezzük, hogy védett-e a szoba
        const data = openLobbies.map(({ passcode, ...rest }: any) => ({ ...rest, hasPasscode: !!passcode }));
        return corsResponse(NextResponse.json({ success: true, data }, { status: 200 }), request);
    } catch (error: any) {
        return corsResponse(NextResponse.json({ success: false, error: error.message }, { status: 500 }), request);
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { hostName, maxPlayers, passcode, themes, maxRounds } = await request.json();

        if (!hostName || !themes || themes.length === 0) {
            return corsResponse(NextResponse.json({ success: false, error: 'Hiányzó adatok.' }, { status: 400 }), request);
        }

        let lobbyCode = generateLobbyCode();
        let codeExists = await Lobby.findOne({ code: lobbyCode });
        while (codeExists) {
            lobbyCode = generateLobbyCode();
            codeExists = await Lobby.findOne({ code: lobbyCode });
        }

        const newLobby = await Lobby.create({
            code: lobbyCode,
            passcode: passcode || '',
            hostName,
            maxPlayers,
            players: [hostName],
            themes,
            maxRounds: maxRounds || 3, // Saves chosen round limit [3]
            status: 'waiting'
        });

        return corsResponse(NextResponse.json({ success: true, data: newLobby }, { status: 201 }), request);
    } catch (error: any) {
        return corsResponse(NextResponse.json({ success: false, error: error.message }, { status: 400 }), request);
    }
}