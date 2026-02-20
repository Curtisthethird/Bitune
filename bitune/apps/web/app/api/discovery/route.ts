import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // 1. New Releases (Last 12 tracks)
        const newReleases = await prisma.track.findMany({
            take: 12,
            orderBy: { createdAt: 'desc' },
            include: {
                artist: {
                    select: { name: true, picture: true, pubkey: true }
                },
                _count: {
                    select: { likes: true, sessions: true }
                }
            }
        });

        // 2. Trending Artists (Most followers or most tracks)
        const trendingArtists = await prisma.user.findMany({
            where: { isArtist: true },
            take: 6,
            orderBy: [
                { followers: { _count: 'desc' } },
                { tracks: { _count: 'desc' } }
            ],
            include: {
                _count: {
                    select: { followers: true, tracks: true }
                }
            }
        });

        // 3. Top Charts (Most played tracks)
        const topCharts = await prisma.track.findMany({
            take: 10,
            orderBy: {
                sessions: { _count: 'desc' }
            },
            include: {
                artist: {
                    select: { name: true, picture: true, pubkey: true }
                },
                _count: {
                    select: { likes: true, sessions: true }
                }
            }
        });

        // 4. Curated Playlists (Random public playlists)
        const playlists = await prisma.playlist.findMany({
            where: { isPublic: true },
            take: 4,
            orderBy: { createdAt: 'desc' },
            include: {
                owner: { select: { name: true } },
                _count: { select: { tracks: true } }
            }
        });

        return NextResponse.json({
            sections: [
                {
                    id: 'new-releases',
                    title: 'New Releases',
                    subtitle: 'The latest drops from BitTune artists',
                    type: 'track',
                    items: newReleases
                },
                {
                    id: 'curated-playlists',
                    title: 'Curated for You',
                    subtitle: 'Hand-picked collections',
                    type: 'playlist',
                    items: playlists
                },
                {
                    id: 'trending-artists',
                    title: 'Trending Artists',
                    subtitle: 'Artists making waves this week',
                    type: 'artist',
                    items: trendingArtists
                },
                {
                    id: 'top-charts',
                    title: 'Top Charts',
                    subtitle: 'Most played tracks across the platform',
                    type: 'track',
                    items: topCharts
                }
            ]
        });

    } catch (error) {
        console.error('Discovery API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
