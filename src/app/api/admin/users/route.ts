import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { Space } from '@/models/Space';
import { Memory } from '@/models/Memory';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
        const skip = parseInt(searchParams.get('skip') || '0', 10);

        const filter: any = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('-password')
                .lean(),
            User.countDocuments(filter)
        ]);

        // Enrich with memory count and spaces count for each user
        const enrichedUsers = await Promise.all(
            users.map(async (u: any) => {
                const [memoriesCount, spacesOwnedCount] = await Promise.all([
                    Memory.countDocuments({ creatorId: u._id.toString() }),
                    Space.countDocuments({ createdBy: u._id.toString() })
                ]);
                return {
                    ...u,
                    memoriesCount,
                    spacesOwnedCount,
                    spacesJoinedCount: u.spaces?.length || 0
                };
            })
        );

        return NextResponse.json({ users: enrichedUsers, total });
    } catch (error: any) {
        console.error("GET /api/admin/users - Error:", error);
        return NextResponse.json({ error: "Failed to fetch users", details: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { userId, role, newPassword, mode, name } = body;

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        const updates: any = {};
        if (role && ['user', 'admin'].includes(role)) {
            updates.role = role;
        }
        if (mode && ['personal', 'couple', 'family'].includes(mode)) {
            updates.mode = mode;
        }
        if (name && typeof name === 'string') {
            updates.name = name.trim();
        }
        if (newPassword && newPassword.length >= 4) {
            updates.password = await bcrypt.hash(newPassword, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error: any) {
        console.error("PATCH /api/admin/users - Error:", error);
        return NextResponse.json({ error: "Failed to update user", details: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        let userId = searchParams.get('id');

        if (!userId) {
            const body = await req.json().catch(() => ({}));
            userId = body.userId;
        }

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        // Delete user
        const deleted = await User.findByIdAndDelete(userId);
        if (!deleted) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Remove from space members
        await Space.updateMany(
            { members: userId },
            { $pull: { members: userId } }
        );

        return NextResponse.json({ success: true, message: `User ${deleted.name} deleted successfully` });
    } catch (error: any) {
        console.error("DELETE /api/admin/users - Error:", error);
        return NextResponse.json({ error: "Failed to delete user", details: error.message }, { status: 500 });
    }
}
