import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const artistPubkey = searchParams.get('artistPubkey');

    if (!artistPubkey) {
        return NextResponse.json({ error: 'Missing artistPubkey' }, { status: 400 });
    }

    try {
        // 1. Get all purchases for this artist's tracks
        const purchases = await prisma.purchase.findMany({
            where: {
                track: {
                    artistPubkey: artistPubkey
                }
            },
            include: {
                user: {
                    select: { name: true, picture: true, pubkey: true }
                }
            }
        });

        // 2. Get all tips for this artist
        const tips = await prisma.tip.findMany({
            where: {
                artistPubkey: artistPubkey,
                status: 'COMPLETED'
            },
            include: {
                sender: {
                    select: { name: true, picture: true, pubkey: true }
                }
            }
        });

        // 3. Aggregate support by user
        const supportMap = new Map<string, { user: any, totalSats: number, count: number }>();

        purchases.forEach(p => {
            const userId = p.userPubkey;
            const existing = supportMap.get(userId) || { user: p.user, totalSats: 0, count: 0 };
            existing.totalSats += p.amount;
            existing.count += 1;
            supportMap.set(userId, existing);
        });

        tips.forEach(t => {
            const userId = t.senderPubkey;
            const existing = supportMap.get(userId) || { user: t.sender, totalSats: 0, count: 0 };
            existing.totalSats += t.amountSats;
            existing.count += 1;
            supportMap.set(userId, existing);
        });

        // 4. Convert to array, sort, and limit
        const leaderboard = Array.from(supportMap.values())
            .sort((a, b) => b.totalSats - a.totalSats)
            .slice(0, 10);

        return NextResponse.json(leaderboard);

    } catch (error) {
        console.error('Supporters API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
