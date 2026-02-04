'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TrackCard from '@/components/TrackCard';
import ArtistCard from '@/components/ArtistCard';

interface DiscoveryItem {
    id: string; // Used for tracks
    pubkey?: string; // Used for artists
    [key: string]: any;
}

interface DiscoveryMeta {
    title: string;
    subtitle: string;
    type: 'track' | 'artist';
}

export default function DiscoveryCategoryPage({ params }: { params: Promise<{ category: string }> }) {
    const { category } = use(params);
    const router = useRouter();
    const [items, setItems] = useState<DiscoveryItem[]>([]);
    const [meta, setMeta] = useState<DiscoveryMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchData(1);
    }, [category]);

    const fetchData = async (pageNum: number) => {
        try {
            if (pageNum === 1) setLoading(true);
            else setLoadingMore(true);

            const res = await fetch(`/api/discovery/${category}?page=${pageNum}&limit=20`);
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            if (pageNum === 1) {
                setItems(data.items);
                setMeta(data.meta);
            } else {
                setItems(prev => [...prev, ...data.items]);
            }

            setHasMore(data.pagination.hasMore);
        } catch (err) {
            console.error('Failed to load category', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchData(nextPage);
    };

    if (loading) return (
        <div className="discovery-page fade-in">
            <div className="header-skeleton"></div>
            <div className="grid-skeleton">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="card-skeleton"></div>)}
            </div>
            <style jsx>{`
                 .discovery-page { padding: 2rem; max-width: 1400px; margin: 0 auto; padding-bottom: 2rem; }
                 .header-skeleton { height: 100px; width: 50%; background: var(--secondary); margin-bottom: 3rem; border-radius: 12px; }
                 .grid-skeleton { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem; }
                 .card-skeleton { height: 280px; background: var(--secondary); border-radius: 12px; }
             `}</style>
        </div>
    );

    if (!meta) return <div className="p-10 text-center">Category not found</div>;

    return (
        <div className="discovery-page fade-in">
            <header className="category-header glass-card">
                <h1>{meta.title}</h1>
                <p>{meta.subtitle}</p>
            </header>

            <div className={meta.type === 'artist' ? 'artists-grid' : 'tracks-grid'}>
                {items.map((item, index) => (
                    meta.type === 'artist' ? (
                        <ArtistCard key={item.pubkey} artist={item as any} />
                    ) : (
                        <TrackCard key={item.id} track={item as any} artist={item.artist} index={index} />
                    )
                ))}
            </div>

            {hasMore && (
                <div className="load-more-container">
                    <button
                        className="btn-load-more"
                        onClick={loadMore}
                        disabled={loadingMore}
                    >
                        {loadingMore ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}

            <style jsx>{`
                .discovery-page {
                    padding: 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                    padding-bottom: 120px;
                }

                .category-header {
                    margin-bottom: 3rem;
                    padding: 3rem;
                    border-radius: 24px;
                    background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 100%);
                    border: 1px solid rgba(255,255,255,0.05);
                }

                .category-header h1 {
                    font-size: 3rem;
                    font-weight: 900;
                    margin-bottom: 0.5rem;
                    background: linear-gradient(to right, #fff, #aaa);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .category-header p {
                    color: var(--muted);
                    font-size: 1.1rem;
                }

                .tracks-grid, .artists-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 1.5rem;
                }

                .load-more-container {
                    display: flex;
                    justify-content: center;
                    margin-top: 4rem;
                }

                .btn-load-more {
                    padding: 1rem 3rem;
                    background: transparent;
                    border: 1px solid var(--accent);
                    color: var(--accent);
                    border-radius: 100px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-load-more:hover {
                    background: var(--accent);
                    color: black;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(247, 147, 26, 0.2);
                }

                .btn-load-more:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }
            `}</style>
        </div>
    );
}
