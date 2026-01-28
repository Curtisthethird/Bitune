'use client';

import { useState, useEffect } from 'react';
import { KeyManager } from '@/lib/nostr/key-manager';
import { NostrSigner } from '@/lib/nostr/signer';

interface FollowButtonProps {
    targetPubkey: string;
    initialIsFollowing?: boolean;
    onToggle?: (isFollowing: boolean) => void;
}

export default function FollowButton({ targetPubkey, initialIsFollowing = false, onToggle }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [loading, setLoading] = useState(false);
    const [isSelf, setIsSelf] = useState(false);

    useEffect(() => {
        const session = KeyManager.getSession();

        // Debug info
        console.log(`FollowButton [${targetPubkey}] session:`, session?.pubkey);

        if (session && targetPubkey && session.pubkey === targetPubkey) {
            setIsSelf(true);
        } else {
            setIsSelf(false);
        }

        if (initialIsFollowing !== undefined) {
            setIsFollowing(initialIsFollowing);
        } else if (session) {
            checkFollowStatus(targetPubkey);
        }
    }, [targetPubkey, initialIsFollowing]);

    const checkFollowStatus = async (pubkey: string) => {
        const session = KeyManager.getSession();
        if (!session) return;

        try {
            const event = {
                kind: 27235,
                created_at: Math.floor(Date.now() / 1000),
                tags: [['u', window.location.origin + '/api/follow/check'], ['method', 'GET']],
                content: ''
            };
            const signedEvent = await NostrSigner.sign(event);
            const token = btoa(JSON.stringify(signedEvent));

            const res = await fetch(`/api/follow/check?target=${pubkey}`, {
                headers: {
                    'Authorization': `Nostr ${token}`
                }
            });
            const data = await res.json();
            setIsFollowing(data.isFollowing);
        } catch (err) {
            console.error('Failed to check follow status', err);
        }
    };

    const handleFollowToggle = async () => {
        const session = KeyManager.getSession();
        if (!session) {
            alert('Please login to follow users');
            return;
        }

        setLoading(true);
        const newState = !isFollowing;
        setIsFollowing(newState);

        try {
            const event = {
                kind: 27235,
                created_at: Math.floor(Date.now() / 1000),
                tags: [['u', window.location.origin + '/api/follow'], ['method', 'POST']],
                content: ''
            };
            const signedEvent = await NostrSigner.sign(event);
            const token = btoa(JSON.stringify(signedEvent));

            const res = await fetch('/api/follow', {
                method: 'POST',
                headers: {
                    'Authorization': `Nostr ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ targetPubkey })
            });

            if (!res.ok) throw new Error('Failed to toggle follow');
            if (onToggle) onToggle(newState);
        } catch (err) {
            console.error('Follow toggle error', err);
            setIsFollowing(!newState);
            alert('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (isSelf) return null;

    return (
        <button
            className={`follow-btn ${isFollowing ? 'following' : ''} ${loading ? 'loading' : ''}`}
            onClick={handleFollowToggle}
            disabled={loading}
        >
            {loading ? '...' : (isFollowing ? 'Following' : 'Follow')}
            <style jsx>{`
                .follow-btn {
                    padding: 8px 24px;
                    border-radius: 100px;
                    border: 1px solid var(--accent);
                    background: transparent;
                    color: var(--accent);
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    font-size: 0.85rem;
                    min-width: 110px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .follow-btn:hover:not(:disabled) {
                    background: var(--accent);
                    color: black;
                    box-shadow: 0 0 15px var(--accent);
                    transform: scale(1.05);
                }
                .follow-btn.following {
                    background: var(--accent);
                    color: black;
                    border-color: var(--accent);
                }
                .follow-btn.following:hover:not(:disabled) {
                    background: #ff3b30;
                    border-color: #ff3b30;
                    color: white;
                    box-shadow: 0 0 15px rgba(255, 59, 48, 0.5);
                }
                .follow-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </button>
    );
}

