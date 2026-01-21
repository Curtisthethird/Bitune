import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get('trackId');

    if (!trackId) {
        return NextResponse.json({ error: 'Missing trackId' }, { status: 400 });
    }

    try {
        const purchases = await prisma.purchase.findMany({
            where: { trackId },
            include: {
                user: {
                    select: {
                        pubkey: true,
                        name: true,
                        picture: true
                    }
                }
            },
            orderBy: { amount: 'desc' }, // Top supporters first
            take: 50
        });

        // Transform to just return user info + amount
        const supporters = purchases.map(p => ({
            user: p.user,
            amount: p.amount,
            createdAt: p.createdAt
        }));

        return NextResponse.json(supporters);

    } catch (error) {
        console.error('Fetch supporters error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
