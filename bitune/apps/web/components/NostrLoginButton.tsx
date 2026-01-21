'use client';

import { useState } from 'react';
import AuthModal from './auth/AuthModal';

export default function NostrLoginButton({ onLogin }: { onLogin?: (pubkey: string) => void }) {
    const [isModalOpen, setModalOpen] = useState(false);

    const handleLoginSuccess = async (pubkey: string) => {
        try {
            // Save to DB / Create Session
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pubkey }),
            });

            if (!res.ok) throw new Error('Failed to login to backend');

            // If provided a callback, use it, otherwise reload
            if (onLogin) onLogin(pubkey);
            else window.location.reload();

        } catch (err) {
            console.error('Login backend sync failed', err);
            alert('Failed to sync login with server');
        }
    };

    return (
        <>
            <button
                onClick={() => setModalOpen(true)}
                style={{ padding: '0.5rem 1rem', background: '#7b16ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
                Login / Sign Up
            </button>
            <AuthModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onLogin={handleLoginSuccess}
            />
        </>
    );
}
