import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyNip98Event } from '@/lib/nostr/nip98';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const userPubkey = await verifyNip98Event(authHeader, 'GET', request.url);

        // Fetch User to check if artist
        const user = await prisma.user.findUnique({
            where: { pubkey: userPubkey },
            select: { isArtist: true }
        });

        if (!user || !user.isArtist) {
            return NextResponse.json({ error: 'Artist profile required' }, { status: 403 });
        }

        // 1. Total Stats
        // Get all tracks by this artist
        const tracks = await prisma.track.findMany({
            where: { artistPubkey: userPubkey },
            select: { id: true, title: true }
        });
        const trackIds = tracks.map(t => t.id);

        if (trackIds.length === 0) {
            return NextResponse.json({
                stats: { totalStreams: 0, totalSats: 0, totalListeners: 0 },
                chartData: [],
                topTracks: []
            });
        }

        const [totalSessions, totalPayouts, totalPurchases, totalTips, distinctListeners] = await Promise.all([
            prisma.session.count({
                where: { trackId: { in: trackIds } }
            }),
            prisma.payout.aggregate({
                where: {
                    session: { trackId: { in: trackIds } },
                    status: 'COMPLETED'
                },
                _sum: { amountSats: true }
            }),
            prisma.purchase.aggregate({
                where: { trackId: { in: trackIds } },
                _sum: { amount: true }
            }),
            prisma.tip.aggregate({
                where: { artistPubkey: userPubkey, status: 'COMPLETED' },
                _sum: { amountSats: true }
            }),
            prisma.session.groupBy({
                by: ['listenerPubkey'],
                where: { trackId: { in: trackIds } }
            })
        ]);

        const poeEarnings = totalPayouts._sum.amountSats || 0;
        const purchaseEarnings = totalPurchases._sum.amount || 0;
        const tipEarnings = totalTips._sum.amountSats || 0;
        const totalSats = poeEarnings + purchaseEarnings + tipEarnings;

        // 2. Chart Data (Last 30 Days Earnings - Combined)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [payouts, purchases, tips] = await Promise.all([
            prisma.payout.findMany({
                where: {
                    session: { trackId: { in: trackIds } },
                    status: 'COMPLETED',
                    createdAt: { gte: thirtyDaysAgo }
                },
                select: { createdAt: true, amountSats: true }
            }),
            prisma.purchase.findMany({
                where: {
                    trackId: { in: trackIds },
                    createdAt: { gte: thirtyDaysAgo }
                },
                select: { createdAt: true, amount: true }
            }),
            prisma.tip.findMany({
                where: {
                    artistPubkey: userPubkey,
                    status: 'COMPLETED',
                    createdAt: { gte: thirtyDaysAgo }
                },
                select: { createdAt: true, amountSats: true }
            })
        ]);

        // Group everything by Date
        const earningsMap = new Map<string, number>();
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            earningsMap.set(dateStr, 0);
        }

        payouts.forEach(p => {
            const dateStr = p.createdAt.toISOString().split('T')[0];
            if (earningsMap.has(dateStr)) earningsMap.set(dateStr, earningsMap.get(dateStr)! + p.amountSats);
        });
        purchases.forEach(p => {
            const dateStr = p.createdAt.toISOString().split('T')[0];
            if (earningsMap.has(dateStr)) earningsMap.set(dateStr, earningsMap.get(dateStr)! + p.amount);
        });
        tips.forEach(t => {
            const dateStr = t.createdAt.toISOString().split('T')[0];
            if (earningsMap.has(dateStr)) earningsMap.set(dateStr, earningsMap.get(dateStr)! + t.amountSats);
        });

        const chartData = Array.from(earningsMap.entries())
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // 3. Top Tracks (By Streams)
        const sessionsByTrack = await prisma.session.groupBy({
            by: ['trackId'],
            where: { trackId: { in: trackIds } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5
        });

        const topTracks = sessionsByTrack.map(s => {
            const track = tracks.find(t => t.id === s.trackId);
            return {
                id: s.trackId,
                title: track?.title || 'Unknown',
                plays: s._count.id
            };
        });

        return NextResponse.json({
            stats: {
                totalStreams: totalSessions,
                totalSats: totalSats,
                totalListeners: distinctListeners.length,
                breakdown: {
                    poe: poeEarnings,
                    sales: purchaseEarnings,
                    tips: tipEarnings
                }
            },
            chartData,
            topTracks
        });

    } catch (error) {
        console.error('Analytics API Error:', error);
        if (error instanceof Error && (error.message.includes('Authorization') || error.message.includes('Invalid'))) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
