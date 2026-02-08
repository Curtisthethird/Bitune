import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyNip98Event } from '@/lib/nostr/nip98';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // Optional Auth: Check if user has purchased
        let userPubkey: string | null = null;
        const authHeader = request.headers.get('authorization');
        if (authHeader) {
            try {
                userPubkey = await verifyNip98Event(authHeader, 'GET', request.url);
            } catch (e) {
                // Ignore auth error for public read, just means user isn't verified
            }
        }

        const track = await prisma.track.findUnique({
            where: { id },
            include: {
                artist: {
                    select: {
                        name: true,
                        picture: true,
                        pubkey: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        purchases: true
                    }
                }
            }
        });

        if (!track) {
            return NextResponse.json({ error: 'Track not found' }, { status: 404 });
        }

        let hasPurchased = false;
        if (userPubkey) {
            const purchase = await prisma.purchase.findFirst({
                where: {
                    userPubkey,
                    trackId: id
                }
            });
            hasPurchased = !!purchase;
        }

        return NextResponse.json({
            ...track,
            hasPurchased
        });

    } catch (error) {
        console.error('Get Track Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
