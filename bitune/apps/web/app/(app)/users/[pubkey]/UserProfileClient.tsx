'use client';

import { useEffect, useState, use } from 'react';
import FollowButton from '@/components/FollowButton';
import TipModal from '@/components/TipModal';
import { usePlayer } from '@/context/PlayerContext';
import { Track } from '@/lib/shared/types';
import SupporterBadge from '@/components/SupporterBadge';

interface UserProfile {
    pubkey: string;
    name: string | null;
    about: string | null;
    picture: string | null;
    isArtist: boolean;
    _count: {
        followers: number;
        following: number;
        tracks: number;
    }
}

interface TrackWithArtist extends Track {
    artist: { name: string; picture?: string };
}

export default function UserProfilePage({ params }: { params: Promise<{ pubkey: string }> }) {
    const { pubkey } = use(params);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [tracks, setTracks] = useState<TrackWithArtist[]>([]);
    const [supporters, setSupporters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showTipModal, setShowTipModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const { play } = usePlayer();

    useEffect(() => {
        if (pubkey) {
            fetchProfile();
            fetchTracks();
            fetchSupporters();
        }
    }, [pubkey]);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`/api/users/${pubkey}`);
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTracks = async () => {
        try {
            const res = await fetch(`/api/track?pubkey=${pubkey}`);
            if (res.ok) {
                const data = await res.json();
                setTracks(data.tracks);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSupporters = async () => {
        try {
            const res = await fetch(`/api/supporters?artistPubkey=${pubkey}`);
            if (res.ok) {
                const data = await res.json();
                setSupporters(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return (
        <div className="page-container" style={{ padding: '5rem' }}>
            <div className="glass glass-card p-10">Loading profile...</div>
        </div>
    );

    if (!profile) return (
        <div className="page-container" style={{ padding: '5rem' }}>
            <div className="glass glass-card p-10">User not found</div>
        </div>
    );

    return (
        <div className="page-container">
            {/* Immersive Header */}
            <div className="profile-hero glass-card">
                <div className="hero-background" style={{ backgroundImage: profile.picture ? `url(${profile.picture})` : 'none' }}>
                    <div className="hero-overlay"></div>
                </div>

                <div className="hero-content">
                    <div className="profile-avatar-large">
                        <img
                            src={profile.picture || '/default-avatar.png'}
                            alt={profile.name || 'User'}
                            onError={(e) => (e.target as HTMLImageElement).src = '/default-avatar.png'}
                        />
                    </div>
                    <div className="profile-info-main">
                        <div className="pubkey-badge">{pubkey.substring(0, 8)}...</div>
                        <h1 className="profile-name-large">{profile.name || 'Anonymous User'}</h1>
                        <p className="profile-bio-large">{profile.about || 'Supporting independent music on BitTune.'}</p>

                        <div className="profile-stats-dashboard">
                            <div className="stat-item">
                                <span className="stat-value">{profile._count.followers}</span>
                                <span className="stat-label">Followers</span>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <span className="stat-value">{profile._count.following}</span>
                                <span className="stat-label">Following</span>
                            </div>
                            {profile.isArtist && (
                                <>
                                    <div className="stat-divider"></div>
                                    <div className="stat-item">
                                        <span className="stat-value">{profile._count.tracks}</span>
                                        <span className="stat-label">Releases</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="profile-actions-hero">
                        <FollowButton targetPubkey={profile.pubkey} />
                        <button className="btn-secondary profile-tip-btn" onClick={() => setShowTipModal(true)}>
                            ⚡ Tip
                        </button>
                        <button className="btn-secondary share-btn-profile" onClick={handleShare}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" /></svg>
                            {copied ? 'Copied' : 'Share'}
                        </button>
                        <button className="btn-secondary message-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            {showTipModal && profile && (
                <TipModal
                    artist={{ pubkey: profile.pubkey, name: profile.name || 'Artist' }}
                    onClose={() => setShowTipModal(false)}
                />
            )}

            {/* Content Sections */}
            <div className="profile-content-grid">
                <main className="profile-main-content">
                    {profile.isArtist && (
                        <section className="discography-section">
                            <div className="section-header">
                                <h2>Discography</h2>
                                <span className="release-count">{tracks.length} Tracks</span>
                            </div>

                            <div className="track-list-premium">
                                {tracks.length === 0 ? (
                                    <div className="no-tracks">This artist haven't uploaded any tracks yet.</div>
                                ) : (
                                    tracks.map((track, index) => (
                                        <div key={track.id} className="track-row-premium" onClick={() => play(track, tracks)}>
                                            <div className="track-index">{index + 1}</div>
                                            <div className="track-art-sm">
                                                <img src={track.coverUrl || '/platinum-cd.svg'} alt={track.title} />
                                                <div className="play-overlay">▶</div>
                                            </div>
                                            <div className="track-meta">
                                                <div className="track-title-sm">{track.title}</div>
                                                <div className="track-artist-sm">{track.artist.name}</div>
                                            </div>
                                            <div className="track-actions">
                                                <button className="icon-btn">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    )}
                </main>

                <aside className="profile-sidebar">
                    {profile.isArtist && (
                        <div className="sidebar-card glass-card supporters-card mb-6">
                            <h3>Top Supporters</h3>
                            <div className="supporters-list">
                                {supporters.length === 0 ? (
                                    <div className="no-data-sm">No supporters yet. Be the first!</div>
                                ) : (
                                    supporters.map((s, i) => (
                                        <div key={s.user.pubkey} className="supporter-row">
                                            <div className="supporter-rank">
                                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                            </div>
                                            <div className="supporter-avatar-sm">
                                                <img src={s.user.picture || '/default-avatar.png'} alt={s.user.name} />
                                            </div>
                                            <div className="supporter-info-sm">
                                                <div className="supporter-name-sm">{s.user.name || 'Anonymous'}</div>
                                                <div className="supporter-amount-sm">{s.totalSats.toLocaleString()} Sats</div>
                                            </div>
                                            {i < 3 && <SupporterBadge level={i === 0 ? 'patron' : 'superfan'} />}
                                        </div>
                                    ))
                                )}
                            </div>
                            <button className="btn-text w-full mt-4 text-xs font-bold uppercase tracking-wider opacity-60 hover:opacity-100">
                                View Full Leaderboard
                            </button>
                        </div>
                    )}

                    <div className="sidebar-card glass-card">
                        <h3>About</h3>
                        <p>{profile.about || 'No additional information shared.'}</p>

                        <div className="social-links-minimal">
                            {/* Mock social links */}
                            <div className="social-item"><span className="social-label">Website</span> <span className="social-val">bittune.org</span></div>
                            <div className="social-item"><span className="social-label">Nostr</span> <span className="social-val">npub1...</span></div>
                        </div>
                    </div>
                </aside>
            </div>

            <style jsx>{`
                .page-container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 2rem;
                    padding-bottom: 120px;
                }

                .profile-hero {
                    position: relative;
                    height: 480px;
                    display: flex;
                    align-items: flex-end;
                    padding: 3rem;
                    margin-bottom: 3rem;
                    overflow: hidden;
                    border: none;
                }

                .hero-background {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-size: cover;
                    background-position: center;
                    filter: blur(40px) brightness(0.6);
                    transform: scale(1.1);
                    z-index: 0;
                }

                .hero-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%);
                }

                .hero-content {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    align-items: flex-end;
                    gap: 3rem;
                    width: 100%;
                }

                .profile-avatar-large {
                    width: 240px;
                    height: 240px;
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.8);
                    border: 4px solid rgba(255,255,255,0.1);
                    flex-shrink: 0;
                }

                .profile-avatar-large img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .profile-info-main {
                    flex: 1;
                    padding-bottom: 1rem;
                }

                .pubkey-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    background: var(--accent);
                    color: #000;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 800;
                    margin-bottom: 1rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }

                .profile-name-large {
                    font-size: 4.5rem;
                    font-weight: 900;
                    letter-spacing: -0.02em;
                    margin-bottom: 1rem;
                    line-height: 1;
                }

                .profile-bio-large {
                    font-size: 1.1rem;
                    color: rgba(255,255,255,0.8);
                    max-width: 600px;
                    margin-bottom: 2rem;
                }

                .profile-stats-dashboard {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                    background: rgba(255,255,255,0.05);
                    backdrop-filter: blur(10px);
                    padding: 1rem 2rem;
                    border-radius: 16px;
                    width: fit-content;
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .stat-item {
                    display: flex;
                    flex-direction: column;
                }

                .stat-value {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: var(--accent);
                }

                .stat-label {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--muted);
                }

                .stat-divider {
                    width: 1px;
                    height: 30px;
                    background: rgba(255,255,255,0.1);
                }

                .profile-actions-hero {
                    display: flex;
                    gap: 1rem;
                    padding-bottom: 1rem;
                }

                .message-btn {
                    width: 48px;
                    height: 48px;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                }

                .btn-secondary {
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: #fff;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-secondary:hover {
                    background: rgba(255,255,255,0.2);
                }

                .profile-tip-btn {
                    padding: 0 1.5rem;
                    height: 48px;
                    border-radius: 24px;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--accent) !important;
                    border-color: var(--accent-dim) !important;
                }

                .profile-tip-btn:hover {
                    background: var(--accent) !important;
                    color: #000 !important;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(247, 147, 26, 0.4);
                }

                .share-btn-profile {
                    padding: 0 1.5rem;
                    height: 48px;
                    border-radius: 24px;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    min-width: 100px;
                }

                /* Content Grid */
                .profile-content-grid {
                    display: grid;
                    grid-template-columns: 1fr 350px;
                    gap: 3rem;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }

                .section-header h2 {
                    font-size: 1.75rem;
                    font-weight: 800;
                }

                .release-count {
                    color: var(--muted);
                    font-size: 0.9rem;
                }

                .track-list-premium {
                    display: flex;
                    flex-direction: column;
                }

                .track-row-premium {
                    display: flex;
                    align-items: center;
                    padding: 1rem;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: 1px solid transparent;
                }

                .track-row-premium:hover {
                    background: rgba(255,255,255,0.05);
                    border-color: rgba(247, 147, 26, 0.2);
                }

                .track-index {
                    width: 30px;
                    color: var(--muted);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.9rem;
                }

                .track-art-sm {
                    position: relative;
                    width: 48px;
                    height: 48px;
                    border-radius: 6px;
                    overflow: hidden;
                    margin-right: 1.5rem;
                }

                .track-art-sm img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .play-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.2s;
                    font-size: 1.2rem;
                }

                .track-row-premium:hover .play-overlay {
                    opacity: 1;
                }

                .track-meta {
                    flex: 1;
                }

                .track-title-sm {
                    font-weight: 700;
                    font-size: 1rem;
                    margin-bottom: 2px;
                }

                .track-artist-sm {
                    font-size: 0.85rem;
                    color: var(--muted);
                }

                .icon-btn {
                    background: transparent;
                    border: none;
                    color: var(--muted);
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 50%;
                    transition: all 0.2s;
                }

                .icon-btn:hover {
                    color: var(--accent);
                    background: rgba(247, 147, 26, 0.1);
                }

                .sidebar-card {
                    padding: 2rem;
                }

                .sidebar-card h3 {
                    font-size: 1.25rem;
                    margin-bottom: 1rem;
                    color: var(--accent);
                    font-weight: 800;
                }

                .sidebar-card p {
                    color: var(--muted);
                    font-size: 0.95rem;
                    line-height: 1.6;
                    margin-bottom: 1.5rem;
                }

                .social-links-minimal {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .social-item {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.85rem;
                }

                .social-label {
                    color: var(--muted);
                }

                .social-val {
                    color: #fff;
                    font-weight: 600;
                }

                .supporters-card h3 {
                    margin-bottom: 1.5rem !important;
                }

                .supporters-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .supporter-row {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.5rem;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.02);
                    transition: all 0.2s;
                }

                .supporter-row:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                .supporter-rank {
                    width: 24px;
                    font-size: 0.8rem;
                    font-weight: 800;
                    color: var(--muted);
                }

                .supporter-avatar-sm {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .supporter-avatar-sm img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .supporter-info-sm {
                    flex: 1;
                }

                .supporter-name-sm {
                    font-size: 0.85rem;
                    font-weight: 700;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .supporter-amount-sm {
                    font-size: 0.7rem;
                    color: var(--muted);
                }

                .no-data-sm {
                    text-align: center;
                    font-size: 0.85rem;
                    color: var(--muted);
                    padding: 2rem 0;
                    font-style: italic;
                }

                .btn-text {
                    background: transparent;
                    border: none;
                    color: var(--accent);
                    cursor: pointer;
                    font-size: 0.75rem;
                }

                @media (max-width: 1100px) {
                    .profile-content-grid {
                        grid-template-columns: 1fr;
                    }

                    .profile-avatar-large {
                        width: 180px;
                        height: 180px;
                    }
                    
                    .profile-name-large {
                        font-size: 3rem;
                    }
                }

                @media (max-width: 768px) {
                    .page-container {
                        padding: 1rem;
                    }
                    
                    .profile-hero {
                        height: auto;
                        padding: 2rem 1.5rem;
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                    }

                    .hero-content {
                        flex-direction: column;
                        align-items: center;
                        gap: 1.5rem;
                    }

                    .profile-avatar-large {
                        width: 140px;
                        height: 140px;
                    }

                    .profile-name-large {
                        font-size: 2.25rem;
                    }

                    .profile-stats-dashboard {
                        gap: 1rem;
                        padding: 0.75rem 1.25rem;
                    }
                }
            `}</style>
        </div>
    );
}
