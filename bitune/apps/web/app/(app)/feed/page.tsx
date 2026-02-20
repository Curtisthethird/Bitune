'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePlayer } from '@/context/PlayerContext';
import TrackCard from '@/components/TrackCard';
import ArtistCard from '@/components/ArtistCard';
import PlaylistCard from '@/components/PlaylistCard';

interface Section {
    id: string;
    title: string;
    subtitle: string;
    type: 'track' | 'artist' | 'playlist';
    items: any[];
}

export default function FeedPage() {
    const { history } = usePlayer();
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/discovery')
            .then(r => r.json())
            .then(data => {
                if (data.sections) {
                    setSections(data.sections);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load discovery', err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="feed-page fade-in">
                <div className="skeleton-hero glass-card"></div>
                {[1, 2].map(i => (
                    <div key={i} className="section-loading">
                        <div className="skeleton-title"></div>
                        <div className="loading-grid">
                            {[1, 2, 3, 4].map(j => <div key={j} className="skeleton-card" />)}
                        </div>
                    </div>
                ))}
                <style jsx>{`
                    .skeleton-hero { height: 400px; width: 100%; margin-bottom: 4rem; background: var(--secondary); border-radius: 24px; animation: pulse 1.5s infinite; }
                    .skeleton-title { height: 2rem; width: 200px; background: var(--secondary); margin-bottom: 1.5rem; border-radius: 4px; animation: pulse 1.5s infinite; }
                    .loading-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem; }
                    .skeleton-card { aspect-ratio: 1; background: var(--secondary); border-radius: 12px; animation: pulse 1.5s infinite; }
                    @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
                `}</style>
            </div>
        );
    }

    return (
        <div className="feed-page fade-in">
            {/* Hero Billboard */}
            <section className="hero-section glass-card">
                <div className="hero-content">
                    <span className="badge">Featured</span>
                    <h1 className="hero-title">BitTune Originals</h1>
                    <p className="hero-desc">Experience the future of music on the Bitcoin social layer. Pure, uncensored, and artist-owned.</p>
                    <div className="hero-actions">
                        <button className="btn btn-primary">Listen Now</button>
                        <Link href="/upload" className="btn btn-secondary">Upload Music</Link>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="floating-sphere"></div>
                </div>
            </section>

            {/* Recently Played Section */}
            {history.length > 0 && (
                <section className="discovery-section">
                    <div className="section-header">
                        <div>
                            <h2 className="section-title">Recently Played</h2>
                            <p className="section-subtitle">Jump back in</p>
                        </div>
                    </div>
                    <div className="grid-layout">
                        {history.slice(0, 6).map((track, i) => (
                            <TrackCard key={`history-${track.id}-${i}`} track={track} artist={track.artist} />
                        ))}
                    </div>
                </section>
            )}

            {sections.map(section => (
                <section key={section.id} className="discovery-section">
                    <div className="section-header">
                        <div>
                            <h2 className="section-title">{section.title}</h2>
                            <p className="section-subtitle">{section.subtitle}</p>
                        </div>
                        {section.id !== 'curated-playlists' && <Link href={`/discovery/${section.id}`} className="view-all">View All</Link>}
                    </div>

                    <div className={section.type === 'artist' ? 'artist-grid' : 'grid-layout'}>
                        {section.items.map(item => {
                            if (section.type === 'artist') return <ArtistCard key={item.pubkey} artist={item} followerCount={item._count?.followers} />;
                            if (section.type === 'playlist') return <PlaylistCard key={item.id} playlist={item} />;
                            return <TrackCard key={item.id} track={item} artist={item.artist} />;
                        })}
                    </div>
                </section>
            ))}

            <style jsx>{`
                .feed-page {
                    padding: 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                    padding-bottom: 8rem;
                }

                .hero-section {
                    height: 400px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 4rem;
                    margin-bottom: 4rem;
                    overflow: hidden;
                    position: relative;
                    background: linear-gradient(135deg, var(--accent-dim) 0%, rgba(0,0,0,0) 100%);
                }

                .hero-content {
                    max-width: 600px;
                    z-index: 2;
                }

                .badge {
                    background: var(--accent);
                    color: black;
                    padding: 4px 12px;
                    border-radius: 100px;
                    font-size: 0.75rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    margin-bottom: 1.5rem;
                    display: inline-block;
                }

                .hero-title {
                    font-size: 3.5rem;
                    font-weight: 900;
                    margin-bottom: 1rem;
                    line-height: 1.1;
                    letter-spacing: -0.03em;
                }

                .hero-desc {
                    font-size: 1.1rem;
                    color: var(--muted);
                    margin-bottom: 2rem;
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
                }

                .floating-sphere {
                    width: 250px;
                    height: 250px;
                    background: radial-gradient(circle at 30% 30%, var(--accent), var(--accent-dim));
                    border-radius: 50%;
                    filter: blur(40px);
                    opacity: 0.5;
                    animation: float 6s ease-in-out infinite;
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-20px) scale(1.05); }
                }

                .discovery-section {
                    margin-bottom: 4rem;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 1.5rem;
                }

                .section-title {
                    font-size: 1.75rem;
                    font-weight: 800;
                    margin-bottom: 0.25rem;
                }

                .section-subtitle {
                    color: var(--muted);
                    font-size: 0.95rem;
                }

                .view-all {
                    color: var(--accent);
                    font-weight: 600;
                    font-size: 0.9rem;
                    text-decoration: none;
                }

                .view-all:hover {
                    text-decoration: underline;
                }

                .artist-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 1.5rem;
                }

                .skeleton-hero {
                    height: 400px;
                    width: 100%;
                    margin-bottom: 4rem;
                    background: var(--secondary);
                }

                .skeleton-title {
                    height: 2rem;
                    width: 300px;
                    background: var(--secondary);
                    margin-bottom: 1rem;
                }

                @media (max-width: 1024px) {
                    .hero-section {
                        padding: 2rem;
                        height: auto;
                        flex-direction: column;
                        text-align: center;
                    }
                    .hero-title {
                        font-size: 2.5rem;
                    }
                    .hero-visual {
                        display: none;
                    }
                    .hero-actions {
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
}

