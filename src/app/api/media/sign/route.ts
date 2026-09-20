import { NextResponse } from 'next/server';
import { corsResponse, handleOptions } from '@/lib/cors';
import { getStorageApiUrl, getStorageApiKey } from '@/lib/storageApi';

export async function OPTIONS(request: Request) {
    return handleOptions(request);
}

export async function POST(req: Request) {
    try {
        const uploadUrl = getStorageApiUrl();
        const apiKey = getStorageApiKey();
        return corsResponse(NextResponse.json({
            provider: 'synology_nas',
            uploadUrl,
            apiKey,
            targetPath: '/uploads/memora'
        }), req);
    } catch (error: any) {
        return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }), req);
    }
}