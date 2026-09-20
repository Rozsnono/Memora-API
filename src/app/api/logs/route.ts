import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Log } from '@/models/Log';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);
        const method = searchParams.get('method');
        const statusType = searchParams.get('statusType'); // '2xx', '4xx', '5xx'
        const search = searchParams.get('search');

        const filter: any = {};
        if (method && method !== 'ALL') {
            filter.method = method.toUpperCase();
        }
        if (statusType) {
            if (statusType === '2xx') filter.status = { $gte: 200, $lt: 300 };
            else if (statusType === '4xx') filter.status = { $gte: 400, $lt: 500 };
            else if (statusType === '5xx') filter.status = { $gte: 500 };
        }
        if (search) {
            filter.$or = [
                { path: { $regex: search, $options: 'i' } },
                { ip: { $regex: search, $options: 'i' } },
                { errorMessage: { $regex: search, $options: 'i' } }
            ];
        }

        const logs = await Log.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return NextResponse.json(logs);
    } catch (error: any) {
        console.error("Failed fetching logs:", error);
        return NextResponse.json({ error: "Failed fetching logs", details: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB();
        const result = await Log.deleteMany({});
        return NextResponse.json({ success: true, deletedCount: result.deletedCount });
    } catch (error: any) {
        console.error("Failed clearing logs:", error);
        return NextResponse.json({ error: "Failed clearing logs", details: error.message }, { status: 500 });
    }
}
