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
        if (session && session.pubkey === targetPubkey) {
            setIsSelf(true);
        }

        // Optimistically set initial state if provided, otherwise fetch
        // (In a real app we might fetch here if initial is undefined)
        if (initialIsFollowing !== undefined) {
            setIsFollowing(initialIsFollowing);
        } else {
            checkFollowStatus(targetPubkey);
        }
    }, [targetPubkey, initialIsFollowing]);

    const checkFollowStatus = async (pubkey: string) => {
        const session = KeyManager.getSession();
        if (!session) return;

        try {
            // We need to sign to check checking specific user context (is *I* following *THEM*)
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
        setIsFollowing(newState); // Optimistic

        try {
            // Sign request
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
            setIsFollowing(!newState); // Revert
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
                    padding: 8px 16px;
                    border-radius: 20px;
                    border: 1px solid var(--accent);
                    background: transparent;
                    color: var(--accent);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.9rem;
                    min-width: 100px;
                }
                .follow-btn:hover {
                    background: var(--accent-dim);
                }
                .follow-btn.following {
                    background: var(--accent);
                    color: black;
                }
                .follow-btn.following:hover {
                    background: #ff0000;
                    border-color: #ff0000;
                    color: white;
                }
                .follow-btn.following:hover::after {
                    content: "Unfollow"; /* Trick to change text on hover? A bit complex for simple css content replace visually, lets keep simple */
                }
                /* Actually let's just keep simple hover styles */
                .follow-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
            `}</style>
        </button>
    );
}
