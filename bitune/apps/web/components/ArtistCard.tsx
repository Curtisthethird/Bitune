'use client';

import Link from 'next/link';
import { useState } from 'react';
import TipModal from './TipModal';

interface ArtistCardProps {
    artist: {
        pubkey: string;
        name?: string;
        picture?: string;
        about?: string;
    };
    followerCount?: number;
}

export default function ArtistCard({ artist, followerCount = 0 }: ArtistCardProps) {
    const [showTipModal, setShowTipModal] = useState(false);
    const displayName = artist.name || 'Anonymous Artist';
    const avatar = artist.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.pubkey}`;

    const handleTipClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowTipModal(true);
    };

    return (
        <Link href={`/users/${artist.pubkey}`} className="artist-card glass-card fade-in">
            <div className="artist-avatar-container">
                <img src={avatar} alt={displayName} className="artist-avatar" />
            </div>
            <div className="artist-info">
                <h3 className="artist-name">{displayName}</h3>
                <div className="artist-stats">
                    <span className="stat-item">Artist</span>
                    {followerCount > 0 && (
                        <>
                            <span className="dot">•</span>
                            <span className="stat-item">{followerCount.toLocaleString()} followers</span>
                        </>
                    )}
                </div>
            </div>

            <button className="quick-tip-btn" onClick={handleTipClick} title="Tip Artist">
                ⚡
            </button>

            {showTipModal && (
                <TipModal
                    artist={{ pubkey: artist.pubkey, name: artist.name }}
                    onClose={() => setShowTipModal(false)}
                />
            )}

            <style jsx>{`
                .artist-card {
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                    height: 100%;
                    border: 1px solid transparent;
                }

                .artist-card:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: var(--accent-dim);
                    transform: translateY(-5px);
                    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
                }

                .artist-avatar-container {
                    width: 140px;
                    height: 140px;
                    border-radius: 50%;
                    margin-bottom: 1.25rem;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                    background: var(--secondary);
                }

                .artist-avatar {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.5s ease;
                }

                .artist-card:hover .artist-avatar {
                    transform: scale(1.1);
                }

                .artist-info {
                    width: 100%;
                }

                .artist-name {
                    font-size: 1.1rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .artist-stats {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    font-size: 0.85rem;
                    color: var(--muted);
                }

                .dot {
                    font-size: 0.5rem;
                }

                .stat-item {
                    font-weight: 500;
                }

                .quick-tip-btn {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: var(--accent);
                    color: black;
                    border: none;
                    font-weight: 900;
                    cursor: pointer;
                    opacity: 0;
                    transform: translateY(10px);
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    box-shadow: 0 4px 12px rgba(247, 147, 26, 0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .artist-card:hover .quick-tip-btn {
                    opacity: 1;
                    transform: translateY(0);
                }

                .quick-tip-btn:hover {
                    transform: scale(1.2) !important;
                    background: #fff;
                }

                @media (max-width: 768px) {
                    .artist-avatar-container {
                        width: 100px;
                        height: 100px;
                    }
                    .artist-card {
                        padding: 1rem;
                    }
                    .quick-tip-btn {
                        opacity: 1;
                        transform: none;
                    }
                }
            `}</style>
        </Link>
    );
}
