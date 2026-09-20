import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Log } from '@/models/Log';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectDB();
        const logs = await Log.find({})
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        return NextResponse.json(logs);
    } catch (error: any) {
        console.error("Failed fetching logs:", error);
        return NextResponse.json({ error: "Failed fetching logs", details: error.message }, { status: 500 });
    }
}
