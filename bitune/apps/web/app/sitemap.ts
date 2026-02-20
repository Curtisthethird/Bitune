import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bittune.com';

    // Base routes
    const routes = [
        '',
        '/feed',
        '/library',
        '/upload',
        '/pricing',
        '/signup',
        '/discovery/top-charts',
        '/discovery/new-releases',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    try {
        // Fetch all public tracks
        const tracks = await prisma.track.findMany({
            select: { id: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        });

        const trackRoutes = tracks.map((track) => ({
            url: `${baseUrl}/track/${track.id}`,
            lastModified: track.createdAt,
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        }));

        // Fetch all users/artists
        const users = await prisma.user.findMany({
            select: { pubkey: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
        });

        const userRoutes = users.map((user) => ({
            url: `${baseUrl}/users/${user.pubkey}`,
            lastModified: user.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }));

        // Playlists (public only)
        const playlists = await prisma.playlist.findMany({
            where: { isPublic: true },
            select: { id: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
        });

        const playlistRoutes = playlists.map((playlist) => ({
            url: `${baseUrl}/library/playlist/${playlist.id}`,
            lastModified: playlist.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.5,
        }));

        return [...routes, ...trackRoutes, ...userRoutes, ...playlistRoutes];
    } catch (e) {
        console.warn('Sitemap generation failed to connect to database. Returning static routes only.');
        return routes;
    }
}
