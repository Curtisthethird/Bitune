'use client';
import { useState, useEffect } from 'react';

export default function WalletPage() {
    const [nwcUrl, setNwcUrl] = useState('');
    const [status, setStatus] = useState('');
    const [pubkey, setPubkey] = useState('');

    useEffect(() => {
        if (window.nostr) {
            window.nostr.getPublicKey().then(setPubkey).catch(console.error);
        }
    }, []);

    const handleTest = async () => {
        setStatus('Testing...');
        try {
            const res = await fetch('/api/wallet/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nwcUrl }),
            });
            const data = await res.json();
            if (res.ok) setStatus('Success: Connected to ' + (data.info?.alias || 'Wallet'));
            else setStatus('Error: ' + data.error);
        } catch (e: any) {
            setStatus('Error: ' + e.message);
        }
    };

    const handleSave = async () => {
        setStatus('Saving...');
        try {
            const res = await fetch('/api/wallet/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nwcUrl, pubkey }),
            });
            if (res.ok) {
                setStatus('Saved! You can now receive payouts.');
                setNwcUrl(''); // Clear input for security
            }
            else setStatus('Error saving');
        } catch (e) {
            setStatus('Error');
        }
    };

    if (!pubkey) return <div className="p-4">Please login with Nostr extension first.</div>;

    return (
        <div className="p-4 max-w-lg mx-auto">
            <h1 className="text-2xl mb-4">Connect Artist Wallet</h1>
            <p className="mb-4 text-gray-600">
                Connect your Lightning wallet via Nostr Wallet Connect (NWC) to receive payouts automatically.
            </p>

            <div className="mb-4">
                <label className="block mb-2 font-bold">NWC Connection String</label>
                <input
                    type="password"
                    value={nwcUrl}
                    onChange={e => setNwcUrl(e.target.value)}
                    placeholder="nostr+walletconnect://..."
                    className="w-full p-2 border rounded"
                />
            </div>

            <div className="flex gap-4">
                <button
                    onClick={handleTest}
                    disabled={!nwcUrl}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                    Test Connection
                </button>
                <button
                    onClick={handleSave}
                    disabled={!nwcUrl}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                    Save Encrypted
                </button>
            </div>

            {status && <div className="mt-4 p-2 bg-gray-100 rounded">{status}</div>}
        </div>
    );
}
