'use client';

import { useState, useEffect } from 'react';
import { NostrSigner } from '@/lib/nostr/signer';
import TrackCard from '@/components/TrackCard';
import Link from 'next/link';

export default function LibraryPage() {
    const [activeTab, setActiveTab] = useState<'playlists' | 'likes' | 'purchases'>('likes');
    const [likes, setLikes] = useState<any[]>([]);
    const [purchases, setPurchases] = useState<any[]>([]);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkAuthAndFetch();
    }, [activeTab]);

    const checkAuthAndFetch = async () => {
        try {
            const pubkey = await NostrSigner.getPublicKey();
            if (pubkey) {
                setIsAuthenticated(true);
                fetchData(activeTab);
            }
        } catch (e) {
            setIsAuthenticated(false);
            setLoading(false);
        }
    };

    const fetchData = async (type: 'playlists' | 'likes' | 'purchases') => {
        setLoading(true);
        try {
            let endpoint = '';
            if (type === 'likes') endpoint = '/api/library?type=likes';
            else if (type === 'purchases') endpoint = '/api/library?type=purchases';
            else endpoint = '/api/playlists';

            const event = {
                kind: 27235,
                created_at: Math.floor(Date.now() / 1000),
                tags: [['u', window.location.origin + endpoint], ['method', 'GET']],
                content: ''
            };
            const signedEvent = await NostrSigner.sign(event);
            const token = btoa(JSON.stringify(signedEvent));

            const res = await fetch(endpoint, {
                headers: { 'Authorization': `Nostr ${token}` }
            });
            const data = await res.json();

            if (type === 'likes') setLikes(data.tracks || []);
            else if (type === 'purchases') setPurchases(data.tracks || []);
            else setPlaylists(data.playlists || []);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-muted">Loading Library...</div>;

    if (!isAuthenticated) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
            <h2 className="text-2xl font-bold mb-4">Your Collection Awaits</h2>
            <p className="text-muted mb-8 max-w-md">Connect your Nostr extension to access your liked tracks, purchases, and playlists.</p>
            <button onClick={checkAuthAndFetch} className="btn-primary">Connect Wallet</button>
        </div>
    );

    return (
        <div className="page-container fade-in">
            <div className="library-header flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h1 className="text-4xl font-bold">Your Library</h1>
                <div className="tabs flex gap-2 p-1 bg-white/5 rounded-full overflow-x-auto">
                    <button
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'likes' ? 'bg-accent text-black' : 'text-muted hover:text-white'}`}
                        onClick={() => setActiveTab('likes')}
                    >
                        Liked Tracks
                    </button>
                    <button
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'purchases' ? 'bg-accent text-black' : 'text-muted hover:text-white'}`}
                        onClick={() => setActiveTab('purchases')}
                    >
                        Purchased
                    </button>
                    <button
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'playlists' ? 'bg-accent text-black' : 'text-muted hover:text-white'}`}
                        onClick={() => setActiveTab('playlists')}
                    >
                        Playlists
                    </button>
                </div>
            </div>

            {activeTab === 'likes' && (
                <div className="likes-view">
                    {likes.length === 0 ? (
                        <div className="empty-state text-center py-12 bg-white/5 rounded-xl">
                            <h3 className="text-xl font-bold mb-2">No likes yet</h3>
                            <p className="text-muted mb-4">Save tracks you love to build your collection.</p>
                            <Link href="/feed" className="btn-primary btn-sm inline-flex">Explore Music</Link>
                        </div>
                    ) : (
                        <div className="grid-layout">
                            {likes.map(track => (
                                <TrackCard key={track.id} track={track} artist={track.artist} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'purchases' && (
                <div className="purchases-view">
                    {purchases.length === 0 ? (
                        <div className="empty-state text-center py-12 bg-white/5 rounded-xl">
                            <h3 className="text-xl font-bold mb-2">Your collection is empty</h3>
                            <p className="text-muted mb-4">Support artists directly to unlock and own their music.</p>
                            <Link href="/feed" className="btn-primary btn-sm inline-flex">Browse Tracks</Link>
                        </div>
                    ) : (
                        <div className="grid-layout">
                            {purchases.map(track => (
                                <TrackCard key={track.id} track={{ ...track, hasPurchased: true }} artist={track.artist} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'playlists' && (
                <div className="playlists-view">
                    <div className="flex justify-end mb-6">
                        <button className="btn-secondary" onClick={() => alert('Create functionality coming next!')}>
                            + New Playlist
                        </button>
                    </div>
                    {playlists.length === 0 ? (
                        <div className="empty-state text-center py-12 bg-white/5 rounded-xl">
                            <h3 className="text-xl font-bold mb-2">No playlists</h3>
                            <p className="text-muted">Create your first playlist to organize your vibes.</p>
                        </div>
                    ) : (
                        <div className="grid-layout">
                            {playlists.map(playlist => (
                                <Link href={`/library/playlist/${playlist.id}`} key={playlist.id} className="playlist-card group">
                                    <div className="aspect-square bg-zinc-800 rounded-lg overflow-hidden mb-3 relative">
                                        {playlist.coverUrl ? (
                                            <img src={playlist.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl bg-zinc-800">💿</div>
                                        )}
                                    </div>
                                    <h3 className="font-bold truncate">{playlist.title}</h3>
                                    <p className="text-sm text-muted">{playlist.count} tracks</p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
