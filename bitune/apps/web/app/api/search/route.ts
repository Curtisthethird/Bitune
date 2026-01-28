import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    const genre = searchParams.get('genre');

    try {
        if (!query) {
            // Discovery Mode: Trending Artists and Recent Tracks
            const [tracks, artists] = await Promise.all([
                prisma.track.findMany({
                    where: genre ? { genre: { contains: genre, mode: 'insensitive' } } : {},
                    take: 12,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        artist: {
                            select: { name: true, picture: true }
                        }
                    }
                }),
                prisma.user.findMany({
                    where: { isArtist: true },
                    take: 6,
                    orderBy: { tracks: { _count: 'desc' } }
                })
            ]);
            return NextResponse.json({ tracks, artists });
        }

        const [tracks, artists] = await Promise.all([
            prisma.track.findMany({
                where: {
                    AND: [
                        {
                            OR: [
                                { title: { contains: query, mode: 'insensitive' } },
                                { description: { contains: query, mode: 'insensitive' } },
                                { genre: { contains: query, mode: 'insensitive' } },
                            ]
                        },
                        genre ? { genre: { contains: genre, mode: 'insensitive' } } : {}
                    ]
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
