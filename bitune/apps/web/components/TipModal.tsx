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

                    // 1. Get Tip Invoice (via our server acting as NWC proxy)
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

                    // 2. Pay via WebLN
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
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Tip {artist.name || 'Artist'}</h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">✕</button>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Amount (Sats)</label>
                    <input
                        type="number"
                        min="1"
                        value={amount}
                        onChange={e => setAmount(Number(e.target.value))}
                        className="w-full bg-black/20 border border-zinc-700 rounded px-3 py-2 text-lg font-bold"
                    />
                    <div className="flex gap-2 mt-2">
                        {[100, 500, 1000, 5000].map(val => (
                            <button key={val} onClick={() => setAmount(val)} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded">
                                ⚡ {val}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">Message (Optional)</label>
                    <input
                        type="text"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Say something nice..."
                        className="w-full bg-black/20 border border-zinc-700 rounded px-3 py-2 text-sm"
                    />
                </div>

                <button
                    onClick={handleTip}
                    disabled={loading}
                    className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    {loading ? 'Sending...' : `Send ${amount} Sats ⚡`}
                </button>
            </div>
        </div>
    );
}
