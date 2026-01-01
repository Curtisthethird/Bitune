'use client';

import { useState } from 'react';

export default function WalletConnectNWC({ artistPubkey }: { artistPubkey: string }) {
    const [nwcUrl, setNwcUrl] = useState('');
    const [status, setStatus] = useState('');

    const handleSave = async () => {
        setStatus('Saving...');
        try {
            const res = await fetch('/api/wallet/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nwcUrl, pubkey: artistPubkey }),
            });
            if (res.ok) setStatus('Saved!');
            else setStatus('Error saving');
        } catch (e) {
            setStatus('Error');
        }
    };

    return (
        <div className="p-4 border rounded">
            <h3>Connect Wallet (NWC)</h3>
            <input
                type="password"
                value={nwcUrl}
                onChange={e => setNwcUrl(e.target.value)}
                placeholder="nostr+walletconnect://..."
                style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem' }}
            />
            <button onClick={handleSave} style={{ padding: '0.5rem 1rem' }}>Save Connection</button>
            <p>{status}</p>
        </div>
    );
}
