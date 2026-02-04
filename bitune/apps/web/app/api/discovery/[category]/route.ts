import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ category: string }> }
) {
    const { category } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    try {
        let items = [];
        let total = 0;
        let title = '';
        let subtitle = '';
        let type = 'track';

        switch (category) {
            case 'new-releases':
                title = 'New Releases';
                subtitle = 'Fresh drops from the community';
                type = 'track';
                [items, total] = await Promise.all([
                    prisma.track.findMany({
                        take: limit,
                        skip: skip,
                        orderBy: { createdAt: 'desc' },
                        include: {
                            artist: {
                                select: { name: true, picture: true, pubkey: true }
                            },
                            _count: { select: { likes: true, sessions: true } }
                        }
                    }),
                    prisma.track.count()
                ]);
                break;

            case 'trending-artists':
                title = 'Trending Artists';
                subtitle = 'Artists making waves right now';
                type = 'artist';
                [items, total] = await Promise.all([
                    prisma.user.findMany({
                        where: { isArtist: true },
                        take: limit,
                        skip: skip,
                        orderBy: { followers: { _count: 'desc' } },
                        include: {
                            _count: { select: { followers: true, tracks: true } }
                        }
                    }),
                    prisma.user.count({ where: { isArtist: true } })
                ]);
                break;

            case 'top-charts':
                title = 'Top Charts';
                subtitle = 'Most played tracks on BitTune';
                type = 'track';
                [items, total] = await Promise.all([
                    prisma.track.findMany({
                        take: limit,
                        skip: skip,
                        orderBy: { sessions: { _count: 'desc' } },
                        include: {
                            artist: {
                                select: { name: true, picture: true, pubkey: true }
                            },
                            _count: { select: { likes: true, sessions: true } }
                        }
                    }),
                    prisma.track.count()
                ]);
                break;

            default:
                return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
        }

        return NextResponse.json({
            items,
            pagination: {
                page,
                limit,
                total,
                hasMore: skip + items.length < total
            },
            meta: {
                title,
                subtitle,
                type
            }
        });

    } catch (error) {
        console.error('Discovery Category API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
