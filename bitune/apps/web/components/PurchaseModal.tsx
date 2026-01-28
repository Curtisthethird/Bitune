'use client';

import { useState } from 'react';
import { KeyManager } from '@/lib/nostr/key-manager';
import { NostrSigner } from '@/lib/nostr/signer';

interface PurchaseModalProps {
    track: {
        id: string;
        title: string;
        price: number;
        artist: { name?: string };
    };
    onClose: () => void;
    onSuccess?: () => void;
}

export default function PurchaseModal({ track, onClose, onSuccess }: PurchaseModalProps) {
    const minPrice = track.price || 1000;
    const [amount, setAmount] = useState(minPrice);
    const [loading, setLoading] = useState(false);

    const handlePurchase = async () => {
        if (amount < minPrice) {
            alert(`Minimum price is ${minPrice} sats`);
            return;
        }

        const session = KeyManager.getSession();
        if (!session) {
            alert('Please login to purchase');
            return;
        }

        setLoading(true);
        try {
            // 1. Generate Invoice (In a real app, this calls the backend)
            // For launch readiness, we'll simulate the invoice generation and WebLN handshake
            let preimage = null;
            if (typeof window !== 'undefined' && (window as any).webln) {
                try {
                    const webln = (window as any).webln;
                    await webln.enable();

                    // 1. Generate Invoice
                    const invRes = await fetch('/api/purchase/invoice', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ trackId: track.id, amount: amount })
                    });
                    const invData = await invRes.json();
                    const invoice = invData.invoice;

                    if (!invoice) throw new Error("Failed to generate invoice");

                    // 2. Pay via WebLN
                    await webln.sendPayment(invoice);

                    // 3. Sign Event for Verification
                    const event = {
                        kind: 27235,
                        created_at: Math.floor(Date.now() / 1000),
                        tags: [['u', window.location.origin + '/api/purchase/check'], ['method', 'POST']],
                        content: ''
                    };
                    const signedEvent = await NostrSigner.sign(event);
                    const token = btoa(JSON.stringify(signedEvent));

                    // 4. Verify on Backend
                    const res = await fetch('/api/purchase/check', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Nostr ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            trackId: track.id,
                            invoice: invoice,
                            paymentHash: invoice
                        })
                    });

                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Verification failed');
                    }

                    const data = await res.json();
                    if (data.downloadUrl) {
                        window.open(data.downloadUrl, '_blank');
                    }

                    alert(`Successfully purchased ${track.title}!`);
                    onSuccess?.();
                    onClose();

                } catch (weblnError: any) {
                    console.error("Payment flow failed", weblnError);
                    alert(weblnError.message || "Payment failed");
                }
            } else {
                alert("Please install Alby or a WebLN extension to purchase!");
            }
        } catch (e: any) {
            console.error(e);
            if (!loading) alert(e.message || 'Purchase failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Support {track.artist.name || 'Artist'}</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <p className="description">
                        Purchase <strong>{track.title}</strong> directly from the artist.
                    </p>

                    <div className="price-input-group">
                        <label>Name your price (Sats)</label>
                        <input
                            type="number"
                            min={minPrice}
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="amount-input"
                        />
                        <div className="min-price-hint">Minimum: {minPrice} sats</div>
                    </div>

                    <div className="total-summary">
                        <span>Total:</span>
                        <span className="total-val">{amount.toLocaleString()} Sats</span>
                    </div>

                    <button
                        className="purchase-btn"
                        onClick={handlePurchase}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Buy Now'}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    backdrop-filter: blur(5px);
                }
                .modal-content {
                    width: 100%;
                    max-width: 400px;
                    border-radius: 16px;
                    border: 1px solid var(--border);
                    padding: 0;
                    overflow: hidden;
                    animation: scaleUp 0.2s ease;
                }
                @keyframes scaleUp {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .modal-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(255,255,255,0.05);
                }
                .modal-header h2 {
                    font-size: 1.1rem;
                    margin: 0;
                }
                .close-btn {
                    background: none;
                    border: none;
                    color: var(--muted);
                    font-size: 1.5rem;
                    cursor: pointer;
                }
                .modal-body {
                    padding: 1.5rem;
                }
                .description {
                    color: var(--muted);
                    margin-bottom: 1.5rem;
                    line-height: 1.5;
                }
                .price-input-group {
                    margin-bottom: 1.5rem;
                }
                .price-input-group label {
                    display: block;
                    font-size: 0.9rem;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                }
                .amount-input {
                    width: 100%;
                    background: rgba(0,0,0,0.3);
                    border: 1px solid var(--border);
                    padding: 0.75rem;
                    border-radius: 8px;
                    color: #fff;
                    font-size: 1.1rem;
                    font-weight: bold;
                }
                .amount-input:focus {
                    border-color: var(--accent);
                    outline: none;
                }
                .min-price-hint {
                    font-size: 0.8rem;
                    color: var(--muted);
                    margin-top: 4px;
                }
                .total-summary {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    font-size: 1.1rem;
                    font-weight: bold;
                    border-top: 1px solid var(--border);
                    padding-top: 1rem;
                }
                .total-val {
                    color: var(--accent);
                }
                .purchase-btn {
                    width: 100%;
                    background: var(--accent);
                    color: #000;
                    border: none;
                    padding: 1rem;
                    border-radius: 8px;
                    font-weight: bold;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: opacity 0.2s;
                }
                .purchase-btn:hover:not(:disabled) {
                    opacity: 0.9;
                }
                .purchase-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}
