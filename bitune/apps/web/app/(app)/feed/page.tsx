'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TrackCard from '@/components/TrackCard';
import ArtistCard from '@/components/ArtistCard';

interface Section {
    id: string;
    title: string;
    subtitle: string;
    type: 'track' | 'artist';
    items: any[];
}

export default function FeedPage() {
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
                            {[1, 2, 3, 4].map(j => <TrackCard key={j} />)}
                        </div>
                    </div>
                ))}
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

            {sections.map(section => (
                <section key={section.id} className="discovery-section">
                    <div className="section-header">
                        <div>
                            <h2 className="section-title">{section.title}</h2>
                            <p className="section-subtitle">{section.subtitle}</p>
                        </div>
                        <Link href={`/search?q=${section.id}`} className="view-all">View All</Link>
                    </div>

                    <div className={section.type === 'artist' ? 'artist-grid' : 'grid-layout'}>
                        {section.items.map(item => (
                            section.type === 'artist' ? (
                                <ArtistCard key={item.pubkey} artist={item} followerCount={item._count?.followers} />
                            ) : (
                                <TrackCard key={item.id} track={item} artist={item.artist} />
                            )
                        ))}
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

