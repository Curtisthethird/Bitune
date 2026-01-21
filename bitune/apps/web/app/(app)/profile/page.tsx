'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { NostrSigner } from '../../../lib/nostr/signer';
import { KeyManager } from '../../../lib/nostr/key-manager';

interface User {
    pubkey: string;
    name?: string;
    about?: string;
    picture?: string;
    isArtist: boolean;
}

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');

    // Form State
    const [name, setName] = useState('');
    const [about, setAbout] = useState('');
    const [picture, setPicture] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const pubkey = await NostrSigner.getPublicKey();
            const res = await fetch(`/api/profile?pubkey=${pubkey}`);
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                setName(data.user.name || '');
                setAbout(data.user.about || '');
                setPicture(data.user.picture || '');
            } else {
                setUser({ pubkey, isArtist: false }); // New user view
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('Saving...');
        try {
            const pubkey = await NostrSigner.getPublicKey();
            const apiUrl = window.location.origin + '/api/profile';
            const event: any = {
                kind: 27235,
                created_at: Math.floor(Date.now() / 1000),
                tags: [['u', apiUrl], ['method', 'PUT']],
                content: '',
                pubkey
            };

            const signedEvent = await NostrSigner.sign(event);
            const token = btoa(JSON.stringify(signedEvent));

            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Nostr ${token}`
                },
                body: JSON.stringify({ name, about, picture })
            });

            if (!res.ok) throw new Error('Failed to save');

            setStatus('Saved!');
            setIsEditing(false);
            loadProfile();

        } catch (e: any) {
            setStatus('Error: ' + e.message);
        }
    };

    const [activeTab, setActiveTab] = useState('overview');

    if (loading) return <div className="loading-state">Loading profile...</div>;
    if (!user) return <div className="loading-state">Please login with Nostr extension (Alby)</div>;

    return (
        <div className="profile-page fade-in">
            {/* Banner Section */}
            <div className="profile-banner">
                <div className="banner-gradient"></div>
            </div>

            <div className="profile-content">
                {/* Header */}
                <div className="profile-header">
                    <div className="avatar-container glass">
                        {user.picture ? (
                            <img src={user.picture} alt={user.name} className="avatar-img" />
                        ) : (
                            <div className="avatar-placeholder">{user.name?.[0]?.toUpperCase() || '?'}</div>
                        )}
                    </div>

                    <div className="header-info">
                        <h1 className="profile-name">{user.name || 'Anonymous Artist'}</h1>
                        <div className="profile-meta">
                            <span className="pubkey-badge" title={user.pubkey}>
                                {user.pubkey.slice(0, 8)}...{user.pubkey.slice(-8)}
                            </span>
                            {user.isArtist && <span className="artist-badge">Verified Artist</span>}
                        </div>
                    </div>

                    <div className="header-actions">
                        <Link href="/upload" className="btn btn-primary">
                            Upload Track
                        </Link>
                        <button className="btn btn-secondary setting-btn" onClick={() => setActiveTab('settings')}>
                            ⚙️
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs-container">
                    <button
                        className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'tracks' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tracks')}
                    >
                        Tracks
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        Settings
                    </button>
                </div>

                {/* Content Area */}
                <div className="tab-content">
                    {activeTab === 'overview' && (
                        <div className="dashboard-grid">
                            <div className="stat-card glass-card">
                                <h3>Total Plays</h3>
                                <div className="stat-value text-gradient">12.5K</div>
                                <div className="stat-trend positive">↑ 12% this week</div>
                            </div>
                            <div className="stat-card glass-card">
                                <h3>Est. Revenue</h3>
                                <div className="stat-value text-gradient">1.2M Sats</div>
                                <div className="stat-trend positive">↑ 5% this week</div>
                            </div>
                            <div className="stat-card glass-card">
                                <h3>Engagement Score</h3>
                                <div className="stat-value text-gradient">98/100</div>
                                <div className="stat-trend">Top 1% of Artists</div>
                            </div>

                            <div className="bio-card glass-card">
                                <h3>About</h3>
                                <p>{user.about || "No bio information provided."}</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tracks' && (
                        <div className="tracks-grid">
                            {/* Mock Tracks for specific profile */}
                            {[1, 2, 3].map(i => (
                                <div key={i} className="simple-track-item glass-card">
                                    <div className="track-row">
                                        <div className="track-icon">🎵</div>
                                        <div className="track-info-simple">
                                            <div className="track-title-simple">Track Title {i}</div>
                                            <div className="track-date">Uploaded 2 days ago</div>
                                        </div>
                                        <div className="track-stats">
                                            <span>▶ 1.2k</span>
                                            <span>❤️ 500</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="settings-container glass-card">
                            <h3 className="section-title">Edit Profile</h3>
                            <div className="form-group">
                                <label>Display Name</label>
                                <input
                                    className="input-field glass"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Your Artist Name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Bio</label>
                                <textarea
                                    className="input-field glass textarea"
                                    value={about}
                                    onChange={e => setAbout(e.target.value)}
                                    placeholder="Tell your story..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Avatar URL</label>
                                <input
                                    className="input-field glass"
                                    value={picture}
                                    onChange={e => setPicture(e.target.value)}
                                />
                            </div>

                            <div className="settings-actions">
                                <button onClick={handleSave} className="btn btn-primary">{status || 'Save Changes'}</button>
                            </div>

                            <div className="divider"></div>

                            <div className="wallet-section">
                                <h3 className="section-title">Wallet & Keys</h3>
                                <Link href="/wallet" className="btn btn-secondary">Manage Wallet ⚡</Link>
                                <button
                                    onClick={() => {
                                        const session = KeyManager.getSession();
                                        if (session?.nsec) {
                                            if (window.confirm("SECURITY WARNING: Never share your private key. Copy to clipboard?")) {
                                                navigator.clipboard.writeText(session.nsec);
                                                alert("Copied!");
                                            }
                                        } else {
                                            alert("Logged in via Extension.");
                                        }
                                    }}
                                    className="text-link danger"
                                >
                                    Reveal Private Key
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .profile-page {
                    min-height: 100vh;
                }
                
                .profile-banner {
                    height: 300px;
                    width: 100%;
                    background: #111;
                    position: relative;
                }
                
                .banner-gradient {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(180deg, var(--accent-dim) 0%, var(--background) 100%);
                    opacity: 0.3;
                }

                .profile-content {
                    max-width: 1200px;
                    margin: 0 auto; /* Center horizontally */
                    padding: 0 2rem;
                    position: relative;
                    top: -100px; /* Overlap banner */
                }

                .profile-header {
                    display: flex;
                    align-items: flex-end;
                    gap: 2rem;
                    margin-bottom: 3rem;
                }

                .avatar-container {
                    width: 200px;
                    height: 200px;
                    border-radius: 50%;
                    padding: 6px;
                    background: var(--background);
                }

                .avatar-img {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    object-fit: cover;
                }
                
                .avatar-placeholder {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: var(--secondary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 5rem;
                    color: var(--muted);
                }

                .header-info {
                    flex: 1;
                    padding-bottom: 1rem;
                }

                .profile-name {
                    font-size: 3.5rem;
                    font-weight: 800;
                    margin-bottom: 0.5rem;
                    letter-spacing: -0.02em;
                }

                .profile-meta {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }

                .pubkey-badge {
                    background: rgba(255,255,255,0.1);
                    padding: 4px 12px;
                    border-radius: var(--radius-full);
                    font-family: monospace;
                    font-size: 0.85rem;
                    color: var(--muted);
                }

                .artist-badge {
                    color: var(--accent);
                    font-weight: 700;
                    font-size: 0.9rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .artist-badge::before {
                    content: '✓';
                }

                .header-actions {
                    padding-bottom: 1.5rem;
                    display: flex;
                    gap: 1rem;
                }
                
                .setting-btn {
                    padding: 0.75rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                }

                /* Tabs */
                .tabs-container {
                    display: flex;
                    gap: 2rem;
                    border-bottom: 1px solid var(--border);
                    margin-bottom: 2rem;
                }

                .tab-btn {
                    background: none;
                    border: none;
                    color: var(--muted);
                    font-size: 1rem;
                    font-weight: 500;
                    padding: 1rem 0;
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                    transition: all 0.2s;
                }

                .tab-btn:hover {
                    color: var(--foreground);
                }

                .tab-btn.active {
                    color: var(--accent);
                    border-bottom-color: var(--accent);
                }

                /* Dashboard */
                .dashboard-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1.5rem;
                }

                .stat-card {
                    padding: 1.5rem;
                }

                .stat-card h3 {
                    color: var(--muted);
                    font-size: 0.9rem;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                }

                .stat-value {
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                }

                .stat-trend {
                    font-size: 0.85rem;
                    color: var(--muted);
                }
                
                .stat-trend.positive {
                    color: var(--success);
                }

                .bio-card {
                    grid-column: 1 / -1;
                    padding: 2rem;
                }

                /* Tracks */
                .tracks-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .simple-track-item {
                    padding: 1rem 1.5rem;
                    display: flex;
                    align-items: center;
                    transition: transform 0.2s;
                    cursor: pointer;
                }
                
                .simple-track-item:hover {
                    transform: scale(1.01);
                    background: rgba(255,255,255,0.05);
                }

                .track-row {
                    display: flex;
                    align-items: center;
                    width: 100%;
                    gap: 1.5rem;
                }

                .track-icon {
                    width: 40px;
                    height: 40px;
                    background: var(--secondary);
                    border-radius: var(--radius-sm);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .track-info-simple {
                    flex: 1;
                }
                
                .track-title-simple {
                    font-weight: 600;
                    margin-bottom: 0.25rem;
                }
                
                .track-date {
                    font-size: 0.8rem;
                    color: var(--muted);
                }
                
                .track-stats {
                    display: flex;
                    gap: 1.5rem;
                    color: var(--muted);
                    font-size: 0.9rem;
                }

                /* Settings */
                .settings-container {
                    max-width: 600px;
                    padding: 2.5rem;
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: var(--muted);
                    font-size: 0.9rem;
                }

                .input-field {
                    width: 100%;
                    padding: 0.8rem;
                    border-radius: var(--radius-md);
                    color: var(--foreground);
                    font-size: 1rem;
                    outline: none;
                    border: 1px solid var(--border);
                }
                
                .input-field:focus {
                     border-color: var(--accent);
                }
                
                .textarea {
                    height: 120px;
                    resize: none;
                }
                
                .divider {
                    height: 1px;
                    background: var(--border);
                    margin: 2rem 0;
                }
                
                .wallet-section {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                    flex-wrap: wrap;
                }
                
                .text-link {
                    background: none;
                    border: none;
                    color: var(--accent);
                    text-decoration: underline;
                    cursor: pointer;
                    font-size: 0.9rem;
                }
                
                .text-link.danger {
                    color: #ef4444; 
                    margin-left: auto;
                }
            `}</style>
        </div>
    );
}
