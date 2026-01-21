import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyNip98Event } from '@/lib/nostr/nip98';

const prisma = new PrismaClient();

// POST /api/playlists/track: Add track to playlist
export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const userPubkey = await verifyNip98Event(authHeader, 'POST', request.url);

        const { playlistId, trackId } = await request.json();

        if (!playlistId || !trackId) {
            return NextResponse.json({ error: 'Missing playlistId or trackId' }, { status: 400 });
        }

        // Verify ownership
        const playlist = await prisma.playlist.findUnique({
            where: { id: playlistId }
        });

        if (!playlist) {
            return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
        }

        if (playlist.ownerPubkey !== userPubkey) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get max position
        const aggregations = await prisma.playlistTrack.aggregate({
            where: { playlistId },
            _max: { position: true }
        });
        const nextPosition = (aggregations._max.position || 0) + 1;

        // Add track
        await prisma.playlistTrack.create({
            data: {
                playlistId,
                trackId,
                position: nextPosition
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        // Handle unique constraint (already in playlist)
        if (String(error).includes('Unique constraint')) {
            return NextResponse.json({ error: 'Track already in playlist' }, { status: 409 });
        }

        console.error('Playlist Add Track Error:', error);
        if (error instanceof Error && (error.message.includes('Authorization') || error.message.includes('Invalid'))) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
