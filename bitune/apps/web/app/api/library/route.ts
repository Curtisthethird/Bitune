import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyNip98Event } from '@/lib/nostr/nip98';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'likes';

        const authHeader = request.headers.get('Authorization');
        const userPubkey = await verifyNip98Event(authHeader, 'GET', request.url);

        if (type === 'purchases') {
            const purchases = await prisma.purchase.findMany({
                where: { userPubkey },
                include: {
                    track: {
                        include: {
                            artist: {
                                select: { name: true, picture: true, pubkey: true }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            const tracks = purchases.map(p => p.track);
            return NextResponse.json({ tracks });
        }

        // Default: likes
        const likes = await prisma.like.findMany({
            where: { userPubkey },
            include: {
                track: {
                    include: {
                        artist: {
                            select: { name: true, picture: true, pubkey: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const tracks = likes.map(like => like.track);
        return NextResponse.json({ tracks });

    } catch (error) {
        console.error('Library API Error:', error);
        if (error instanceof Error && (error.message.includes('Authorization') || error.message.includes('Invalid'))) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
