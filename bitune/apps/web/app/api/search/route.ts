import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
        return NextResponse.json({ tracks: [], artists: [] });
    }

    try {
        const [tracks, artists] = await Promise.all([
            prisma.track.findMany({
                where: {
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                        { genre: { contains: query, mode: 'insensitive' } },
                    ],
                },
                take: 10,
                include: {
                    artist: {
                        select: { name: true, picture: true }
                    }
                }
            }),
            prisma.user.findMany({
                where: {
                    isArtist: true,
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { about: { contains: query, mode: 'insensitive' } },
                    ]
                },
                take: 5
            })
        ]);

        return NextResponse.json({ tracks, artists });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
