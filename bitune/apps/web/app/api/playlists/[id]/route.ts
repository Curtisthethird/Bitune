import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyNip98Event } from '@/lib/nostr/nip98';

// GET /api/playlists/[id]: Get full playlist details with tracks
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const playlist = await prisma.playlist.findUnique({
            where: { id },
            include: {
                owner: { select: { name: true, picture: true, pubkey: true } },
                tracks: {
                    orderBy: { position: 'asc' },
                    include: {
                        track: {
                            include: {
                                artist: { select: { name: true, picture: true } }
                            }
                        }
                    }
                }
            }
        });

        if (!playlist) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Flatten database result into simple track list
        const response = {
            ...playlist,
            tracks: playlist.tracks.map(pt => pt.track)
        };

        return NextResponse.json(response);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

// DELETE /api/playlists/[id]: Delete playlist
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const authHeader = request.headers.get('Authorization');
        const userPubkey = await verifyNip98Event(authHeader, 'DELETE', request.url);

        const playlist = await prisma.playlist.findUnique({ where: { id } });
        if (!playlist) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (playlist.ownerPubkey !== userPubkey) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await prisma.playlist.delete({ where: { id } });
        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
