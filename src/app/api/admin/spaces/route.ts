import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Space } from '@/models/Space';
import { Memory } from '@/models/Memory';
import { User } from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

        const filter: any = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { inviteCode: { $regex: search, $options: 'i' } }
            ];
        }

        const spaces = await Space.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        // Enrich with memory count and creator details
        const enriched = await Promise.all(
            spaces.map(async (s: any) => {
                const [memoriesCount, creator] = await Promise.all([
                    Memory.countDocuments({ spaceId: s._id.toString() }),
                    User.findById(s.createdBy).select('name email').lean().catch(() => null)
                ]);

                return {
                    ...s,
                    memoriesCount,
                    membersCount: s.members?.length || 0,
                    creatorName: creator?.name || 'Unknown',
                    creatorEmail: creator?.email || ''
                };
            })
        );

        return NextResponse.json({ spaces: enriched, total: enriched.length });
    } catch (error: any) {
        console.error("GET /api/admin/spaces - Error:", error);
        return NextResponse.json({ error: "Failed to fetch spaces", details: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { spaceId, name, type, themeColor } = body;

        if (!spaceId) {
            return NextResponse.json({ error: "spaceId is required" }, { status: 400 });
        }

        const updates: any = {};
        if (name) updates.name = name.trim();
        if (type) updates.type = type;
        if (themeColor) updates.themeColor = themeColor;

        const updated = await Space.findByIdAndUpdate(spaceId, updates, { new: true });
        if (!updated) {
            return NextResponse.json({ error: "Space not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, space: updated });
    } catch (error: any) {
        console.error("PATCH /api/admin/spaces - Error:", error);
        return NextResponse.json({ error: "Failed to update space", details: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        let spaceId = searchParams.get('id');

        if (!spaceId) {
            const body = await req.json().catch(() => ({}));
            spaceId = body.spaceId;
        }

        if (!spaceId) {
            return NextResponse.json({ error: "spaceId is required" }, { status: 400 });
        }

        const deleted = await Space.findByIdAndDelete(spaceId);
        if (!deleted) {
            return NextResponse.json({ error: "Space not found" }, { status: 404 });
        }

        // Also clean up memories in this space
        await Memory.deleteMany({ spaceId });

        // Clean up references in User documents
        await User.updateMany(
            { spaces: spaceId },
            { $pull: { spaces: spaceId } }
        );

        return NextResponse.json({ success: true, message: `Space ${deleted.name} and associated memories deleted` });
    } catch (error: any) {
        console.error("DELETE /api/admin/spaces - Error:", error);
        return NextResponse.json({ error: "Failed to delete space", details: error.message }, { status: 500 });
    }
}
