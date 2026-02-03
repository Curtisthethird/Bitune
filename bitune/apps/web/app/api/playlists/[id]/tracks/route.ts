import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyNip98Event } from '@/lib/nostr/nip98';

// POST /api/playlists/[id]/tracks: Add track to playlist
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const authHeader = request.headers.get('Authorization');
        const userPubkey = await verifyNip98Event(authHeader, 'POST', request.url);

        const { trackId } = await request.json();

        const playlist = await prisma.playlist.findUnique({ where: { id } });
        if (!playlist) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (playlist.ownerPubkey !== userPubkey) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Get current count to set position
        const count = await prisma.playlistTrack.count({ where: { playlistId: id } });

        await prisma.playlistTrack.create({
            data: {
                playlistId: id,
                trackId,
                position: count + 1
            }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Track already in playlist' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

// DELETE /api/playlists/[id]/tracks: Remove track from playlist
// Body: { trackId } 
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: playlistId } = await params;
        const authHeader = request.headers.get('Authorization');
        const userPubkey = await verifyNip98Event(authHeader, 'DELETE', request.url);

        const { trackId } = await request.json();

        const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
        if (!playlist) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
        if (playlist.ownerPubkey !== userPubkey) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        await prisma.playlistTrack.delete({
            where: {
                playlistId_trackId: {
                    playlistId,
                    trackId
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
