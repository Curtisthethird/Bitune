'use client';

import { useState } from 'react';
import { KeyManager } from '@/lib/nostr/key-manager';
import { NostrSigner } from '@/lib/nostr/signer';

interface TipModalProps {
    artist: { pubkey: string; name?: string };
    onClose: () => void;
}

export default function TipModal({ artist, onClose }: TipModalProps) {
    const [amount, setAmount] = useState(100);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTip = async () => {
        if (amount < 1) {
            alert(`Minimum tip is 1 sat`);
            return;
        }

        const session = KeyManager.getSession();
        if (!session) {
            alert('Please login to tip');
            return;
        }

        setLoading(true);
        try {
            if (typeof window !== 'undefined' && (window as any).webln) {
                try {
                    const webln = (window as any).webln;
                    await webln.enable();

                    const event = {
                        kind: 27235,
                        created_at: Math.floor(Date.now() / 1000),
                        tags: [['u', window.location.origin + '/api/tip/invoice'], ['method', 'POST']],
                        content: ''
                    };
                    const signedEvent = await NostrSigner.sign(event);
                    const token = btoa(JSON.stringify(signedEvent));

                    const invRes = await fetch('/api/tip/invoice', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Nostr ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            artistPubkey: artist.pubkey,
                            amountSats: amount,
                            message
                        })
                    });
                    const { invoice } = await invRes.json();

                    if (!invoice) throw new Error("Failed to generate invoice");

                    await webln.sendPayment(invoice);

                    alert(`Sent ${amount} sats to ${artist.name || 'Artist'}!`);
                    onClose();
                } catch (weblnError) {
                    console.error("WebLN failed", weblnError);
                    alert("Payment failed or cancelled");
                }
            } else {
                alert("Please install Alby or a WebLN extension to tip!");
            }

        } catch (e: any) {
            console.error(e);
            alert(e.message || 'Tip failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="tip-modal-overlay" onClick={onClose}>
            <div className="tip-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Tip {artist.name || 'Artist'}</h3>
                    <button onClick={onClose} className="close-btn">✕</button>
                </div>

                <div className="input-section">
                    <label>Amount (Sats)</label>
                    <input
                        type="number"
                        min="1"
                        value={amount}
                        onChange={e => setAmount(Number(e.target.value))}
                        className="amount-input"
                    />
                    <div className="presets">
                        {[100, 500, 1000, 5000].map(val => (
                            <button key={val} onClick={() => setAmount(val)} className="preset-btn">
                                ⚡ {val.toLocaleString()}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="input-section">
                    <label>Message (Optional)</label>
                    <input
                        type="text"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Say something nice..."
                        className="message-input"
                    />
                </div>

                <button
                    onClick={handleTip}
                    disabled={loading}
                    className="tip-submit-btn"
                >
                    {loading ? 'Sending...' : `Send ${amount.toLocaleString()} Sats ⚡`}
                </button>
            </div>

            <style jsx>{`
                .tip-modal-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 3000;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                    animation: fadeIn 0.3s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .tip-modal-content {
                    background: #111;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    width: 100%;
                    max-width: 400px;
                    padding: 2rem;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                @keyframes scaleUp {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                .modal-header h3 {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #fff;
                }

                .close-btn {
                    background: transparent;
                    border: none;
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 1.2rem;
                    cursor: pointer;
                    transition: color 0.2s;
                }

                .close-btn:hover {
                    color: #fff;
                }

                .input-section {
                    margin-bottom: 1.5rem;
                }

                .input-section label {
                    display: block;
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.6);
                    margin-bottom: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .amount-input, .message-input {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 1rem;
                    border-radius: 12px;
                    color: #fff;
                    font-family: inherit;
                    font-size: 1.1rem;
                    transition: all 0.2s;
                }

                .amount-input {
                    font-weight: 800;
                    font-size: 1.5rem;
                    color: var(--accent);
                }

                .amount-input:focus, .message-input:focus {
                    outline: none;
                    border-color: var(--accent);
                    background: rgba(255, 255, 255, 0.08);
                }

                .presets {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 0.5rem;
                    margin-top: 0.75rem;
                }

                .preset-btn {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #fff;
                    padding: 0.5rem;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .preset-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: var(--accent);
                }

                .tip-submit-btn {
                    width: 100%;
                    padding: 1.25rem;
                    background: var(--accent);
                    color: #000;
                    border: none;
                    border-radius: 12px;
                    font-size: 1.1rem;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-top: 1rem;
                }

                .tip-submit-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(247, 147, 26, 0.3);
                }

                .tip-submit-btn:active {
                    transform: translateY(0);
                }

                .tip-submit-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}
