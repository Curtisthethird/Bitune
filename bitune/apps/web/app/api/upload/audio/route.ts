import { NextResponse } from 'next/server';
import { uploadAudioFile } from '@/lib/storage/storage';
import { verifyNip98Event } from '@/lib/nostr/nip98';
import { uploadLimiter } from '@/lib/ratelimit';
import { prisma } from '@/lib/prisma';

// Force nodejs runtime for local fs access if needed (Next.js is usually ok, but 'nodejs' ensures it)
export const runtime = 'nodejs';

const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg', 'audio/x-m4a'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
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
        const cover = formData.get('cover') as File | null;
        const title = formData.get('title') as string | null;
        const description = formData.get('description') as string | null;

        const genre = formData.get('genre') as string | null;
        const explicit = formData.get('explicit') === 'true';

        if (!file || !title) {
            return NextResponse.json({ error: 'Missing file or title' }, { status: 400 });
        }

        // Validation - Audio
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
        }
        if (file.size > MAX_MB * 1024 * 1024) {
            return NextResponse.json({ error: `File too large (max ${MAX_MB}MB)` }, { status: 413 });
        }

        // Validation - Cover (Optional but recommended)
        if (cover) {
            if (!ALLOWED_IMAGE_TYPES.includes(cover.type)) {
                return NextResponse.json({ error: 'Invalid cover image type (use JPG, PNG, WEBP)' }, { status: 400 });
            }
            if (cover.size > 5 * 1024 * 1024) { // 5MB limit for images
                return NextResponse.json({ error: 'Cover image too large (max 5MB)' }, { status: 413 });
            }
        }

        const tempId = crypto.randomUUID();

        // Upload Audio
        const buffer = Buffer.from(await file.arrayBuffer());
        const { audioUrl } = await uploadAudioFile({
            trackId: tempId,
            buffer,
            contentType: file.type,
            filename: file.name
        });

        // Upload Cover (if exists)
        let coverUrl = null;
        if (cover) {
            const coverBuffer = Buffer.from(await cover.arrayBuffer());
            // Reusing uploadAudioFile logic for S3/Local simplicity, though name is slightly misleading. 
            // Ideally we'd have a generic uploadFile, but this works if bucket is same.
            const coverUpload = await uploadAudioFile({
                trackId: `${tempId}-cover`,
                buffer: coverBuffer,
                contentType: cover.type,
                filename: cover.name
            });
            coverUrl = coverUpload.audioUrl;
        }

        // 3. Upsert Artist (Auto-Signup)
        // Ensure the user exists and is marked as an artist
        await prisma.user.upsert({
            where: { pubkey: artistPubkey },
            create: {
                pubkey: artistPubkey,
                isArtist: true,
                name: `Artist ${artistPubkey.slice(0, 6)}`, // Default name will be overwritten if profile exists
                about: 'New BitTune Artist'
            },
            update: {
                isArtist: true
            }
        });

        // Create Track Record
        const track = await prisma.track.create({
            data: {
                id: tempId,
                title,
                description,
                genre,
                explicit,
                artistPubkey,
                audioUrl,
                coverUrl
            }
        });

        return NextResponse.json({
            success: true,
            trackId: track.id,
            audioUrl: track.audioUrl,
            coverUrl: track.coverUrl,
            title: track.title
        });

    } catch (e: any) {
        console.error('Upload error', e);
        return NextResponse.json({ error: e.message || 'Internal Error' }, { status: 500 });
    }
}
