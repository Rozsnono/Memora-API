import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectDB();

        // 1. Test Synology NAS API Ping
        const nasUrl = process.env.STORAGE_API_URL || 'https://api.filesharer.rozsnorbert.hu:9443';
        let nasStatus = {
            url: nasUrl,
            reachable: false,
            latencyMs: 0,
            error: null as string | null
        };

        const startTime = Date.now();
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const res = await fetch(`${nasUrl}/docs`, {
                method: 'GET',
                signal: controller.signal
            }).catch(async () => {
                // Fallback attempt to root
                return await fetch(nasUrl, { method: 'GET', signal: controller.signal });
            });

            clearTimeout(timeoutId);
            nasStatus.latencyMs = Date.now() - startTime;
            nasStatus.reachable = res.status < 500;
        } catch (err: any) {
            nasStatus.latencyMs = Date.now() - startTime;
            nasStatus.error = err.message || 'Connection timed out';
        }

        // 2. Check Environment Variables (Masked)
        const envStatus = {
            MONGODB_URI: { set: !!process.env.MONGODB_URI },
            STORAGE_API_URL: { set: !!process.env.STORAGE_API_URL, value: process.env.STORAGE_API_URL || 'Default' },
            STORAGE_API_KEY: { set: !!process.env.STORAGE_API_KEY, length: process.env.STORAGE_API_KEY?.length || 0 },
            PUSHER_APP_ID: { set: !!process.env.PUSHER_APP_ID },
            PUSHER_KEY: { set: !!process.env.NEXT_PUBLIC_PUSHER_KEY || !!process.env.PUSHER_KEY },
            PUSHER_SECRET: { set: !!process.env.PUSHER_SECRET },
            AGORA_APP_ID: { set: !!process.env.AGORA_APP_ID || !!process.env.NEXT_PUBLIC_AGORA_APP_ID },
            JWT_SECRET: { set: !!process.env.JWT_SECRET }
        };

        // 3. MongoDB Collection Counts
        const db = mongoose.connection.db;
        let collections: any[] = [];
        if (db) {
            const rawCollections = await db.listCollections().toArray();
            collections = await Promise.all(
                rawCollections.map(async (col) => {
                    const count = await db.collection(col.name).countDocuments();
                    return { name: col.name, count };
                })
            );
        }

        return NextResponse.json({
            nas: nasStatus,
            env: envStatus,
            database: {
                name: db?.databaseName || 'unknown',
                readyState: mongoose.connection.readyState,
                collections
            },
            server: {
                nodeVersion: process.version,
                platform: process.platform,
                uptime: Math.floor(process.uptime()),
                memoryUsage: process.memoryUsage(),
                now: new Date().toISOString()
            }
        });
    } catch (error: any) {
        console.error("GET /api/admin/system - Error:", error);
        return NextResponse.json({ error: "Failed to run system diagnostics", details: error.message }, { status: 500 });
    }
}
