'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import TrackCard from '@/components/TrackCard';
import FollowButton from '@/components/FollowButton';
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

const GENRES = ['All', 'Lo-Fi', 'Electronic', 'Hip Hop', 'Rock', 'Jazz', 'Ambient'];

export default function SearchPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get('q') || '';
    const activeGenre = searchParams.get('genre') || 'All';

    const [tracks, setTracks] = useState<ApiTrack[]>([]);
    const [artists, setArtists] = useState<ApiArtist[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        const genreParam = activeGenre !== 'All' ? `&genre=${encodeURIComponent(activeGenre)}` : '';
        fetch(`/api/search?q=${encodeURIComponent(query)}${genreParam}`)
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
    }, [query, activeGenre]);

    const handleGenreSelect = (genre: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (genre === 'All') {
            params.delete('genre');
        } else {
            params.set('genre', genre);
        }
        router.push(`/search?${params.toString()}`);
    };

    return (
        <div className="search-page fade-in">
            <div className="search-header">
                <h1 className="page-title">
                    {query ? `Results for "${query}"` : 'Discover New Music'}
                </h1>

                <div className="genre-filters">
                    {GENRES.map(genre => (
                        <button
                            key={genre}
                            className={`genre-chip ${activeGenre === genre ? 'active' : ''}`}
                            onClick={() => handleGenreSelect(genre)}
                        >
                            {genre}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Fetching the best beats...</p>
                </div>
            ) : (
                <>
                    {/* Artists Section */}
                    {artists.length > 0 && (
                        <section className="mb-12">
                            <h2 className="section-title">
                                {query ? 'Artists' : 'Trending Artists'}
                            </h2>
                            <div className="artists-grid">
                                {artists.map(artist => (
                                    <div key={artist.pubkey} className="artist-card glass-card">
                                        <div
                                            className="artist-clickable"
                                            onClick={() => router.push(`/users/${artist.pubkey}`)}
                                        >
                                            <div className="artist-avatar">
                                                {artist.picture ? (
                                                    <img src={artist.picture} alt={artist.name} />
                                                ) : (
                                                    (artist.name ? artist.name[0].toUpperCase() : 'A')
                                                )}
                                            </div>
                                            <div className="artist-info">
                                                <h3 className="artist-name">{artist.name || 'Unknown Artist'}</h3>
                                                <p className="artist-bio">{artist.about}</p>
                                            </div>
                                        </div>
                                        <div className="artist-actions">
                                            <FollowButton targetPubkey={artist.pubkey} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Tracks Section */}
                    <section>
                        <h2 className="section-title">
                            {query ? 'Tracks' : 'New Releases'}
                        </h2>
                        {tracks.length > 0 ? (
                            <div className="grid-layout">
                                {tracks.map((track, i) => (
                                    <TrackCard key={track.id} track={track} index={i} artist={track.artist} />
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>No tracks found matching your criteria.</p>
                                <button onClick={() => router.push('/search')} className="clear-filters">
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </section>
                </>
            )}

            <style jsx>{`
                .search-page {
                    padding: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding-bottom: 120px;
                }
                .search-header {
                    margin-bottom: 3rem;
                }
                .page-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 1.5rem;
                    background: linear-gradient(135deg, #fff 0%, #aaa 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .genre-filters {
                    display: flex;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                    margin-bottom: 1rem;
                }
                .genre-chip {
                    padding: 0.5rem 1.25rem;
                    border-radius: 100px;
                    border: 1px solid var(--border);
                    background: rgba(255,255,255,0.05);
                    color: var(--muted);
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    font-size: 0.9rem;
                    font-weight: 500;
                }
                .genre-chip:hover {
                    background: rgba(255,255,255,0.1);
                    border-color: var(--muted);
                    color: var(--foreground);
                    transform: translateY(-2px);
                }
                .genre-chip.active {
                    background: var(--accent);
                    color: black;
                    border-color: var(--accent);
                    box-shadow: 0 4px 15px rgba(255, 204, 0, 0.3);
                }
                .section-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .artists-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 1.5rem;
                }
                .artist-card {
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    transition: all 0.3s ease;
                    position: relative;
                }
                .artist-card:hover {
                    transform: translateY(-8px);
                    background: rgba(255,255,255,0.08);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }
                .artist-clickable {
                    width: 100%;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .artist-avatar {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    background: var(--secondary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2.5rem;
                    font-weight: 900;
                    margin-bottom: 1.25rem;
                    color: var(--accent);
                    overflow: hidden;
                    border: 2px solid transparent;
                    transition: border-color 0.3s;
                }
                .artist-card:hover .artist-avatar {
                    border-color: var(--accent);
                }
                .artist-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .artist-info {
                    text-align: center;
                    margin-bottom: 1.25rem;
                }
                .artist-name {
                    font-size: 1.2rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                }
                .artist-bio {
                    font-size: 0.85rem;
                    color: var(--muted);
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .artist-actions {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                }
                .loading-state {
                    padding: 5rem;
                    text-align: center;
                    color: var(--muted);
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(255,255,255,0.1);
                    border-radius: 50%;
                    border-top-color: var(--accent);
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1.5rem;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .empty-state {
                    text-align: center;
                    padding: 4rem;
                    background: rgba(255,255,255,0.02);
                    border-radius: 1rem;
                    border: 1px dashed var(--border);
                }
                .clear-filters {
                    margin-top: 1rem;
                    padding: 0.5rem 1rem;
                    background: transparent;
                    border: 1px solid var(--accent);
                    color: var(--accent);
                    border-radius: 0.5rem;
                    cursor: pointer;
                }
                .mb-12 { margin-bottom: 4rem; }
            `}</style>
        </div>
    );
}

