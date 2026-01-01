'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface User {
    pubkey: string;
    name?: string;
    about?: string;
    picture?: string;
    isArtist: boolean;
}

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');

    // Form State
    const [name, setName] = useState('');
    const [about, setAbout] = useState('');
    const [picture, setPicture] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            if (!window.nostr) return;
            const pubkey = await window.nostr.getPublicKey();
            const res = await fetch(`/api/profile?pubkey=${pubkey}`);
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                setName(data.user.name || '');
                setAbout(data.user.about || '');
                setPicture(data.user.picture || '');
            } else {
                setUser({ pubkey, isArtist: false }); // New user view
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('Saving...');
        try {
            if (!window.nostr) return;
            const pubkey = await window.nostr.getPublicKey();
            const apiUrl = window.location.origin + '/api/profile';
            const event = {
                kind: 27235,
                created_at: Math.floor(Date.now() / 1000),
                tags: [['u', apiUrl], ['method', 'PUT']],
                content: '',
                pubkey
            };
            const signedEvent = await window.nostr.signEvent(event);
            const token = btoa(JSON.stringify(signedEvent));

            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Nostr ${token}`
                },
                body: JSON.stringify({ name, about, picture })
            });

            if (!res.ok) throw new Error('Failed to save');

            setStatus('Saved!');
            setIsEditing(false);
            loadProfile();

        } catch (e: any) {
            setStatus('Error: ' + e.message);
        }
    };

    if (loading) return <div className="p-8">Loading profile...</div>;
    if (!user) return <div className="p-8">Please login with Nostr extension (Alby)</div>;

    return (
        <div className="max-w-2xl mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">My Profile</h1>
                <Link href="/upload" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded">
                    Upload Music
                </Link>
            </div>

            {!isEditing ? (
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-6 mb-6">
                        {user.picture ? (
                            <img src={user.picture} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center text-2xl">?</div>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold">{user.name || 'Anonymous BitTuner'}</h2>
                            <p className="text-orange-400 text-sm font-mono truncate max-w-xs">{user.pubkey}</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-gray-400 text-sm uppercase mb-2">About</h3>
                        <p className="text-gray-200 whitespace-pre-wrap">{user.about || 'No bio yet.'}</p>
                    </div>

                    <button
                        onClick={() => setIsEditing(true)}
                        className="w-full bg-gray-800 hover:bg-gray-700 py-2 rounded border border-gray-700"
                    >
                        Edit Profile
                    </button>

                    {/* Add Wallet Link */}
                    <Link href="/wallet" className="block text-center mt-4 text-gray-500 text-sm hover:text-white">
                        Manage Wallet Settings
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSave} className="bg-gray-900 p-6 rounded-lg border border-gray-800 space-y-4">
                    <div>
                        <label className="block text-sm mb-1">Display Name</label>
                        <input
                            className="w-full bg-black border border-gray-700 p-2 rounded"
                            value={name} onChange={e => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Avatar URL</label>
                        <input
                            className="w-full bg-black border border-gray-700 p-2 rounded"
                            value={picture} onChange={e => setPicture(e.target.value)}
                            placeholder="https://..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">About</label>
                        <textarea
                            className="w-full bg-black border border-gray-700 p-2 rounded h-32"
                            value={about} onChange={e => setAbout(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            className="flex-1 bg-white text-black font-bold py-2 rounded hover:bg-gray-200"
                        >
                            Save Changes
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="flex-1 bg-transparent border border-gray-700 py-2 rounded hover:bg-gray-800"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {status && <div className="mt-4 text-center bg-gray-800 p-2 rounded">{status}</div>}
        </div>
    );
}
