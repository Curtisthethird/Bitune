'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './feed.module.css';

interface Track {
    id: string;
    title: string;
    artistPubkey: string;
    artist: {
        name?: string;
        picture?: string;
    };
}

export default function FeedPage() {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch tracks when search changes
    useEffect(() => {
        const url = debouncedSearch ? `/api/track?q=${encodeURIComponent(debouncedSearch)}` : '/api/track';
        fetch(url)
            .then(r => r.json())
            .then(d => setTracks(d.tracks || []));
    }, [debouncedSearch]);

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Discover Music</h1>
                <Link href="/upload" className={styles.uploadButton}>
                    Upload Track
                </Link>
            </div>

            <div className={styles.searchContainer}>
                <input
                    type="text"
                    placeholder="Search for songs or artists..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            <div className={styles.grid}>
                {tracks.map(t => (
                    <div key={t.id} className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div className={styles.avatar}>
                                {t.artist?.picture ? (
                                    <img src={t.artist.picture} alt={t.artist.name} className={styles.avatarImg} />
                                ) : (
                                    <span style={{ fontSize: '1.25rem' }}>🎵</span>
                                )}
                            </div>
                            <div className={styles.trackInfo}>
                                <h3 title={t.title}>{t.title}</h3>
                                <p className={styles.artistName}>
                                    {t.artist?.name || `${t.artistPubkey.slice(0, 8)}...`}
                                </p>
                            </div>
                        </div>
                        <Link
                            href={`/track/${t.id}`}
                            className={styles.playButton}
                        >
                            Play Now
                        </Link>
                    </div>
                ))}
            </div>

            {tracks.length === 0 && (
                <div className={styles.emptyState}>
                    No tracks found. Try searching for something else!
                </div>
            )}
        </div>
    );
}
