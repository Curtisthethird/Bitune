'use client';

import { useState, useEffect } from 'react';
import { NostrSigner } from '@/lib/nostr/signer';

interface AddToPlaylistModalProps {
    trackId: string;
    onClose: () => void;
}

export default function AddToPlaylistModal({ trackId, onClose }: AddToPlaylistModalProps) {
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');

    useEffect(() => {
        fetchPlaylists();
    }, []);

    const fetchPlaylists = async () => {
        try {
            const pubkey = await NostrSigner.getPublicKey();
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
            if (res.ok) {
                const data = await res.json();
                setPlaylists(data.playlists || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const addToPlaylist = async (playlistId: string) => {
        try {
            const event = {
                kind: 27235,
                created_at: Math.floor(Date.now() / 1000),
                tags: [['u', window.location.origin + `/api/playlists/${playlistId}/tracks`], ['method', 'POST']],
                content: ''
            };
            const signedEvent = await NostrSigner.sign(event);
            const token = btoa(JSON.stringify(signedEvent));

            const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Nostr ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ trackId })
            });

            if (res.ok) {
                alert('Added to playlist!');
                onClose();
            } else {
                alert('Already in playlist or error');
            }
        } catch (e) {
            alert('Failed to add');
        }
    };

    const createAndAdd = async () => {
        if (!newTitle.trim()) return;
        try {
            // 1. Create Playlist
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
                headers: { 'Authorization': `Nostr ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
            });
            const data = await res.json();

            if (data.playlist?.id) {
                // 2. Add Track
                await addToPlaylist(data.playlist.id);
            }
        } catch (e) {
            alert('Error creating playlist');
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Add to Playlist</h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">✕</button>
                </div>

                <div className="playlists-list max-h-60 overflow-y-auto mb-6 flex flex-col gap-2">
                    {loading ? (
                        <div className="text-center text-muted">Loading...</div>
                    ) : playlists.length === 0 ? (
                        <div className="text-center text-muted py-4">No playlists yet</div>
                    ) : (
                        playlists.map(p => (
                            <button
                                key={p.id}
                                onClick={() => addToPlaylist(p.id)}
                                className="flex items-center gap-3 p-3 rounded hover:bg-white/10 text-left transition-colors"
                            >
                                <div className="w-10 h-10 bg-zinc-800 rounded flex items-center justify-center text-xs overflow-hidden">
                                    {p.coverUrl ? <img src={p.coverUrl} /> : '💿'}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold">{p.title}</div>
                                    <div className="text-xs text-muted">{p.count} tracks</div>
                                </div>
                                <span className="text-accent text-xl">+</span>
                            </button>
                        ))
                    )}
                </div>

                <div className="border-t border-zinc-800 pt-4">
                    {!creating ? (
                        <button
                            onClick={() => setCreating(true)}
                            className="w-full py-3 rounded bg-zinc-800 hover:bg-zinc-700 font-bold transition-colors"
                        >
                            + Create New Playlist
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Playlist Name"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                className="flex-1 bg-zinc-800 border-zinc-700 rounded px-3 py-2 outline-none focus:border-accent"
                                onKeyDown={e => e.key === 'Enter' && createAndAdd()}
                            />
                            <button onClick={createAndAdd} className="bg-accent text-black font-bold px-4 rounded">Create</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
