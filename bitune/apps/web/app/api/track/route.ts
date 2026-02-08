import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyNostrEvent } from '@/lib/nostr/events';
import { KIND_TRACK_METADATA } from '@/lib/shared/constants';

export async function POST(request: Request) {
    try {
        const { event, title } = await request.json();

        if (!verifyNostrEvent(event)) return NextResponse.json({ error: 'Invalid sig' }, { status: 401 });
        if (event.kind !== KIND_TRACK_METADATA) return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });

        const content = JSON.parse(event.content);

        await prisma.track.create({
            data: {
                title: title || content.title,
                artistPubkey: event.pubkey,
                nostrEventId: event.id,
                audioUrl: content.audioUrl,
            }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const pubkey = searchParams.get('pubkey');
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'new'; // 'new' or 'hot'

    try {
        let tracks;
        const baseWhere: any = { isFlagged: false };

        if (pubkey) baseWhere.artistPubkey = pubkey;
        if (category && category !== 'all') baseWhere.genre = category;

        if (sort === 'hot') {
            // Hot: Most sessions in current week
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const sessionCounts = await prisma.session.groupBy({
                by: ['trackId'],
                where: { startTime: { gte: weekAgo } },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 20
            });

            const hotTrackIds = sessionCounts.map(s => s.trackId);

            tracks = await prisma.track.findMany({
                where: {
                    ...baseWhere,
                    id: { in: hotTrackIds }
                },
                include: {
                    artist: {
                        select: { name: true, picture: true, isVerified: true }
                    }
                }
            });
            // Re-sort by the session count order
            tracks.sort((a, b) => hotTrackIds.indexOf(a.id) - hotTrackIds.indexOf(b.id));

        } else {
            // New: Classic chronological
            tracks = await prisma.track.findMany({
                where: baseWhere,
                orderBy: { createdAt: 'desc' },
                include: {
                    artist: {
                        select: { name: true, picture: true, isVerified: true }
                    }
                }
            });
        }

        return NextResponse.json({ tracks });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Error fetching tracks' }, { status: 500 });
    }
}
