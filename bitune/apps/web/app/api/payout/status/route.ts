import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const { pubkey } = await request.json();

        // Find all sessions where this pubkey is the artist of the track
        // And list payouts
        const payouts = await prisma.payout.findMany({
            where: {
                session: {
                    track: {
                        artistPubkey: pubkey
                    }
                }
            },
            include: {
                session: {
                    include: {
                        track: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ payouts });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}
