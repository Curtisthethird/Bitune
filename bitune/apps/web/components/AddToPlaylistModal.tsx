'use client';

import { useState, useEffect } from 'react';
import { NostrSigner } from '@/lib/nostr/signer';
import { KeyManager } from '@/lib/nostr/key-manager';

interface Playlist {
    id: string;
    title: string;
    count: number;
}

interface AddToPlaylistModalProps {
    trackId: string;
    onClose: () => void;
}

export default function AddToPlaylistModal({ trackId, onClose }: AddToPlaylistModalProps) {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');

    useEffect(() => {
        fetchPlaylists();
    }, []);

    const fetchPlaylists = async () => {
        try {
            const event = {
                kind: 27235,
                created_at: Math.floor(Date.now() / 1000),
                tags: [['u', window.location.origin + '/api/playlists'], ['method', 'GET']],
                content: ''
            };
            const signedEvent = await NostrSigner.sign(event);
            const token = btoa(JSON.stringify(signedEvent));

            const res = await fetch('/api/playlists', {
                headers: { 'Authorization': `Nostr ${token}` }
            });
            const data = await res.json();
            if (data.playlists) setPlaylists(data.playlists);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const createPlaylist = async () => {
        if (!newTitle.trim()) return;
        try {
            const event = {
                kind: 27235,
                created_at: Math.floor(Date.now() / 1000),
                tags: [['u', window.location.origin + '/api/playlists'], ['method', 'POST']],
                content: ''
            };
            const signedEvent = await NostrSigner.sign(event);
            const token = btoa(JSON.stringify(signedEvent));

            const res = await fetch('/api/playlists', {
                method: 'POST',
                headers: {
                    'Authorization': `Nostr ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: newTitle })
            });

            if (res.ok) {
                setNewTitle('');
                setCreating(false);
                fetchPlaylists();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const addToPlaylist = async (playlistId: string) => {
        try {
            const event = {
                kind: 27235,
                created_at: Math.floor(Date.now() / 1000),
                tags: [['u', window.location.origin + '/api/playlists/track'], ['method', 'POST']],
                content: ''
            };
            const signedEvent = await NostrSigner.sign(event);
            const token = btoa(JSON.stringify(signedEvent));

            const res = await fetch('/api/playlists/track', {
                method: 'POST',
                headers: {
                    'Authorization': `Nostr ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ playlistId, trackId })
            });

            if (res.ok) {
                onClose();
                // Optionally show toast
                alert('Added to playlist!');
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to add');
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Add to Playlist</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="playlist-list">
                    {loading ? (
                        <div className="text-center p-4">Loading...</div>
                    ) : playlists.length === 0 && !creating ? (
                        <div className="empty-state">
                            <p>No playlists yet.</p>
                            <button className="btn btn-primary" onClick={() => setCreating(true)}>Create New</button>
                        </div>
                    ) : (
                        <>
                            {playlists.map(p => (
                                <div key={p.id} className="playlist-item" onClick={() => addToPlaylist(p.id)}>
                                    <div className="playlist-icon">🎵</div>
                                    <div className="playlist-info">
                                        <div className="playlist-title">{p.title}</div>
                                        <div className="playlist-count">{p.count} tracks</div>
                                    </div>
                                    <div className="plus-icon">+</div>
                                </div>
                            ))}
                            {!creating && (
                                <button className="btn btn-secondary w-full mt-4" onClick={() => setCreating(true)}>
                                    + Create New Playlist
                                </button>
                            )}
                        </>
                    )}

                    {creating && (
                        <div className="create-form mt-4 pt-4 border-t border-border">
                            <input
                                type="text"
                                placeholder="Playlist Name"
                                className="input w-full mb-2"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button className="btn btn-primary flex-1" onClick={createPlaylist}>Create</button>
                                <button className="btn btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                }
                
                .modal-content {
                    width: 100%;
                    max-width: 400px;
                    padding: 1.5rem;
                    background: #18181b;
                    border: 1px solid var(--border);
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                
                .modal-header h3 {
                    font-size: 1.2rem;
                    font-weight: 700;
                }
                
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    color: var(--muted);
                    cursor: pointer;
                }
                
                .playlist-item {
                    display: flex;
                    align-items: center;
                    padding: 0.75rem;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                
                .playlist-item:hover {
                    background: rgba(255,255,255,0.05);
                }
                
                .playlist-icon {
                    width: 40px;
                    height: 40px;
                    background: var(--secondary);
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 1rem;
                }
                
                .playlist-info {
                    flex: 1;
                }
                
                .playlist-title {
                    font-weight: 600;
                    font-size: 0.95rem;
                }
                
                .playlist-count {
                    font-size: 0.8rem;
                    color: var(--muted);
                }
                
                .plus-icon {
                    color: var(--muted);
                    font-size: 1.2rem;
                }
                
                .input {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid var(--border);
                    color: #fff;
                    padding: 0.75rem;
                    border-radius: 8px;
                }
                
                .w-full { width: 100%; }
                .flex { display: flex; }
                .gap-2 { gap: 0.5rem; }
                .flex-1 { flex: 1; }
                .mt-4 { margin-top: 1rem; }
                .pt-4 { padding-top: 1rem; }
                .mb-2 { margin-bottom: 0.5rem; }
                .border-t { border-top: 1px solid var(--border); }
            `}</style>
        </div>
    );
}
