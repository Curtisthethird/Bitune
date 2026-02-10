'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Track } from '@/lib/shared/types';
import { usePlayer } from '@/context/PlayerContext';
import { NostrSigner } from '@/lib/nostr/signer';
import { KeyManager } from '@/lib/nostr/key-manager';
import AddToPlaylistModal from './AddToPlaylistModal';
import PurchaseModal from './PurchaseModal';

interface TrackCardProps {
    track?: Track; // Optional for placeholder/skeleton
    index?: number;
    artist?: { name?: string; picture?: string; isVerified?: boolean };
}

export default function TrackCard({ track, index, artist }: TrackCardProps) {
    const { play, currentTrack, isPlaying } = usePlayer();
    const [isLiked, setIsLiked] = useState(false); // Local state for MVP (would sync via context in prod)
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);

    // If no track provided, show loading skeleton
    if (!track) {
        return (
            <div className="track-card skeleton">
                <div className="card-image-wrapper skeleton-pulse"></div>
                <div className="skeleton-text skeleton-pulse" style={{ width: '80%', height: '14px', marginBottom: '8px' }}></div>
                <div className="skeleton-text skeleton-pulse" style={{ width: '50%', height: '12px' }}></div>
            </div>
        );
    }

    const artistName = artist?.name || 'Unknown Artist';
    const isCurrent = currentTrack?.id === track.id;
    const isActive = isCurrent && isPlaying;

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent playing when clicking heart
        const session = KeyManager.getSession();
        if (!session) {
            alert('Please login/signup to like tracks');
            return;
        }

        const newLikedState = !isLiked;
        setIsLiked(newLikedState); // Optimistic update

        try {
            const event = {
                kind: 27235,
                created_at: Math.floor(Date.now() / 1000),
                tags: [['u', window.location.origin + '/api/likes'], ['method', 'POST']],
                content: ''
            };
            const signedEvent = await NostrSigner.sign(event);
            const token = btoa(JSON.stringify(signedEvent));

            const res = await fetch('/api/likes', {
                method: 'POST',
                headers: {
                    'Authorization': `Nostr ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ trackId: track.id })
            });

            if (!res.ok) throw new Error('Failed to like');
        } catch (err) {
            console.error('Like failed', err);
            setIsLiked(!newLikedState); // Revert
            alert('Failed to update like status');
        }
    };

    const openPlaylistModal = (e: React.MouseEvent) => {
        e.stopPropagation();
        const session = KeyManager.getSession();
        if (!session) {
            alert('Please login/signup to create playlists');
            return;
        }
        setShowPlaylistModal(true);
    };

    return (
        <div className="track-card glass-card">
            <div
                className="card-image-wrapper"
                onClick={() => play(track)}
                style={{ cursor: 'pointer' }}
            >
                <div className="card-image-placeholder">
                    <img
                        src={track.coverUrl || '/platinum-cd.svg'}
                        alt={track.title}
                        className="main-art"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = '/platinum-cd.svg';
                        }}
                    />
                </div>
                <div className={`play-overlay ${isActive ? 'active' : ''}`}>
                    <span className="play-icon">{isActive ? '⏸' : '▶'}</span>
                </div>
                {track.hasPurchased && (
                    <div className="owned-badge" title="You own this track">
                        💎
                    </div>
                )}
            </div>
            <div className="card-content">
                <div className="track-info-text">
                    <div className="card-title" title={track.title}>{track.title}</div>
                    <div className="card-artist">
                        <Link href={`/users/${track.artistPubkey}`} onClick={(e) => e.stopPropagation()} className="artist-link">
                            {artistName}
                        </Link>
                        {artist?.isVerified && (
                            <span className="verified-dot" title="Verified Artist" />
                        )}
                    </div>
                </div>
                <div className="card-actions">
                    <button
                        className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
                        onClick={handleLike}
                        title="Favorite"
                    >
                        ♥
                    </button>
                    {!track.hasPurchased && track.price && track.price > 0 && (
                        <button
                            className="action-btn purchase-trigger"
                            onClick={(e) => { e.stopPropagation(); setShowPurchaseModal(true); }}
                            title={`Unlock for ${track.price} Sats`}
                        >
                            ⚡
                        </button>
                    )}
                </div>
            </div>

            {showPlaylistModal && (
                <AddToPlaylistModal
                    trackId={track.id}
                    onClose={() => setShowPlaylistModal(false)}
                />
            )}

            {showPurchaseModal && (
                <PurchaseModal
                    track={{
                        ...track,
                        price: (track as any).price || 1000,
                        artist: { name: artistName }
                    }}
                    onClose={() => setShowPurchaseModal(false)}
                />
            )}

            <style jsx>{`
        .track-card {
            padding: 1rem;
            height: 100%;
            display: flex;
            flex-direction: column;
        }

        .card-image-wrapper {
            position: relative;
            width: 100%;
            aspect-ratio: 1;
            border-radius: var(--radius-md);
            overflow: hidden;
            margin-bottom: 1.25rem;
            background: var(--secondary);
            border: 1px solid var(--border);
        }

        .main-art {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .track-card:hover .main-art {
            transform: scale(1.08);
        }

        .play-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .play-icon {
            font-size: 1.5rem;
            color: white;
            background: var(--accent);
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transform: translateY(10px) scale(0.8);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            color: black;
            font-weight: bold;
        }

        .card-image-wrapper:hover .play-overlay {
            opacity: 1;
            background: rgba(0, 0, 0, 0.3);
        }

        .card-image-wrapper:hover .play-icon {
            transform: translateY(0) scale(1);
            box-shadow: 0 8px 30px var(--accent-glow);
        }

        .play-overlay.active {
            opacity: 1;
            background: rgba(0, 0, 0, 0.4);
        }

        .play-overlay.active .play-icon {
            transform: translateY(0) scale(1);
        }

        .card-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            flex: 1;
        }

        .track-info-text {
            flex: 1;
            min-width: 0;
            padding-right: 0.5rem;
        }

        .card-title {
            font-family: 'Outfit', sans-serif;
            font-weight: 700;
            font-size: 1.1rem;
            color: var(--foreground);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 0.25rem;
        }

        .card-artist {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.85rem;
            color: var(--muted);
        }

        .artist-link { transition: color 0.2s; }
        .artist-link:hover { color: var(--accent); }

        .verified-dot {
            width: 8px;
            height: 8px;
            background: var(--accent);
            border-radius: 50%;
            box-shadow: 0 0 8px var(--accent-glow);
        }

        .card-actions {
            display: flex;
            gap: 0.15rem;
        }

        .action-btn {
            background: transparent;
            border: none;
            color: var(--muted);
            cursor: pointer;
            padding: 6px;
            border-radius: 8px;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
        }

        .action-btn:hover {
            background: rgba(255, 255, 255, 0.08);
            color: var(--foreground);
            transform: scale(1.1);
        }

        .like-btn.liked { color: #FF2D55; }

        .purchase-trigger {
            color: var(--accent);
            font-weight: 900;
        }

        .owned-badge {
            position: absolute;
            top: 12px;
            right: 12px;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
            padding: 4px;
            border-radius: 8px;
            font-size: 0.8rem;
            border: 1px solid rgba(255,255,255,0.1);
        }

        .skeleton-pulse {
            background: rgba(255,255,255,0.04);
            animation: pulse 2s infinite ease-in-out;
        }

        @keyframes pulse {
            0% { opacity: 0.5; }
            50% { opacity: 1; }
            100% { opacity: 0.5; }
        }
      `}</style>
        </div>
    );
}
