import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyNip98Event } from '@/lib/nostr/nip98';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const userPubkey = await verifyNip98Event(authHeader, 'GET', request.url);

        const likes = await prisma.like.findMany({
            where: { userPubkey },
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

        const tracks = likes.map(like => like.track);

        return NextResponse.json({ tracks });

    } catch (error) {
        console.error('Library API Error:', error);
        if (error instanceof Error && (error.message.includes('Authorization') || error.message.includes('Invalid'))) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
