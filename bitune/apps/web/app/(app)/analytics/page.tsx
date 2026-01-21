'use client';

import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { KeyManager } from '@/lib/nostr/key-manager';
import { NostrSigner } from '@/lib/nostr/signer';

interface ChartData {
    date: string;
    amount: number;
}

interface TopTrack {
    id: string;
    title: string;
    plays: number;
}

interface AnalyticsData {
    stats: {
        totalStreams: number;
        totalSats: number;
        totalListeners: number;
    };
    chartData: ChartData[];
    topTracks: TopTrack[];
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const session = KeyManager.getSession();
            if (!session) {
                setError('Please log in to view analytics');
                setLoading(false);
                return;
            }

            try {
                // Sign GET Request for Auth
                const event = {
                    kind: 27235,
                    created_at: Math.floor(Date.now() / 1000),
                    tags: [['u', window.location.origin + '/api/analytics'], ['method', 'GET']],
                    content: ''
                };
                const signedEvent = await NostrSigner.sign(event);
                const token = btoa(JSON.stringify(signedEvent));

                const res = await fetch('/api/analytics', {
                    headers: { 'Authorization': `Nostr ${token}` }
                });

                if (res.ok) {
                    const jsonData = await res.json();
                    setData(jsonData);
                } else {
                    const err = await res.json();
                    setError(err.error || 'Failed to fetch analytics');
                }
            } catch (error) {
                console.error("Analytics Fetch Error", error);
                setError('Failed to connect to analytics service');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="p-12 text-center">Loading Analytics...</div>;

    if (error) return (
        <div className="p-12 text-center text-muted">
            <h2>Analytics Unavailable</h2>
            <p>{error}</p>
        </div>
    );

    if (!data) return null;

    return (
        <div className="page-container glass-card fade-in">
            <h1 className="text-3xl font-bold mb-8">Artist Dashboard</h1>

            {/* Stats Cards */}
            <div className="stats-grid mb-12">
                <div className="stat-card glass">
                    <div className="stat-label">Total Earnings</div>
                    <div className="stat-value text-accent">{data.stats.totalSats.toLocaleString()} <span className="stat-unit">sats</span></div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-label">Total Streams</div>
                    <div className="stat-value">{data.stats.totalStreams.toLocaleString()}</div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-label">Unique Listeners</div>
                    <div className="stat-value">{data.stats.totalListeners.toLocaleString()}</div>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Chart Section */}
                <div className="chart-section glass p-6 rounded-lg">
                    <h2 className="section-title mb-6">Earnings (Last 30 Days)</h2>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={data.chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#52525b"
                                    fontSize={12}
                                    tickFormatter={(val) => val.slice(5)} // Show MM-DD
                                    tickMargin={10}
                                />
                                <YAxis stroke="#52525b" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar dataKey="amount" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Tracks */}
                <div className="top-tracks-section glass p-6 rounded-lg">
                    <h2 className="section-title mb-6">Top Performing Tracks</h2>
                    <div className="track-list">
                        {data.topTracks.length > 0 ? (
                            data.topTracks.map((track, i) => (
                                <div key={track.id} className="top-track-item">
                                    <div className="rank">#{i + 1}</div>
                                    <div className="track-info">
                                        <div className="track-title">{track.title}</div>
                                    </div>
                                    <div className="play-count">{track.plays} plays</div>
                                </div>
                            ))
                        ) : (
                            <div className="text-muted text-sm">No stream data available yet.</div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .page-container {
                    padding: 2rem;
                    min-height: 80vh;
                }
                .text-accent { color: var(--accent); }
                .text-muted { color: var(--muted); }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 1.5rem;
                }
                
                .stat-card {
                    padding: 1.5rem;
                    border-radius: var(--radius-md);
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                
                .stat-label {
                    color: var(--muted);
                    font-size: 0.9rem;
                    font-weight: 500;
                }
                
                .stat-value {
                    font-size: 2rem;
                    font-weight: 700;
                }
                
                .stat-unit {
                    font-size: 1rem;
                    font-weight: 500;
                    color: var(--muted);
                }
                
                .dashboard-grid {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 1.5rem;
                }
                
                @media (max-width: 1024px) {
                    .dashboard-grid {
                        grid-template-columns: 1fr;
                    }
                }
                
                .section-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                }
                
                .top-track-item {
                    display: flex;
                    align-items: center;
                    padding: 1rem 0;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                
                .top-track-item:last-child {
                    border-bottom: none;
                }
                
                .rank {
                    font-weight: 700;
                    color: var(--accent);
                    width: 40px;
                }
                
                .track-info {
                    flex: 1;
                }
                
                .track-title {
                    font-weight: 500;
                }
                
                .play-count {
                    color: var(--muted);
                    font-size: 0.9rem;
                }
                
                .rounded-lg { border-radius: var(--radius-lg); }
                .p-6 { padding: 1.5rem; }
                .mb-6 { margin-bottom: 1.5rem; }
                .mb-8 { margin-bottom: 2rem; }
                .mb-12 { margin-bottom: 3rem; }
            `}</style>
        </div>
    );
}
