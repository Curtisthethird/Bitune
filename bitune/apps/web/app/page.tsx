import { prisma } from '@/lib/prisma';
import LandingPageClient from './LandingPageClient';

// Force dynamic rendering since we show random/latest data
export const dynamic = 'force-dynamic';

export default async function Home() {
  let trendingTracks: any[] = [];
  let newReleases: any[] = [];

  try {
    const data = await Promise.all([
      // Trending: Most interactions (sessions)
      prisma.track.findMany({
        take: 6,
        orderBy: { sessions: { _count: 'desc' } },
        include: {
          artist: { select: { name: true, picture: true, pubkey: true } },
          _count: { select: { likes: true, sessions: true } }
        }
      }),
      // New Releases: Latest uploads
      prisma.track.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          artist: { select: { name: true, picture: true, pubkey: true } },
          _count: { select: { likes: true, sessions: true } }
        }
      })
    ]);
    trendingTracks = data[0];
    newReleases = data[1];
  } catch (e) {
    console.error('Failed to fetch landing page data', e);
    // Fallback to empty arrays (UI handles empty states)
  }


  // Transform Prisma data to match Track interface (null -> undefined)
  const mapTrack = (t: any) => ({
    ...t,
    artistPubkey: t.artistPubkey,
    audioUrl: t.audioUrl || undefined,
    coverUrl: t.coverUrl || undefined,
    description: t.description || undefined,
    nostrEventId: t.nostrEventId || undefined,
    genre: t.genre || undefined,
    artist: {
      name: t.artist?.name || undefined,
      picture: t.artist?.picture || undefined,
      pubkey: t.artist?.pubkey
    }
  });

  const trending = trendingTracks.map(mapTrack);
  const releases = newReleases.map(mapTrack);

  return <LandingPageClient trending={trending} releases={releases} />;
}
