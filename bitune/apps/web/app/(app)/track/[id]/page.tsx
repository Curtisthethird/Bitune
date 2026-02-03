'use client';
import { useEffect, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useParams } from 'next/navigation';
import { NostrSigner } from '@/lib/nostr/signer';

export default function TrackPage() {
    const { id } = useParams();
    const { play, currentTrack, isPlaying, toggle } = usePlayer();
    const [track, setTrack] = useState<any>(null);
    const [pubkey, setPubkey] = useState('');

    useEffect(() => {
        NostrSigner.getPublicKey().then(setPubkey).catch(() => { });
        if (id) {
            fetch('/api/track').then(r => r.json()).then(d => {
                const t = d.tracks?.find((x: any) => x.id === id);
                setTrack(t);
            });
        }
    }, [id]);

    if (!track) return <div>Loading or Not Found...</div>;

    const isCurrent = currentTrack?.id === track.id;

    return (
        <div className="p-4">
            <div className="track-hero">
                {track.coverUrl && (
                    <img src={track.coverUrl} alt={track.title} className="track-hero-img" />
                )}
                <div className="track-hero-info">
                    <h1>{track.title}</h1>
                    <p className="artist-name">Artist Pubkey: {track.artistPubkey}</p>

                    <div className="actions mt-4">
                        {pubkey ? (
                            <button
                                className="play-btn-large"
                                onClick={() => isCurrent ? toggle() : play(track)}
                            >
                                {isCurrent && isPlaying ? 'Pause' : 'Play Now'}
                            </button>
                        ) : (
                            <p className="text-muted">Please login to play</p>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .track-hero {
                    display: flex;
                    gap: 2rem;
                    align-items: center;
                    background: rgba(255,255,255,0.05);
                    padding: 2rem;
                    border-radius: 12px;
                }
                .track-hero-img {
                    width: 200px;
                    height: 200px;
                    border-radius: 8px;
                    object-fit: cover;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }
                .play-btn-large {
                    background: var(--accent);
                    color: #000;
                    border: none;
                    padding: 0.8rem 2rem;
                    border-radius: 30px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .play-btn-large:hover {
                    transform: scale(1.05);
                }
            `}</style>
        </div>
    );
}
