'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import TrackCard from '@/components/TrackCard';
import { Track } from '@shared/types';

interface ApiTrack extends Track {
    artist: { name?: string; picture?: string };
}
interface ApiArtist {
    pubkey: string;
    name: string;
    about: string;
    picture?: string;
}

export default function SearchPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q');

    const [tracks, setTracks] = useState<ApiTrack[]>([]);
    const [artists, setArtists] = useState<ApiArtist[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!query) return;

        setLoading(true);
        fetch(`/api/search?q=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(data => {
                setTracks(data.tracks || []);
                setArtists(data.artists || []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Search failed", err);
                setLoading(false);
            });
    }, [query]);

    if (!query) {
        return <div className="p-8 text-center text-gray-500">Please enter a search term</div>;
    }

    return (
        <div className="search-page fade-in">
            <h1 className="page-title">Results for "{query}"</h1>

            {loading ? (
                <div className="loading-spinner">Searching...</div>
            ) : (
                <>
                    {/* Artists Section */}
                    {artists.length > 0 && (
                        <section className="mb-12">
                            <h2 className="section-title">Artists</h2>
                            <div className="artists-grid">
                                {artists.map(artist => (
                                    <div key={artist.pubkey} className="artist-card glass-card">
                                        <div className="artist-avatar">
                                            {/* Placeholder/Initial */}
                                            {artist.name ? artist.name[0].toUpperCase() : 'A'}
                                        </div>
                                        <div className="artist-info">
                                            <h3 className="artist-name">{artist.name || 'Unknown Artist'}</h3>
                                            <p className="artist-bio">{artist.about}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Tracks Section */}
                    <section>
                        <h2 className="section-title">Tracks</h2>
                        {tracks.length > 0 ? (
                            <div className="grid-layout">
                                {tracks.map((track, i) => (
                                    <TrackCard key={track.id} track={track} index={i} artist={track.artist} />
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">No tracks found.</div>
                        )}
                    </section>
                </>
            )}

            <style jsx>{`
                .search-page {
                    padding: 2rem;
                }
                .page-title {
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 2rem;
                }
                .section-title {
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                    color: var(--foreground);
                }
                .artists-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 1.5rem;
                }
                .artist-card {
                    padding: 1.5rem;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .artist-card:hover {
                    transform: translateY(-4px);
                    background: rgba(255,255,255,0.08);
                }
                .artist-avatar {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: var(--accent);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    font-weight: bold;
                    margin-bottom: 1rem;
                    color: white;
                }
                .artist-info h3 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin-bottom: 0.25rem;
                }
                .artist-bio {
                    font-size: 0.85rem;
                    color: var(--muted);
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .mb-12 { margin-bottom: 3rem; }
            `}</style>
        </div>
    );
}
