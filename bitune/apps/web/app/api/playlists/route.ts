import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyNip98Event } from '@/lib/nostr/nip98';

const prisma = new PrismaClient();

// GET /api/playlists: List user's playlists
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const userPubkey = await verifyNip98Event(authHeader, 'GET', request.url);

        const playlists = await prisma.playlist.findMany({
            where: { ownerPubkey: userPubkey },
            include: {
                _count: {
                    select: { tracks: true }
                },
                tracks: {
                    take: 1, // Get first track for cover if needed
                    orderBy: { position: 'asc' },
                    include: {
                        track: { select: { coverUrl: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Format for frontend
        const formatted = playlists.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            count: p._count.tracks,
            // Use playlist cover OR first track cover
            coverUrl: p.coverUrl || p.tracks[0]?.track.coverUrl || null
        }));

        return NextResponse.json({ playlists: formatted });

    } catch (error) {
        console.error('Playlist GET Error:', error);
        if (error instanceof Error && (error.message.includes('Authorization') || error.message.includes('Invalid'))) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/playlists: Create new playlist
export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const userPubkey = await verifyNip98Event(authHeader, 'POST', request.url);

        const { title, description } = await request.json();

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        // Ensure user exists as a "listener" if not already
        await prisma.user.upsert({
            where: { pubkey: userPubkey },
            create: { pubkey: userPubkey },
            update: {}
        });

        const playlist = await prisma.playlist.create({
            data: {
                title,
                description,
                ownerPubkey: userPubkey
            }
        });

        return NextResponse.json({ playlist });

    } catch (error) {
        console.error('Playlist POST Error:', error);
        if (error instanceof Error && (error.message.includes('Authorization') || error.message.includes('Invalid'))) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
