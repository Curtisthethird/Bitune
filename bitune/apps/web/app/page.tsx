'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
// Styles moved to globals.css
import TrackCard from '@/components/TrackCard';
import { Track } from '@shared/types';

// Extended Track type for API response which might include 'artist' object
interface ApiTrack extends Track {
  artist: {
    name?: string;
    picture?: string;
  };
}

export default function Home() {
  const [trendingTracks, setTrendingTracks] = useState<ApiTrack[]>([]);
  const [newReleases, setNewReleases] = useState<ApiTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch tracks from API
    fetch('/api/track')
      .then(res => res.json())
      .then(data => {
        if (data.tracks) {
          // Ideally backend handles sorting, for now we manipulate client side or just show same list
          setTrendingTracks(data.tracks.slice(0, 5));
          setNewReleases(data.tracks.slice(0, 5)); // In real app, separate endpoint
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch tracks', err);
        setLoading(false);
      });
  }, []);

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
            <button className="btn btn-secondary">Learn More</button>
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
          <Link href="/feed" className="see-all">See All</Link>
        </div>
        <div className="grid-layout">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <TrackCard key={i} />)
          ) : trendingTracks.length > 0 ? (
            trendingTracks.map((track, i) => (
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
          <Link href="/feed" className="see-all">See All</Link>
        </div>
        <div className="grid-layout">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <TrackCard key={`new-skel-${i}`} />)
          ) : newReleases.length > 0 ? (
            newReleases.map((track, i) => (
              <TrackCard key={`new-${track.id}`} track={track} index={i} artist={track.artist} />
            ))
          ) : (
            <div className="empty-state">No new releases.</div>
          )}
        </div>
      </section>

      <style jsx>{`
        .fade-in {
            animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .hero-section {
          padding: 4rem;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 400px;
        }

        .hero-content {
          z-index: 2;
          max-width: 600px;
        }

        .hero-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            background: rgba(247, 147, 26, 0.1);
            color: var(--accent);
            border-radius: var(--radius-full);
            font-size: 0.75rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            border: 1px solid rgba(247, 147, 26, 0.2);
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          letter-spacing: -0.03em;
        }

        .hero-subtitle {
          color: var(--muted);
          font-size: 1.1rem;
          margin-bottom: 2.5rem;
          line-height: 1.6;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
        }

        .hero-visual {
            position: relative;
            width: 300px;
            height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .visual-circle {
            width: 200px;
            height: 200px;
            background: linear-gradient(135deg, var(--accent), #ff0055);
            border-radius: 50%;
            filter: blur(60px);
            opacity: 0.4;
            animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
            0% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-20px) scale(1.1); }
            100% { transform: translateY(0px) scale(1); }
        }
        
        @media (max-width: 768px) {
            .hero-section {
                padding: 2rem;
                flex-direction: column;
                text-align: center;
            }
            .hero-content {
                align-items: center;
                display: flex;
                flex-direction: column;
            }
            .hero-actions {
                justify-content: center;
            }
            .hero-title {
                font-size: 2.5rem;
            }
            .hero-visual {
                display: none;
            }
        }
      `}</style>
    </div>
  );
}
