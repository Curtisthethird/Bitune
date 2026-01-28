'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import TrackCard from '@/components/TrackCard';
import { Track } from '@shared/types';

// Extended Track type for API response which might include 'artist' object
interface ApiTrack extends Track {
    artist: {
        name?: string;
        picture?: string;
    };
}

export default function FeedPage() {
    const [tracks, setTracks] = useState<ApiTrack[]>([]);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch tracks when search changes
    useEffect(() => {
        setLoading(true);
        const url = debouncedSearch ? `/api/track?q=${encodeURIComponent(debouncedSearch)}` : '/api/track';
        fetch(url)
            .then(r => r.json())
            .then(d => {
                setTracks(d.tracks || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [debouncedSearch]);

    return (
        <div className="feed-page fade-in">
            <div className="feed-header">
                <div>
                    <h1 className="page-title">Discover Music</h1>
                    <p className="page-subtitle">Find the fresh sounds on Bitcoin</p>
                </div>
                <Link href="/upload" className="btn btn-primary">
                    Upload Track
                </Link>
            </div>

            <div className="search-container">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    placeholder="Search for songs or artists..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="search-input"
                />
            </div>

            {loading ? (
                <div className="loading-grid">
                    {[1, 2, 3, 4, 5, 6].map(i => <TrackCard key={i} />)}
                </div>
            ) : (
                <div className="grid-layout">
                    {tracks.length > 0 ? (
                        tracks.map(t => (
                            <TrackCard key={t.id} track={t} artist={t.artist} />
                        ))
                    ) : (
                        <div className="empty-state">
                            <p>No tracks found matching "{search}".</p>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                .feed-page {
                    padding-bottom: 6rem; /* Space for mobile nav */
                    max-width: 1200px;
                    margin: 0 auto;
                    padding-left: 2rem;
                    padding-right: 2rem;
                    padding-top: 2rem;
                }

                .feed-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                .page-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 0.25rem;
                }

                .page-subtitle {
                    color: var(--muted);
                    font-size: 1rem;
                }

                .search-container {
                    position: relative;
                    margin-bottom: 3rem;
                    max-width: 600px;
                }

                .search-icon {
                    position: absolute;
                    left: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    opacity: 0.5;
                }

                .search-input {
                    width: 100%;
                    padding: 1rem 1rem 1rem 3rem;
                    background: var(--secondary);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-full);
                    color: var(--foreground);
                    font-size: 1rem;
                    outline: none;
                    transition: all 0.2s;
                }

                .search-input:focus {
                    border-color: var(--accent);
                    box-shadow: 0 0 0 2px var(--accent-dim);
                }

                .empty-state {
                    grid-column: 1 / -1;
                    padding: 4rem;
                    text-align: center;
                    color: var(--muted);
                    background: rgba(255,255,255,0.03);
                    border-radius: var(--radius-lg);
                }
                
                .loading-grid {
                     display: grid;
                     grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                     gap: 1rem;
                }
                
                @media (min-width: 768px) {
                    .loading-grid {
                        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                        gap: 1.5rem;
                    }
                }
            `}</style>
        </div>
    );
}
