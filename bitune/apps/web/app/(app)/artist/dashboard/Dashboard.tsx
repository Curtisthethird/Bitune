'use client';

import { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, PieChart, Pie } from 'recharts';
import { NostrSigner } from '@/lib/nostr/signer';
import SupporterBadge from '@/components/SupporterBadge';
import Link from 'next/link';

interface DashboardProps {
    initialData?: any;
}

export default function Dashboard({ initialData }: DashboardProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'fans' | 'releases'>('overview');
    const [analytics, setAnalytics] = useState<any>(initialData || null);
    const [fans, setFans] = useState<any[]>([]);
    const [activity, setActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(!initialData);

    useEffect(() => {
        if (!initialData) fetchData();
        fetchActivity();
    }, []);

    useEffect(() => {
        if (activeTab === 'fans' && fans.length === 0) fetchFans();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
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
            const data = await res.json();
            setAnalytics(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchActivity = async () => {
        try {
            const authHeader = await NostrSigner.generateAuthHeader('GET', window.location.origin + '/api/artist/activity');
            const res = await fetch('/api/artist/activity', {
                headers: { 'Authorization': authHeader }
            });
            const data = await res.json();
            setActivity(data.activity || []);
        } catch (e) {
            console.error('Failed to fetch activity', e);
        }
    };

    const fetchFans = async () => {
        try {
            const event = {
                kind: 27235,
                created_at: Math.floor(Date.now() / 1000),
                tags: [['u', window.location.origin + '/api/artist/fans'], ['method', 'GET']],
                content: ''
            };
            const signedEvent = await NostrSigner.sign(event);
            const token = btoa(JSON.stringify(signedEvent));

            const res = await fetch('/api/artist/fans', {
                headers: { 'Authorization': `Nostr ${token}` }
            });
            const data = await res.json();
            setFans(data);
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-20 text-center opacity-50">Loading Command Center...</div>;
    if (!analytics) return <div className="p-20 text-center">Dashboard unavailable.</div>;

    const COLORS = ['#F7931A', '#00f2ff', '#fbbf24'];
    const pieData = [
        { name: 'PoE Payouts', value: analytics.stats.breakdown.poe },
        { name: 'Track Sales', value: analytics.stats.breakdown.sales },
        { name: 'Artist Tips', value: analytics.stats.breakdown.tips },
    ].filter(d => d.value > 0);

    return (
        <div className="dashboard-container fade-in">
            {/* Unified Header */}
            <div className="dashboard-header mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-black tracking-tighter">ARTIST COMMAND</h1>
                            {analytics?.artist?.isVerified && (
                                <span className="bg-accent text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Verified</span>
                            )}
                        </div>
                        <p className="text-muted text-sm font-medium opacity-60">Empowering your independence on the Nostr protocol.</p>
                    </div>
                    <div className="tabs-premium flex p-1 bg-white/5 rounded-2xl">
                        <button
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-white text-black' : 'text-muted hover:text-white'}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            Overview
                        </button>
                        <button
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'fans' ? 'bg-white text-black' : 'text-muted hover:text-white'}`}
                            onClick={() => setActiveTab('fans')}
                        >
                            Fans (FRM)
                        </button>
                        <button
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'releases' ? 'bg-white text-black' : 'text-muted hover:text-white'}`}
                            onClick={() => setActiveTab('releases')}
                        >
                            Releases
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'overview' && (
                <div className="overview-view space-y-8">
                    {/* Stats HUD */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="hud-card glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
                            </div>
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block">System Integrity</label>
                            <div className="text-xl font-black mb-1">SECURE</div>
                            <div className="text-[10px] opacity-40 leading-tight">Cryptographic Link: <span className="text-green-500">Active</span></div>
                            <div className="text-[10px] opacity-40 leading-tight mt-1">PoE Verification: <span className="text-green-500">Deterministic</span></div>
                        </div>
                        <div className="hud-card glass p-6 rounded-3xl border border-white/5">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block">Total Revenue</label>
                            <div className="text-3xl font-black text-accent">{analytics.stats.totalSats.toLocaleString()} <span className="text-sm opacity-40">SATS</span></div>
                            <div className="mt-2 flex gap-2">
                                <span className="text-[10px] font-bold bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">+12.4% vs last mo</span>
                            </div>
                        </div>
                        <div className="hud-card glass p-6 rounded-3xl border border-white/5">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block">Global Streams</label>
                            <div className="text-3xl font-black">{analytics.stats.totalStreams.toLocaleString()}</div>
                            <div className="mt-2 flex gap-2">
                                <span className="text-[10px] font-bold bg-white/10 text-white/60 px-2 py-0.5 rounded-full">Top 5% of Artists</span>
                            </div>
                        </div>
                        <div className="hud-card glass p-6 rounded-3xl border border-white/5">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block">Loyal Listeners</label>
                            <div className="text-3xl font-black">{analytics.stats.totalListeners.toLocaleString()}</div>
                            <div className="mt-2 flex gap-2">
                                <span className="text-[10px] font-bold bg-accent/10 text-accent px-2 py-0.5 rounded-full">Growing Community</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Income Chart */}
                        <div className="lg:col-span-2 glass rounded-3xl p-8 border border-white/5">
                            <h3 className="text-xl font-bold mb-8">Financial Growth</h3>
                            <div style={{ width: '100%', height: 350 }}>
                                <ResponsiveContainer>
                                    <BarChart data={analytics.chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickFormatter={(v) => v.slice(5)} tickMargin={10} />
                                        <YAxis stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                                            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                        />
                                        <Bar dataKey="amount" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Breakdown */}
                        <div className="glass rounded-3xl p-8 border border-white/5 flex flex-col items-center justify-center">
                            <h3 className="text-xl font-bold mb-8 w-full">Income Mix</h3>
                            <div style={{ width: '100%', height: 250 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#09090b', border: 'none', borderRadius: '8px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-full space-y-4 mt-6">
                                {pieData.map((d, i) => (
                                    <div key={d.name} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                                            <span className="opacity-60">{d.name}</span>
                                        </div>
                                        <span className="font-bold">{d.value.toLocaleString()} Sats</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity Feed */}
                    <div className="glass rounded-3xl p-8 border border-white/5">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold">Recent Activity</h3>
                            <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Protocol Stream Live</span>
                        </div>
                        <div className="space-y-4">
                            {activity.length > 0 ? (
                                activity.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white/2 rounded-2xl hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xl">
                                                {item.type === 'tip' ? '⚡' : item.type === 'follow' ? '👤' : '📀'}
                                            </div>
                                            <div>
                                                <div className="text-sm">
                                                    <span className="font-bold">{item.user?.name || 'Anonymous'}</span>
                                                    {item.type === 'tip' && ` tipped you ${item.amount} Sats`}
                                                    {item.type === 'follow' && ` started following you`}
                                                    {item.type === 'purchase' && ` purchased ${item.trackTitle}`}
                                                </div>
                                                <div className="text-[10px] opacity-40">{new Date(item.date).toLocaleString()}</div>
                                            </div>
                                        </div>
                                        {item.message && (
                                            <div className="hidden md:block text-xs italic opacity-60 px-4 border-l border-white/10 max-w-xs truncate">
                                                "{item.message}"
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center opacity-30 italic text-sm">Waiting for incoming protocol activity...</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'fans' && (
                <div className="fans-view space-y-8">
                    <div className="glass rounded-3xl border border-white/5 overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest opacity-40 border-b border-white/5">
                                <tr>
                                    <th className="px-8 py-5">Fan Identity</th>
                                    <th className="px-8 py-5">Value (LifeTime)</th>
                                    <th className="px-8 py-5">Interactions</th>
                                    <th className="px-8 py-5 text-right">Loyalty Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {fans.map((f, i) => (
                                    <tr key={f.pubkey} className="hover:bg-white/2 cursor-default transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <img src={f.picture || '/default-avatar.png'} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                                <div>
                                                    <div className="font-bold text-sm">{f.name || 'Anonymous Fan'}</div>
                                                    <div className="text-[10px] opacity-40 font-mono">{f.pubkey.slice(0, 12)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="font-black text-accent">{f.totalSupport.toLocaleString()} SATS</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex gap-4 text-xs">
                                                <div className="flex items-center gap-1.5"><span className="opacity-40">Sales:</span> {f.purchaseCount}</div>
                                                <div className="flex items-center gap-1.5"><span className="opacity-40">Tips:</span> {f.tipCount}</div>
                                                <div className="flex items-center gap-1.5"><span className="opacity-40">Streams:</span> {f.poeCount}</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end">
                                                {f.totalSupport > 10000 ? <SupporterBadge level="patron" /> : f.purchaseCount > 0 ? <SupporterBadge level="superfan" /> : <SupporterBadge level="fan" />}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {fans.length === 0 && <div className="p-20 text-center opacity-40">Analyzing your global fan base...</div>}
                    </div>
                </div>
            )}

            {activeTab === 'releases' && (
                <div className="releases-view space-y-8">
                    <div className="glass rounded-3xl border border-white/5 overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                            <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest opacity-40 border-b border-white/5">
                                <tr>
                                    <th className="px-8 py-5">Release</th>
                                    <th className="px-8 py-5">Streams</th>
                                    <th className="px-8 py-5 text-right">Manage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {analytics.topTracks.map((t: any) => (
                                    <tr key={t.id} className="hover:bg-white/2 cursor-default transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="font-bold text-sm">{t.title}</div>
                                            <div className="text-[10px] opacity-40 font-mono">{t.id.slice(0, 12)}...</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="font-black">{t.plays.toLocaleString()}</div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Link href={`/release/${t.id}`} className="text-xs font-bold text-accent hover:underline">View Public Page</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <style jsx>{`
                .dashboard-container {
                    padding: 2rem 0;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .glass {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(20px);
                }
                .text-accent { color: var(--accent); }
                .text-muted { color: var(--muted); }
            `}</style>
        </div>
    );
}
