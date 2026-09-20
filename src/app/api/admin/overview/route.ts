import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { Space } from '@/models/Space';
import { Memory } from '@/models/Memory';
import { ChessGame } from '@/models/ChessGame';
import { Hangman } from '@/models/Hangman';
import Lobby from '@/models/Lobby';
import { Log } from '@/models/Log';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectDB();

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            newUsersThisWeek,
            totalSpaces,
            totalMemories,
            activeChess,
            activeHangman,
            activeLobbies,
            totalLogs,
            recentErrors,
            recentRequests,
            storageStats
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
            Space.countDocuments(),
            Memory.countDocuments(),
            ChessGame.countDocuments({ status: { $in: ['waiting', 'playing'] } }),
            Hangman.countDocuments({ status: { $in: ['waiting', 'playing'] } }),
            Lobby.countDocuments({ status: { $in: ['waiting', 'active'] } }),
            Log.countDocuments(),
            Log.countDocuments({ status: { $gte: 400 }, createdAt: { $gte: twentyFourHoursAgo } }),
            Log.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } }),
            Memory.aggregate([
                { $unwind: { path: '$media', preserveNullAndEmptyArrays: false } },
                {
                    $group: {
                        _id: null,
                        totalMediaFiles: { $sum: 1 },
                        totalBytes: { $sum: { $ifNull: ['$media.fileSize', 2048576] } } // Fallback ~2MB/file if not recorded
                    }
                }
            ])
        ]);

        const totalMediaCount = storageStats[0]?.totalMediaFiles || 0;
        const totalStorageBytes = storageStats[0]?.totalBytes || 0;

        // Recent activity feed (latest memories and new users)
        const [recentMemories, latestUsers] = await Promise.all([
            Memory.find({})
                .sort({ createdAt: -1 })
                .limit(5)
                .select('title creatorId spaceId media createdAt')
                .lean(),
            User.find({})
                .sort({ createdAt: -1 })
                .limit(5)
                .select('name email role mode createdAt')
                .lean()
        ]);

        const memUsage = process.memoryUsage();

        return NextResponse.json({
            stats: {
                totalUsers,
                newUsersThisWeek,
                totalSpaces,
                totalMemories,
                totalMediaCount,
                totalStorageBytes,
                activeGames: {
                    chess: activeChess,
                    hangman: activeHangman,
                    lobbies: activeLobbies,
                    total: activeChess + activeHangman + activeLobbies
                },
                traffic: {
                    totalLogs,
                    requestsLast24h: recentRequests,
                    errorsLast24h: recentErrors
                }
            },
            system: {
                status: 'operational',
                database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
                nodeVersion: process.version,
                uptimeSeconds: Math.floor(process.uptime()),
                memoryUsage: {
                    rssMB: Math.round(memUsage.rss / 1024 / 1024),
                    heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
                    heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024)
                },
                serverTime: new Date().toISOString()
            },
            recentActivity: {
                memories: recentMemories,
                users: latestUsers
            }
        });
    } catch (error: any) {
        console.error("GET /api/admin/overview - Error:", error);
        return NextResponse.json({ error: "Failed to fetch admin overview", details: error.message }, { status: 500 });
    }
}
