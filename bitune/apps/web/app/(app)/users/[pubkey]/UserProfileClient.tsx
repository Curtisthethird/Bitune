'use client';

import { useEffect, useState, use } from 'react';
import FollowButton from '@/components/FollowButton';

interface UserProfile {
    pubkey: string;
    name: string | null;
    about: string | null;
    picture: string | null;
    isArtist: boolean;
    _count: {
        followers: number;
        following: number;
        tracks: number;
    }
}

export default function UserProfilePage({ params }: { params: Promise<{ pubkey: string }> }) {
    const { pubkey } = use(params);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (pubkey) fetchProfile();
    }, [pubkey]);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`/api/users/${pubkey}`);
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="page-container" style={{ padding: '5rem' }}>
            <div className="glass glass-card p-10">Loading profile...</div>
        </div>
    );

    if (!profile) return (
        <div className="page-container" style={{ padding: '5rem' }}>
            <div className="glass glass-card p-10">User not found</div>
        </div>
    );

    return (
        <div className="page-container">
            <div className="profile-header glass-card">
                <div className="profile-cover">
                    {/* Placeholder gradient cover if no image */}
                </div>
                <div className="profile-info-row">
                    <div className="profile-avatar-wrapper">
                        <img
                            src={profile.picture || '/default-avatar.png'}
                            alt={profile.name || 'User'}
                            className="profile-avatar"
                            onError={(e) => (e.target as HTMLImageElement).src = '/default-avatar.png'}
                        />
                    </div>
                    <div className="profile-details">
                        <h1 className="profile-name">{profile.name || 'Anonymous User'}</h1>
                        <p className="profile-bio">{profile.about || 'No bio yet.'}</p>

                        <div className="profile-stats">
                            <div className="stat">
                                <span className="stat-val">{profile._count.followers}</span>
                                <span className="stat-label">Followers</span>
                            </div>
                            <div className="stat">
                                <span className="stat-val">{profile._count.following}</span>
                                <span className="stat-label">Following</span>
                            </div>
                            {profile.isArtist && (
                                <div className="stat">
                                    <span className="stat-val">{profile._count.tracks}</span>
                                    <span className="stat-label">Tracks</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="profile-actions">
                        <FollowButton targetPubkey={profile.pubkey} />
                    </div>
                </div>
            </div>

            <style jsx>{`
                .page-container {
                     max-width: 1200px;
                     margin: 0 auto;
                     padding: 2rem;
                     padding-bottom: 120px;
                }
                .glass-card {
                    padding: 0; /* Reset for header layout */
                    overflow: hidden;
                }
                .profile-cover {
                    height: 200px;
                    background: linear-gradient(45deg, var(--secondary), var(--background));
                    border-bottom: 1px solid var(--border);
                }
                .profile-info-row {
                    padding: 0 2rem 2rem 2rem;
                    display: flex;
                    align-items: flex-end;
                    margin-top: -60px;
                    gap: 2rem;
                    flex-wrap: wrap;
                }
                .profile-avatar-wrapper {
                    width: 160px;
                    height: 160px;
                    border-radius: 50%;
                    border: 4px solid var(--background);
                    background: var(--secondary);
                    overflow: hidden;
                    z-index: 2;
                }
                .profile-avatar {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .profile-details {
                    flex: 1;
                    padding-bottom: 10px;
                    min-width: 250px;
                }
                .profile-name {
                    font-size: 2rem;
                    font-weight: 800;
                    margin-bottom: 0.5rem;
                }
                .profile-bio {
                    color: var(--muted);
                    font-size: 0.95rem;
                    max-width: 600px;
                    margin-bottom: 1rem;
                }
                .profile-stats {
                    display: flex;
                    gap: 2rem;
                }
                .stat {
                    display: flex;
                    flex-direction: column;
                }
                .stat-val {
                    font-weight: 700;
                    font-size: 1.1rem;
                }
                .stat-label {
                    font-size: 0.8rem;
                    color: var(--muted);
                }
                .profile-actions {
                    padding-bottom: 20px;
                }

                @media (max-width: 768px) {
                    .page-container {
                        padding: 0;
                        padding-bottom: 140px; /* Space for player + nav */
                    }
                    
                    .glass-card {
                        border-radius: 0;
                        border-left: none;
                        border-right: none;
                    }

                    .profile-info-row {
                        margin-top: -50px;
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                        gap: 1rem;
                    }

                    .profile-avatar-wrapper {
                        width: 120px;
                        height: 120px;
                        border-width: 3px;
                    }

                    .profile-details {
                        width: 100%;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }

                    .profile-name {
                        font-size: 1.75rem;
                    }

                    .profile-stats {
                        justify-content: center;
                        gap: 1.5rem;
                        margin-bottom: 1.5rem;
                    }

                    .profile-actions {
                        width: 100%;
                        display: flex;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
}
