
'use client';

import Link from 'next/link';

export default function PlaylistCard({ playlist }: { playlist: any }) {
    return (
        <Link href={`/library/playlist/${playlist.id}`} className="playlist-card group">
            <div className="card-image-wrapper">
                {playlist.coverUrl ? (
                    <img
                        src={playlist.coverUrl}
                        alt={playlist.title}
                        className="card-image"
                    />
                ) : (
                    <div className="card-placeholder">
                        <span className="icon">💿</span>
                    </div>
                )}
                <div className="play-overlay">
                    <span className="play-icon">▶</span>
                </div>
            </div>
            <div className="card-content">
                <h3 className="card-title" title={playlist.title}>{playlist.title}</h3>
                <p className="card-subtitle">
                    {playlist._count?.tracks || 0} tracks • By {playlist.owner?.name || 'Unknown'}
                </p>
            </div>

            <style jsx>{`
                .playlist-card {
                    display: block;
                    width: 100%;
                    cursor: pointer;
                }

                .card-image-wrapper {
                    position: relative;
                    width: 100%;
                    aspect-ratio: 1;
                    border-radius: var(--radius-md);
                    overflow: hidden;
                    margin-bottom: 0.75rem;
                    background: var(--secondary);
                    border: 1px solid var(--border);
                }

                .card-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .card-placeholder {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--secondary);
                    font-size: 3rem;
                    color: var(--muted);
                }

                .playlist-card:hover .card-image {
                    transform: scale(1.08);
                }

                .play-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s;
                }

                .playlist-card:hover .play-overlay {
                    opacity: 1;
                }

                .play-icon {
                    width: 48px;
                    height: 48px;
                    background: var(--accent);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: black;
                    font-size: 1.25rem;
                    box-shadow: 0 8px 20px rgba(0,0,0,0.3);
                    transform: translateY(10px);
                    transition: transform 0.3s;
                }

                .playlist-card:hover .play-icon {
                    transform: translateY(0);
                }

                .card-title {
                    font-weight: 700;
                    color: var(--foreground);
                    margin-bottom: 0.25rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-size: 1rem;
                }

                .card-subtitle {
                    font-size: 0.85rem;
                    color: var(--muted);
                }

                .playlist-card:hover .card-title {
                    color: var(--accent);
                }
            `}</style>
        </Link>
    );
}
