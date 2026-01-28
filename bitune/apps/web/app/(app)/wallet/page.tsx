'use client';

import { useState, useEffect } from 'react';
import { NostrSigner } from '@/lib/nostr/signer';

interface WalletInfo {
    connected: boolean;
    balance?: number;
    updatedAt?: string;
    error?: string;
}

export default function WalletPage() {
    const [nwcUrl, setNwcUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [wallet, setWallet] = useState<WalletInfo | null>(null);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        try {
            const event = {
                kind: 27235,
                created_at: Math.floor(Date.now() / 1000),
                tags: [['u', window.location.origin + '/api/wallet'], ['method', 'GET']],
                content: ''
            };
            const signedEvent = await NostrSigner.sign(event);
            const token = btoa(JSON.stringify(signedEvent));

            const res = await fetch('/api/wallet', {
                headers: { 'Authorization': `Nostr ${token}` }
            });
            const data = await res.json();
            setWallet(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleConnect = async () => {
        if (!nwcUrl) return;
        setLoading(true);
        setStatus('Connecting...');
        try {
            const pubkey = await NostrSigner.getPublicKey();
            const res = await fetch('/api/wallet/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nwcUrl, pubkey }),
            });

            if (res.ok) {
                setStatus('Connected successfully!');
                setNwcUrl('');
                checkConnection();
            } else {
                setStatus('Failed to connect.');
            }
        } catch (e) {
            setStatus('Error connecting wallet.');
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (!withdrawAmount) return;
        setLoading(true);
        setStatus('Processing withdrawal...');
        try {
            const event = {
                kind: 27235,
                created_at: Math.floor(Date.now() / 1000),
                tags: [['u', window.location.origin + '/api/wallet/withdraw'], ['method', 'POST']],
                content: ''
            };
            const signedEvent = await NostrSigner.sign(event);
            const token = btoa(JSON.stringify(signedEvent));

            const res = await fetch('/api/wallet/withdraw', {
                method: 'POST',
                headers: {
                    'Authorization': `Nostr ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amountSats: Number(withdrawAmount) })
            });

            if (res.ok) {
                setStatus('Withdrawal simulated successfully!');
                setWithdrawAmount('');
                checkConnection(); // Refresh balance
            } else {
                const err = await res.json();
                setStatus('Withdrawal failed: ' + err.error);
            }
        } catch (e) {
            setStatus('Error processing withdrawal.');
        } finally {
            setLoading(false);
        }
    };

    if (!wallet) return <div className="p-12 text-center text-muted">Loading Wallet...</div>;

    return (
        <div className="page-container glass-card fade-in">
            <h1 className="page-title">Wallet & Payouts</h1>

            {!wallet.connected ? (
                <div className="connect-section">
                    <div className="info-box glass">
                        <h3>Connect Lightning Wallet</h3>
                        <p>Enable instant payouts by connecting your wallet via NWC (Nostr Wallet Connect).</p>
                        <p className="sub-text">We verify your balance but never see your seed phrase.</p>

                        <div className="input-group">
                            <input
                                type="password"
                                value={nwcUrl}
                                onChange={e => setNwcUrl(e.target.value)}
                                placeholder="nostr+walletconnect://..."
                                className="nwc-input"
                            />
                            <button
                                className="btn-primary"
                                onClick={handleConnect}
                                disabled={loading || !nwcUrl}
                            >
                                {loading ? 'Connecting...' : 'Connect Wallet'}
                            </button>
                        </div>
                        <p className="status-msg">{status}</p>
                    </div>

                    <div className="providers-list">
                        <h4>Supported Wallets</h4>
                        <div className="providers">
                            <a href="https://getalby.com/" target="_blank" className="provider-pill">Alby</a>
                            <a href="https://mutinywallet.com/" target="_blank" className="provider-pill">Mutiny</a>
                            <a href="https://nwc.getalby.com/" target="_blank" className="provider-pill">NWC Adapter</a>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="wallet-dashboard">
                    <div className="balance-card glass">
                        <div className="card-header">
                            <h2>My Wallet</h2>
                            <div className="status-badge connected">Connected</div>
                        </div>

                        <div className="balance-info">
                            <span className="label">Available Balance</span>
                            <div className="amount">
                                {wallet.balance?.toLocaleString()} <span className="unit">sats</span>
                            </div>
                        </div>

                        <div className="withdraw-actions">
                            <input
                                type="number"
                                placeholder="Amount to withdraw"
                                value={withdrawAmount}
                                onChange={e => setWithdrawAmount(e.target.value)}
                                className="withdraw-input"
                            />
                            <button
                                className="btn-primary"
                                onClick={handleWithdraw}
                                disabled={loading || !withdrawAmount}
                            >
                                Withdraw
                            </button>
                        </div>
                        {status && <div className="status-msg mt-4">{status}</div>}
                    </div>

                    <div className="history-section glass p-6 rounded-lg">
                        <h3>Payout History</h3>
                        <div className="history-list">
                            <div className="history-item">
                                <span className="date">Today</span>
                                <span className="desc">Streaming Payouts</span>
                                <span className="amount positive">+5,200 sats</span>
                            </div>
                            {/* Mock history items */}
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .page-container {
                    padding: 2rem;
                    max-width: 800px;
                    margin: 0 auto;
                    min-height: 80vh;
                }
                
                .page-title {
                    font-size: 2rem;
                    font-weight: 800;
                    margin-bottom: 2rem;
                    background: linear-gradient(to right, #fff, var(--muted));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .connect-section {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                .info-box {
                    padding: 2rem;
                    border-radius: var(--radius-lg);
                    border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(20,20,20,0.6);
                }

                h3 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; color: #fff; }
                p { color: var(--muted); margin-bottom: 1.5rem; line-height: 1.5; }
                .sub-text { font-size: 0.85rem; margin-top: -1rem; margin-bottom: 2rem; }

                .input-group {
                    display: flex;
                    gap: 1rem;
                }

                .nwc-input {
                    flex: 1;
                    padding: 12px 16px;
                    background: rgba(0,0,0,0.3);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    color: #fff;
                    font-family: monospace;
                    transition: border-color 0.2s;
                }
                .nwc-input:focus {
                    outline: none;
                    border-color: var(--accent);
                }

                .providers-list h4 {
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--muted);
                    margin-bottom: 1rem;
                }

                .providers {
                    display: flex;
                    gap: 1rem;
                }

                .provider-pill {
                    padding: 8px 16px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 20px;
                    color: var(--accent);
                    font-size: 0.9rem;
                    text-decoration: none;
                    transition: all 0.2s;
                }
                .provider-pill:hover {
                    background: var(--accent);
                    color: #000;
                }

                /* Wallet Dashboard */
                .wallet-dashboard {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                .balance-card {
                    padding: 2rem;
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--accent);
                    position: relative;
                    overflow: hidden;
                }
                .balance-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 5px;
                    background: var(--accent);
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                .card-header h2 { font-size: 1.5rem; font-weight: 700; margin: 0; }
                
                .status-badge {
                    padding: 4px 12px;
                    border-radius: 100px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .status-badge.connected {
                    background: rgba(76, 175, 80, 0.2);
                    color: #4caf50;
                    border: 1px solid #4caf50;
                }

                .balance-info { margin-bottom: 2rem; }
                .label { display: block; font-size: 0.9rem; color: var(--muted); margin-bottom: 0.5rem; }
                .amount { font-size: 3rem; font-weight: 800; color: #fff; }
                .unit { font-size: 1rem; color: var(--accent); font-weight: 600; margin-left: 4px; }

                .withdraw-actions {
                    display: flex;
                    gap: 1rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid rgba(255,255,255,0.1);
                }

                .withdraw-input {
                    padding: 12px 16px;
                    background: rgba(0,0,0,0.3);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    color: #fff;
                    width: 150px;
                }

                .btn-primary {
                    background: var(--accent);
                    color: #000;
                    border: none;
                    padding: 0 24px;
                    border-radius: 8px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
                .btn-primary:hover:not(:disabled) { transform: scale(1.02); }

                .history-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 1rem 0;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .date { color: var(--muted); font-size: 0.9rem; }
                .amount.positive { color: #4caf50; font-weight: 600; }
                .status-msg { color: var(--accent); font-size: 0.9rem; margin-top: 0.5rem; }
            `}</style>
        </div>
    );
}
