'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import TrackCard from '@/components/TrackCard';
import { NostrSigner } from '@/lib/nostr/signer';

export default function PlaylistDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [playlist, setPlaylist] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPlaylist();
    }, [id]);

    const fetchPlaylist = async () => {
        try {
            const res = await fetch(`/api/playlists/${id}`);
            if (res.ok) setPlaylist(await res.json());
            else router.push('/library'); // Redirect if not found
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this playlist?')) return;
        try {
            const event = {
                kind: 27235,
                created_at: Math.floor(Date.now() / 1000),
                tags: [['u', window.location.origin + `/api/playlists/${id}`], ['method', 'DELETE']],
                content: ''
            };
            const signedEvent = await NostrSigner.sign(event);
            const token = btoa(JSON.stringify(signedEvent));

            const res = await fetch(`/api/playlists/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Nostr ${token}` }
            });

            if (res.ok) router.push('/library');
        } catch (e) {
            alert('Failed to delete');
        }
    };

    if (loading) return <div className="p-12 text-center">Loading...</div>;
    if (!playlist) return null;

    return (
        <div className="page-container fade-in">
            <div className="flex flex-col md:flex-row gap-8 mb-8 items-end">
                <div className="w-52 h-52 bg-zinc-800 rounded-lg overflow-hidden shadow-2xl flex-shrink-0">
                    {playlist.tracks[0]?.artist?.picture || playlist.coverUrl ? (
                        <img src={playlist.coverUrl || playlist.tracks[0]?.coverUrl} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl">💿</div>
                    )}
                </div>
                <div className="flex-1">
                    <h5 className="uppercase tracking-widest text-xs font-bold mb-2">Playlist</h5>
                    <h1 className="text-5xl font-bold mb-4">{playlist.title}</h1>
                    <p className="text-muted mb-4">{playlist.description || `Created by ${playlist.owner.name || 'User'}`}</p>
                    <div className="flex gap-4 items-center">
                        <button className="btn-primary rounded-full px-8 py-3 text-lg">Play All</button>
                        <button onClick={handleDelete} className="text-red-500 hover:text-red-400 text-sm font-bold ml-auto border border-red-500/30 px-4 py-2 rounded">Delete</button>
                    </div>
                </div>
            </div>

            <div className="tracks-list bg-black/20 rounded-xl p-4">
                {playlist.tracks.length === 0 ? (
                    <div className="p-8 text-center text-muted">No tracks yet. Go adding some!</div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {playlist.tracks.map((track: any, idx: number) => (
                            <div key={track.id} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded group">
                                <span className="text-muted w-6 text-center">{idx + 1}</span>
                                <img src={track.coverUrl} className="w-10 h-10 rounded" />
                                <div className="flex-1">
                                    <div className="font-bold">{track.title}</div>
                                    <div className="text-xs text-muted">{track.artist?.name || 'Unknown'}</div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100">
                                    {/* Action buttons (play, remove) could go here */}
                                    <button className="p-2">▶️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
