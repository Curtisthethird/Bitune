'use client';

import { useState, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { NostrSigner } from '@/lib/nostr/signer';
import TrackCard from '@/components/TrackCard';
import { Track } from '@shared/types';
import { KeyManager } from '@/lib/nostr/key-manager';

export default function LibraryPage() {
    const [activeTab, setActiveTab] = useState<'favorites' | 'playlists'>('favorites');
    const [favorites, setFavorites] = useState<Track[]>([]);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLibrary();
    }, [activeTab]);

    const fetchLibrary = async () => {
        setLoading(true);
        const session = KeyManager.getSession();
        if (!session) {
            setLoading(false);
            return;
        }

        try {
            // Sign Auth
            const event = {
                kind: 27235,
                created_at: Math.floor(Date.now() / 1000),
                tags: [['u', window.location.origin + '/api/library'], ['method', 'GET']],
                content: ''
            };
            const signedEvent = await NostrSigner.sign(event);
            const token = btoa(JSON.stringify(signedEvent));

            if (activeTab === 'favorites') {
                const res = await fetch('/api/library', {
                    headers: { 'Authorization': `Nostr ${token}` }
                });
                const data = await res.json();
                if (data.tracks) setFavorites(data.tracks);
            } else {
                // Fetch Playlists (re-using the API from modal for now, ideally dedicated sync)
                // Note: We need to sign a new event for /api/playlists URL if we are strict.
                // Let's just create a new auth header for correct route.
                const pEvent = { ...event, tags: [['u', window.location.origin + '/api/playlists'], ['method', 'GET']] };
                const pSigned = await NostrSigner.sign(pEvent);
                const pToken = btoa(JSON.stringify(pSigned));

                const res = await fetch('/api/playlists', {
                    headers: { 'Authorization': `Nostr ${pToken}` }
                });
                const data = await res.json();
                if (data.playlists) setPlaylists(data.playlists);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container glass-card fade-in">
            <div className="header">
                <h1 className="title">Your Library</h1>
                <div className="tabs">
                    <button
                        className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
                        onClick={() => setActiveTab('favorites')}
                    >
                        ❤️ Favorites
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'playlists' ? 'active' : ''}`}
                        onClick={() => setActiveTab('playlists')}
                    >
                        📂 Playlists
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">Loading your library...</div>
            ) : (
                <div className="content">
                    {activeTab === 'favorites' ? (
                        <>
                            {favorites.length === 0 ? (
                                <div className="empty-state">No liked tracks yet. Go explore!</div>
                            ) : (
                                <div className="grid-layout">
                                    {favorites.map((track) => (
                                        <TrackCard
                                            key={track.id}
                                            track={track}
                                            artist={track.artist}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {playlists.length === 0 ? (
                                <div className="empty-state">No playlists created yet. Add tracks to create one!</div>
                            ) : (
                                <div className="grid-layout">
                                    {playlists.map((playlist) => (
                                        <div key={playlist.id} className="playlist-card glass">
                                            <div className="playlist-art">
                                                {playlist.coverUrl ? (
                                                    <img src={playlist.coverUrl} alt={playlist.title} />
                                                ) : (
                                                    <div className="playlist-placeholder">🎵</div>
                                                )}
                                            </div>
                                            <div className="playlist-info">
                                                <div className="playlist-title">{playlist.title}</div>
                                                <div className="playlist-count">{playlist.count} tracks</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            <style jsx>{`
                .page-container {
                    padding: 2rem;
                    min-height: 80vh;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                .title {
                    font-size: 2rem;
                    font-weight: 700;
                }
                .tabs {
                    display: flex;
                    gap: 1rem;
                    background: rgba(255,255,255,0.05);
                    padding: 4px;
                    border-radius: var(--radius-full);
                }
                .tab-btn {
                    background: none;
                    border: none;
                    color: var(--muted);
                    padding: 0.5rem 1.5rem;
                    border-radius: var(--radius-full);
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .tab-btn.active {
                    background: var(--accent);
                    color: black;
                }
                .tab-btn:hover:not(.active) {
                    color: var(--foreground);
                    background: rgba(255,255,255,0.1);
                }
                
                .playlist-card {
                    padding: 1rem;
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    transition: transform 0.2s;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .playlist-card:hover {
                    transform: translateY(-4px);
                    background: rgba(255,255,255,0.08);
                }
                
                .playlist-art {
                    aspect-ratio: 1;
                    width: 100%;
                    background: var(--secondary);
                    border-radius: var(--radius-sm);
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .playlist-art img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .playlist-placeholder {
                    font-size: 3rem;
                    opacity: 0.5;
                }
                
                .playlist-title {
                    font-weight: 700;
                    font-size: 1.1rem;
                    margin-bottom: 4px;
                }
                
                .playlist-count {
                    color: var(--muted);
                    font-size: 0.9rem;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 4rem;
                    color: var(--muted);
                    width: 100%;
                }
            `}</style>
        </div>
    );
}
