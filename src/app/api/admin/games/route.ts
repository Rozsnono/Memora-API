import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ChessGame } from '@/models/ChessGame';
import { Hangman } from '@/models/Hangman';
import Lobby from '@/models/Lobby';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const gameType = searchParams.get('type') || 'all'; // 'all', 'chess', 'hangman', 'lobby'

        const results: any = {};

        if (gameType === 'all' || gameType === 'chess') {
            results.chess = await ChessGame.find({})
                .sort({ updatedAt: -1 })
                .limit(50)
                .lean();
        }

        if (gameType === 'all' || gameType === 'hangman') {
            results.hangman = await Hangman.find({})
                .sort({ updatedAt: -1 })
                .limit(50)
                .lean();
        }

        if (gameType === 'all' || gameType === 'lobby') {
            results.lobbies = await Lobby.find({})
                .sort({ updatedAt: -1 })
                .limit(50)
                .lean();
        }

        return NextResponse.json(results);
    } catch (error: any) {
        console.error("GET /api/admin/games - Error:", error);
        return NextResponse.json({ error: "Failed to fetch games", details: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const id = searchParams.get('id');

        if (!type || !id) {
            return NextResponse.json({ error: "Both 'type' and 'id' are required" }, { status: 400 });
        }

        let deleted = null;
        if (type === 'chess') {
            deleted = await ChessGame.findByIdAndDelete(id);
        } else if (type === 'hangman') {
            deleted = await Hangman.findByIdAndDelete(id);
        } else if (type === 'lobby') {
            deleted = await Lobby.findByIdAndDelete(id);
        } else {
            return NextResponse.json({ error: "Invalid game type" }, { status: 400 });
        }

        if (!deleted) {
            return NextResponse.json({ error: "Game session not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `${type} game deleted successfully` });
    } catch (error: any) {
        console.error("DELETE /api/admin/games - Error:", error);
        return NextResponse.json({ error: "Failed to delete game", details: error.message }, { status: 500 });
    }
}
