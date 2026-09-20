import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Memory } from '@/models/Memory';
import { Space } from '@/models/Space';
import { User } from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const spaceId = searchParams.get('spaceId');
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
        const skip = parseInt(searchParams.get('skip') || '0', 10);

        const filter: any = {};
        if (spaceId && spaceId !== 'ALL') {
            filter.spaceId = spaceId;
        }
        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }

        const [memories, total] = await Promise.all([
            Memory.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Memory.countDocuments(filter)
        ]);

        // Enrich with space name and creator name
        const enriched = await Promise.all(
            memories.map(async (m: any) => {
                const [space, creator] = await Promise.all([
                    Space.findById(m.spaceId).select('name').lean().catch(() => null),
                    User.findById(m.creatorId).select('name email').lean().catch(() => null)
                ]);

                return {
                    ...m,
                    spaceName: space?.name || m.spaceId,
                    creatorName: creator?.name || 'Unknown',
                    creatorEmail: creator?.email || ''
                };
            })
        );

        return NextResponse.json({ memories: enriched, total });
    } catch (error: any) {
        console.error("GET /api/admin/memories - Error:", error);
        return NextResponse.json({ error: "Failed to fetch memories", details: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        let memoryId = searchParams.get('id');

        if (!memoryId) {
            const body = await req.json().catch(() => ({}));
            memoryId = body.memoryId;
        }

        if (!memoryId) {
            return NextResponse.json({ error: "memoryId is required" }, { status: 400 });
        }

        const deleted = await Memory.findByIdAndDelete(memoryId);
        if (!deleted) {
            return NextResponse.json({ error: "Memory not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `Memory "${deleted.title}" deleted successfully` });
    } catch (error: any) {
        console.error("DELETE /api/admin/memories - Error:", error);
        return NextResponse.json({ error: "Failed to delete memory", details: error.message }, { status: 500 });
    }
}
