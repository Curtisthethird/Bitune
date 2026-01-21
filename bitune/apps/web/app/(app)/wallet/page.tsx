'use client';
import { useState, useEffect } from 'react';
import { NostrSigner } from '../../../lib/nostr/signer';

export default function WalletPage() {
    const [nwcUrl, setNwcUrl] = useState('');
    const [status, setStatus] = useState('');
    const [pubkey, setPubkey] = useState('');

    useEffect(() => {
        NostrSigner.getPublicKey().then(setPubkey).catch(() => { });
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
            <div className="mb-8 p-4 bg-purple-900/20 border border-purple-900 rounded-lg">
                <h3 className="font-bold text-lg mb-2 text-purple-400">What is this?</h3>
                <p className="text-gray-300 text-sm mb-4">
                    Nostr Wallet Connect (NWC) lets this app request invoices from your Lightning wallet without giving away your private keys.
                    This allows you to receive **instant Bitcoin payouts** when people stream your music.
                </p>
                <p className="text-gray-300 text-sm font-bold mb-2">Supported Wallets:</p>
                <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                    <li><a href="https://getalby.com/" target="_blank" className="text-purple-400 hover:underline">Alby Wallet</a> (Browser Extension & Mobile)</li>
                    <li><a href="https://mutinywallet.com/" target="_blank" className="text-purple-400 hover:underline">Mutiny Wallet</a> (Web)</li>
                    <li><a href="https://nwc.getalby.com/" target="_blank" className="text-purple-400 hover:underline">Alby NWC Adapter</a> (For BlueWallet/Phoenix)</li>
                </ul>
            </div>

            <div className="mb-6">
                <label className="block mb-2 font-bold text-gray-200">NWC Connection String</label>
                <input
                    type="password"
                    value={nwcUrl}
                    onChange={e => setNwcUrl(e.target.value)}
                    placeholder="nostr+walletconnect://..."
                    className="w-full p-3 bg-black border border-gray-700 rounded text-gray-200 focus:border-purple-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-2">We encrypt this key and store it securely. We never see your seed phrase.</p>
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
