import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import TrackCard from '@/components/TrackCard';

// Force dynamic rendering since we show random/latest data
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch data directly on the server
  const [trendingTracks, newReleases] = await Promise.all([
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

  return (
    <div className="home-page fade-in">
      {/* Hero Section */}
      <section className="hero-section glass-card">
        <div className="hero-content">
          <div className="hero-badge">Featured Artist</div>
          <h1 className="hero-title">
            The Future of <span className="text-gradient">Sound</span>
          </h1>
          <p className="hero-subtitle">
            Experience music streaming powered by Bitcoin. Support specific artists directly and earn rewards for your engagement.
          </p>
          <div className="hero-actions">
            <Link href="/feed" className="btn btn-primary">Start Listening</Link>
            <Link href="/upload" className="btn btn-secondary">Upload Music</Link>
          </div>
        </div>
        <div className="hero-visual">
          {/* Abstract visual or featured art */}
          <div className="visual-circle"></div>
        </div>
      </section>

      {/* Trending Section */}
      <section>
        <div className="section-header">
          <h2 className="section-title">Trending Now <span className="text-gradient-subtle">🔥</span></h2>
          <Link href="/discovery/top-charts" className="see-all">See All</Link>
        </div>
        <div className="grid-layout">
          {trending.length > 0 ? (
            trending.map((track, i) => (
              <TrackCard key={track.id} track={track} index={i} artist={track.artist} />
            ))
          ) : (
            <div className="empty-state">No trending tracks yet. Be the first to upload!</div>
          )}
        </div>
      </section>

      {/* New Releases Section */}
      <section>
        <div className="section-header">
          <h2 className="section-title">New Releases <span className="text-gradient-subtle">✨</span></h2>
          <Link href="/discovery/new-releases" className="see-all">See All</Link>
        </div>
        <div className="grid-layout">
          {releases.length > 0 ? (
            releases.map((track, i) => (
              <TrackCard key={`new-${track.id}`} track={track} index={i} artist={track.artist} />
            ))
          ) : (
            <div className="empty-state">No new releases.</div>
          )}
        </div>
      </section>
    </div>
  );
}
