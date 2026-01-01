'use client';

import { useState } from 'react';

export default function NostrLoginButton({ onLogin }: { onLogin?: (pubkey: string) => void }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            if (!window.nostr) {
                throw new Error('Nostr extension not found');
            }
            const pubkey = await window.nostr.getPublicKey();

            // Save to DB
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pubkey }),
            });

            if (!res.ok) throw new Error('Failed to login');

            const data = await res.json();

            if (onLogin) onLogin(pubkey);
            else window.location.reload(); // Simple refresh to update state if no callback

        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="nostr-login">
            <button
                onClick={handleLogin}
                disabled={loading}
                style={{ padding: '0.5rem 1rem', background: '#7b16ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
                {loading ? 'Logging in...' : 'Login with Nostr'}
            </button>
            {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}
        </div>
    );
}
