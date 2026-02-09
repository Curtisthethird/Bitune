import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyNip98Event } from '@/lib/nostr/nip98';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const artistPubkey = await verifyNip98Event(authHeader, 'GET', request.url);

        // Fetch recent tips
        const tips = await prisma.tip.findMany({
            where: { artistPubkey, status: 'COMPLETED' },
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { sender: { select: { name: true, picture: true } } }
        });

        // Fetch recent followers
        const follows = await prisma.follow.findMany({
            where: { followingPubkey: artistPubkey },
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { follower: { select: { name: true, picture: true, pubkey: true } } }
        });

        // Fetch recent purchases
        const purchases = await prisma.purchase.findMany({
            where: { track: { artistPubkey } },
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true, picture: true } },
                track: { select: { title: true } }
            }
        });

        // Combine and sort
        const activity = [
            ...tips.map(t => ({ id: t.id, type: 'tip', amount: t.amountSats, user: t.sender, message: t.message, date: t.createdAt })),
            ...follows.map(f => ({ id: f.followerPubkey, type: 'follow', user: f.follower, date: f.createdAt })),
            ...purchases.map(p => ({ id: p.id, type: 'purchase', amount: p.amount, user: p.user, trackTitle: p.track.title, date: p.createdAt }))
        ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 15);

        return NextResponse.json({ activity });

    } catch (error) {
        console.error('Activity API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
    }
}
