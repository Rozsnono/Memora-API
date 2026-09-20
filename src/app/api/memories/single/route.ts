// app/api/memories/route.ts
import connectDB from '@/lib/mongodb';
import { Memory } from '@/models/Memory';
import { NextResponse } from 'next/server';
import { corsResponse, handleOptions } from '@/lib/cors';

import { buildDirectDownloadUrl } from '@/lib/storageApi';

export async function OPTIONS(request: Request) {
    return handleOptions(request); // Pass request here
}

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const memory = await Memory.findById(id).lean();
        if (!memory) {
            return corsResponse(NextResponse.json({ error: "Not found" }, { status: 404 }), req);
        }
        if (Array.isArray(memory.media)) {
            memory.media = memory.media.map((m: any) => ({
                ...m,
                url: m.url || (m.webdavPath ? buildDirectDownloadUrl(m.webdavPath, { inline: true }) : '')
            }));
        }
        return corsResponse(NextResponse.json(memory), req);
    } catch (e) {
        return corsResponse(NextResponse.json({ error: "Not found" }, { status: 404 }), req);
    }
}