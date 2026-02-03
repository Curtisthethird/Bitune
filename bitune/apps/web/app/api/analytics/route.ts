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

        const [totalSessions, totalPayouts, distinctListeners] = await Promise.all([
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
            prisma.session.groupBy({
                by: ['listenerPubkey'],
                where: { trackId: { in: trackIds } }
            })
        ]);

        // 2. Chart Data (Last 30 Days Earnings)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dailyPayouts = await prisma.payout.findMany({
            where: {
                session: { trackId: { in: trackIds } },
                status: 'COMPLETED',
                createdAt: { gte: thirtyDaysAgo }
            },
            select: {
                createdAt: true,
                amountSats: true
            }
        });

        // Group by Date
        const earningsMap = new Map<string, number>();
        // Initialize last 30 days with 0
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            earningsMap.set(dateStr, 0);
        }

        dailyPayouts.forEach(p => {
            const dateStr = p.createdAt.toISOString().split('T')[0];
            if (earningsMap.has(dateStr)) {
                earningsMap.set(dateStr, earningsMap.get(dateStr)! + p.amountSats);
            }
        });

        const chartData = Array.from(earningsMap.entries())
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // 3. Top Tracks
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
                totalSats: totalPayouts._sum.amountSats || 0,
                totalListeners: distinctListeners.length
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
