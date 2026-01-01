import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { uploadAudioFile } from '@/lib/storage/storage';
import { verifyNip98Event } from '@/lib/nostr/nip98';
import { uploadLimiter } from '@/lib/ratelimit';

// Force nodejs runtime for local fs access if needed (Next.js is usually ok, but 'nodejs' ensures it)
export const runtime = 'nodejs';

const prisma = new PrismaClient();

const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg', 'audio/x-m4a'];
const MAX_MB = Number(process.env.MAX_UPLOAD_MB) || 50;

export async function POST(request: Request) {
    try {
        // 1. NIP-98 Security Check
        const authHeader = request.headers.get('Authorization');
        // Construct full URL for validation (host might need adjusting in prod behind proxy)
        const url = request.url;
        const artistPubkey = await verifyNip98Event(authHeader, 'POST', url);

        // 2. Rate Limit Check
        if (!uploadLimiter.check(artistPubkey)) {
            return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const title = formData.get('title') as string | null;
        // const artistPubkey = formData.get('artistId') as string | null; // UNSAFE - Removed

        if (!file || !title) {
            return NextResponse.json({ error: 'Missing file or title' }, { status: 400 });
        }

        // Validation
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
        }
        if (file.size > MAX_MB * 1024 * 1024) {
            return NextResponse.json({ error: `File too large (max ${MAX_MB}MB)` }, { status: 413 });
        }

        // Create a temporary ID for the track to use in path (or generate one)
        // We can just generate a UUID here or let Prisma do it inside?
        // We need trackId for storage path.
        // Let's generate a UUID manually or create record first?
        // If we create record first, we need audioUrl.
        // So we generate ID first.
        // We'll use a placeholder or better, generate one. Prisma usually does. 
        // We can trust `crypto.randomUUID()` in Node.
        const tempId = crypto.randomUUID();

        const buffer = Buffer.from(await file.arrayBuffer());

        const { audioUrl } = await uploadAudioFile({
            trackId: tempId,
            buffer,
            contentType: file.type,
            filename: file.name
        });

        // Create Track Record
        // Note: nostrEventId is optional now.
        const track = await prisma.track.create({
            data: {
                id: tempId,
                title,
                artistPubkey,
                audioUrl,
                // nostrEventId left null/undefined for now
            }
        });

        return NextResponse.json({
            success: true,
            trackId: track.id,
            audioUrl: track.audioUrl,
            title: track.title
        });

    } catch (e: any) {
        console.error('Upload error', e);
        return NextResponse.json({ error: e.message || 'Internal Error' }, { status: 500 });
    }
}
