import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyNip98Event } from '@/lib/nostr/nip98';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const artistPubkey = await verifyNip98Event(authHeader, 'GET', request.url);

        // Fetch User to check if artist
        const user = await prisma.user.findUnique({
            where: { pubkey: artistPubkey },
            select: { isArtist: true }
        });

        if (!user || !user.isArtist) {
            return NextResponse.json({ error: 'Artist profile required' }, { status: 403 });
        }

        // 1. Get all tracks by this artist
        const tracks = await prisma.track.findMany({
            where: { artistPubkey },
            select: { id: true }
        });
        const trackIds = tracks.map(t => t.id);

        // 2. Aggregate Payouts (PoE), Purchases, and Tips by Fan
        const [payouts, purchases, tips] = await Promise.all([
            prisma.payout.findMany({
                where: {
                    session: { trackId: { in: trackIds } },
                    status: 'COMPLETED'
                },
                include: {
                    session: {
                        select: { listenerPubkey: true }
                    }
                }
            }),
            prisma.purchase.findMany({
                where: { trackId: { in: trackIds } },
                include: {
                    user: {
                        select: { pubkey: true, name: true, picture: true }
                    }
                }
            }),
            prisma.tip.findMany({
                where: { artistPubkey, status: 'COMPLETED' },
                include: {
                    sender: {
                        select: { pubkey: true, name: true, picture: true }
                    }
                }
            })
        ]);

        const fanMap = new Map<string, {
            pubkey: string,
            name: string | null,
            picture: string | null,
            totalSupport: number,
            purchaseCount: number,
            tipCount: number,
            poeCount: number,
            lastActive: Date
        }>();

        // Helper to get fan info from User record (needed for PoE fans who might not have tipped/purchased)
        const getFan = async (pubkey: string) => {
            if (fanMap.has(pubkey)) return fanMap.get(pubkey)!;
            const fanUser = await prisma.user.findUnique({
                where: { pubkey },
                select: { pubkey: true, name: true, picture: true }
            });
            const data = {
                pubkey,
                name: fanUser?.name || null,
                picture: fanUser?.picture || null,
                totalSupport: 0,
                purchaseCount: 0,
                tipCount: 0,
                poeCount: 0,
                lastActive: new Date(0)
            };
            fanMap.set(pubkey, data);
            return data;
        };

        // Process Purchases (High visibility)
        purchases.forEach(p => {
            const fan = fanMap.get(p.userPubkey) || {
                pubkey: p.userPubkey,
                name: p.user.name,
                picture: p.user.picture,
                totalSupport: 0,
                purchaseCount: 0,
                tipCount: 0,
                poeCount: 0,
                lastActive: p.createdAt
            };
            fan.totalSupport += p.amount;
            fan.purchaseCount += 1;
            if (p.createdAt > fan.lastActive) fan.lastActive = p.createdAt;
            fanMap.set(p.userPubkey, fan);
        });

        // Process Tips
        tips.forEach(t => {
            const fan = fanMap.get(t.senderPubkey) || {
                pubkey: t.senderPubkey,
                name: t.sender.name,
                picture: t.sender.picture,
                totalSupport: 0,
                purchaseCount: 0,
                tipCount: 0,
                poeCount: 0,
                lastActive: t.createdAt
            };
            fan.totalSupport += t.amountSats;
            fan.tipCount += 1;
            if (t.createdAt > fan.lastActive) fan.lastActive = t.createdAt;
            fanMap.set(t.senderPubkey, fan);
        });

        // Process PoE (Streaming support)
        // This is more expensive but adds depth to FRM
        payouts.forEach(p => {
            const pubkey = p.session.listenerPubkey;
            const fan = fanMap.get(pubkey) || {
                pubkey: pubkey,
                name: null, // Will fill in post-processing or fetch if common
                picture: null,
                totalSupport: 0,
                purchaseCount: 0,
                tipCount: 0,
                poeCount: 0,
                lastActive: p.createdAt
            };
            fan.totalSupport += p.amountSats;
            fan.poeCount += 1;
            if (p.createdAt > fan.lastActive) fan.lastActive = p.createdAt;
            fanMap.set(pubkey, fan);
        });

        // Finalize: Fetch missing fan names/pictures for pure listeners
        const fans = Array.from(fanMap.values());
        const missingInfoPubkeys = fans.filter(f => f.name === null).map(f => f.pubkey);

        if (missingInfoPubkeys.length > 0) {
            const missingUsers = await prisma.user.findMany({
                where: { pubkey: { in: missingInfoPubkeys } },
                select: { pubkey: true, name: true, picture: true }
            });
            missingUsers.forEach(u => {
                const fan = fanMap.get(u.pubkey);
                if (fan) {
                    fan.name = u.name;
                    fan.picture = u.picture;
                }
            });
        }

        const sortedFans = Array.from(fanMap.values())
            .sort((a, b) => b.totalSupport - a.totalSupport);

        return NextResponse.json(sortedFans);

    } catch (error) {
        console.error('Artist Fans API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
