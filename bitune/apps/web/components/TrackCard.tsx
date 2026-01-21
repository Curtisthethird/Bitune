import { useState } from 'react';
import Link from 'next/link';
import { Track } from '@shared/types';
import { usePlayer } from '@/context/PlayerContext';
import { NostrSigner } from '@/lib/nostr/signer';
import { KeyManager } from '@/lib/nostr/key-manager';
import AddToPlaylistModal from './AddToPlaylistModal';
import PurchaseModal from './PurchaseModal';

interface TrackCardProps {
    track?: Track; // Optional for placeholder/skeleton
    index?: number;
    artist?: { name?: string; picture?: string };
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
                tags: [['u', window.location.origin + '/api/like'], ['method', 'POST']],
                content: ''
            };
            const signedEvent = await NostrSigner.sign(event);
            const token = btoa(JSON.stringify(signedEvent));

            const res = await fetch('/api/like', {
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
        <div className="track-card">
            <div
                className="card-image-wrapper"
                onClick={() => play(track)}
                style={{ cursor: 'pointer' }}
            >
                <div className="card-image-placeholder">
                    {/* Use provided cover or default platinum CD */}
                    <img
                        src={track.coverUrl || '/platinum-cd.svg'}
                        alt={track.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                            // Fallback if image fails to load
                            (e.target as HTMLImageElement).src = '/platinum-cd.svg';
                        }}
                    />
                </div>
                <div className={`play-overlay ${isActive ? 'active' : ''}`}>
                    {isActive ? '⏸' : '▶'}
                </div>
            </div>
            <div className="card-content">
                <div className="track-info-text">
                    <div className="card-title" title={track.title}>{track.title}</div>
                    <div className="card-artist">
                        <Link href={`/users/${track.artistPubkey}`} onClick={(e) => e.stopPropagation()} className="artist-link">
                            {artistName}
                        </Link>
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
                    <button
                        className="action-btn"
                        onClick={(e) => { e.stopPropagation(); setShowPurchaseModal(true); }}
                        title="Buy"
                    >
                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>⚡</span>
                    </button>
                    <button
                        className="action-btn playlist-btn"
                        onClick={openPlaylistModal}
                        title="Add to Playlist"
                    >
                        📂
                    </button>
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
        .card-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-top: 0.75rem;
        }
        .track-info-text {
            flex: 1;
            min-width: 0;
            overflow: hidden;
        }
        .card-title {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .artist-link:hover {
            color: var(--accent);
            text-decoration: underline;
        }
        .card-actions {
            display: flex;
            gap: 0.25rem;
            align-items: center;
        }
        .action-btn {
            background: none;
            border: none;
            color: var(--muted);
            font-size: 1.1rem;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .action-btn:hover {
            background: rgba(255,255,255,0.1);
            color: var(--foreground);
            transform: scale(1.1);
        }
        .like-btn.liked {
            color: #ff0055;
        }

        /* Styles inherited from globals.css but we can add specific logic here if needed */
        .skeleton-pulse {
            background: rgba(255,255,255,0.05);
            animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
        }
        
        .play-overlay.active {
            opacity: 1;
            background: rgba(0,0,0,0.6);
        }
      `}</style>
        </div>
    );
}
