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
    const q = searchParams.get('q');
    const pubkey = searchParams.get('pubkey');

    const where: any = {};

    if (pubkey) {
        where.artistPubkey = pubkey;
    }

    if (q) {
        where.OR = [
            { title: { contains: q, mode: 'insensitive' as const } },
            { artist: { name: { contains: q, mode: 'insensitive' as const } } }
        ];
    }

    const tracks = await prisma.track.findMany({
        where,
        include: { artist: true },
        orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ tracks });
}
