'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import PurchaseModal from '@/components/PurchaseModal';
import { Track } from '@/lib/shared/types';

interface Supporter {
    user: {
        pubkey: string;
        name: string | null;
        picture: string | null;
    };
    amount: number;
}

export default function ReleasePage({ params }: { params: Promise<{ trackId: string }> }) {
    const { trackId } = use(params);
    const [track, setTrack] = useState<Track & { artist: { name: string; picture: string } } | null>(null);
    const [supporters, setSupporters] = useState<Supporter[]>([]);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (trackId) {
            Promise.all([fetchTrack(), fetchSupporters()]).finally(() => setLoading(false));
        }
    }, [trackId]);

    const fetchTrack = async () => {
        try {
            // Reusing the existing track fetch logic or similar. For now, let's assume we can fetch via search/specific ID endpoint.
            // But we don't have a direct /api/tracks/[id] yet? Wait, we might not.
            // Let's implement a quick fetch via existing means or mock.
            // Ideally we should have a GET /api/tracks/[id].
            // I'll search for it first. If not, I'll mock or create quickly.
            // Actually, let's just fetch from /api/search?q=id if smart enough, otherwise we need an endpoint.
            // I'll create strict fetch below assuming we make the endpoint or reusing specific logic.
            // Wait, we have prisma, but this run in client.
            // Let's create `GET /api/tracks/[id]` if it doesn't exist? 
            // Better: use the one used for search but filtered? No.
            // Creating a simple fetcher here for now, anticipating we might need to add the route.
            const res = await fetch(`/api/tracks/${trackId}`);
            if (res.ok) {
                setTrack(await res.json());
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchSupporters = async () => {
        try {
            const res = await fetch(`/api/supporters?trackId=${trackId}`);
            if (res.ok) {
                setSupporters(await res.json());
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="loading-screen">Loading The Drop...</div>;
    if (!track) return <div className="error-screen">Release not found.</div>;

    return (
        <div className="release-page">
            {/* Hero Section */}
            <div className="hero-section">
                <div className="hero-bg" style={{ backgroundImage: `url(${track.coverUrl || '/platinum-cd.svg'})` }}></div>
                <div className="hero-content">
                    <div className="hero-art">
                        <img src={track.coverUrl || '/platinum-cd.svg'} alt={track.title} />
                    </div>
                    <div className="hero-details">
                        <div className="label-badge">EXCLUSIVE DROP</div>
                        <h1 className="hero-title">{track.title}</h1>
                        <h2 className="hero-artist">
                            <Link href={`/users/${track.artistPubkey}`}>
                                {track.artist?.name || 'Unknown Artist'}
                            </Link>
                        </h2>

                        <div className="cta-container">
                            <button className="buy-btn" onClick={() => setShowPurchaseModal(true)}>
                                Collect Now <span className="price-tag">from {(track as any).price || 1000} sats</span>
                            </button>
                            <div className="countdown">
                                Available Now
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Supporters Grid */}
            <div className="supporters-section">
                <h3>Top Collectors</h3>
                <div className="supporters-grid">
                    {supporters.length === 0 ? (
                        <div className="empty-state">Be the first to collect this drop!</div>
                    ) : supporters.map((s, i) => (
                        <div key={i} className="supporter-card">
                            <div className="supporter-avatar">
                                <img src={s.user.picture || '/default-avatar.png'} alt={s.user.name || 'User'} />
                            </div>
                            <div className="supporter-info">
                                <span className="supporter-name">{s.user.name || 'Anonymous'}</span>
                                <span className="supporter-amount">💎 {s.amount}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showPurchaseModal && (
                <PurchaseModal
                    track={{
                        ...track,
                        price: (track as any).price || 1000,
                        artist: { name: track.artist?.name }
                    }}
                    onClose={() => setShowPurchaseModal(false)}
                    onSuccess={fetchSupporters} // Refresh supporters list
                />
            )}

            <style jsx>{`
                .release-page {
                    min-height: 100vh;
                    background: #000;
                    color: #fff;
                    padding-bottom: 96px; /* Player clearance */
                }
                .hero-section {
                    position: relative;
                    min-height: 80vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                .hero-bg {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-size: cover;
                    background-position: center;
                    filter: blur(80px) brightness(0.3);
                    z-index: 1;
                }
                .hero-content {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    align-items: center;
                    gap: 4rem;
                    max-width: 1200px;
                    width: 100%;
                    padding: 2rem;
                }
                .hero-art {
                    width: 400px;
                    height: 400px;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    transform: rotate(-2deg);
                    animation: float 6s ease-in-out infinite;
                }
                .hero-art img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(-2deg); }
                    50% { transform: translateY(-20px) rotate(-1deg); }
                }
                .hero-details {
                    flex: 1;
                }
                .label-badge {
                    background: var(--accent);
                    color: #000;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-weight: 800;
                    display: inline-block;
                    margin-bottom: 1rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-size: 0.8rem;
                }
                .hero-title {
                    font-size: 4rem;
                    font-weight: 900;
                    line-height: 1;
                    margin-bottom: 1rem;
                    text-shadow: 0 0 20px rgba(255,255,255,0.2);
                }
                .hero-artist {
                    font-size: 1.5rem;
                    color: var(--muted);
                    font-weight: 500;
                    margin-bottom: 3rem;
                }
                .hero-artist a:hover {
                    color: #fff;
                    text-decoration: underline;
                }
                .buy-btn {
                    background: linear-gradient(135deg, #fff, #ddd);
                    color: #000;
                    border: none;
                    padding: 1.2rem 3rem;
                    font-size: 1.2rem;
                    font-weight: 800;
                    border-radius: 50px;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                    box-shadow: 0 0 20px rgba(255,255,255,0.2);
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .buy-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 0 40px rgba(255,255,255,0.4);
                }
                .price-tag {
                    font-size: 0.9rem;
                    font-weight: 400;
                    opacity: 0.7;
                    border-left: 1px solid rgba(0,0,0,0.2);
                    padding-left: 1rem;
                }
                .countdown {
                    margin-top: 1rem;
                    font-family: monospace;
                    color: var(--accent);
                    font-size: 1.1rem;
                }
                
                .supporters-section {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 4rem 2rem;
                    z-index: 2;
                    position: relative;
                }
                .supporters-section h3 {
                    font-size: 1.5rem;
                    margin-bottom: 2rem;
                    border-bottom: 1px solid var(--border);
                    padding-bottom: 1rem;
                }
                .supporters-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 2rem;
                }
                .supporter-card {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    background: rgba(255,255,255,0.03);
                    padding: 1rem;
                    border-radius: 12px;
                    border: 1px solid transparent;
                    transition: border 0.3s;
                }
                .supporter-card:hover {
                    border-color: var(--accent);
                }
                .supporter-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    overflow: hidden;
                    background: var(--secondary);
                }
                .supporter-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .supporter-info {
                    display: flex;
                    flex-direction: column;
                }
                .supporter-name {
                    font-weight: 700;
                    font-size: 0.9rem;
                }
                .supporter-amount {
                    font-size: 0.8rem;
                    color: var(--muted);
                }
                .empty-state {
                    color: var(--muted);
                    font-style: italic;
                }

                @media (max-width: 768px) {
                    .hero-content {
                        flex-direction: column;
                        text-align: center;
                        gap: 2rem;
                        padding-top: 6rem;
                    }
                    .hero-art {
                        width: 250px;
                        height: 250px;
                    }
                    .hero-title {
                        font-size: 2.5rem;
                    }
                    .buy-btn {
                         width: 100%;
                         justify-content: center;
                    }
                }
                
                .loading-screen, .error-screen {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    color: var(--muted);
                }
            `}</style>
        </div>
    );
}
