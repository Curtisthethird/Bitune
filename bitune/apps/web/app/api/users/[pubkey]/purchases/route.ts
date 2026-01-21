import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ pubkey: string }> }) {
    const { pubkey } = await params;

    try {
        const purchases = await prisma.purchase.findMany({
            where: { userPubkey: pubkey },
            include: {
                track: {
                    include: {
                        artist: {
                            select: { name: true, picture: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(purchases);

    } catch (error) {
        console.error('Get Purchases Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
