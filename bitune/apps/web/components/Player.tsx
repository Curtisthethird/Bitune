'use client';

import { useState, useEffect, useRef } from 'react';
import { Track } from '@shared/types';
import { POE_HEARTBEAT_INTERVAL_MS } from '@shared/constants';

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export default function Player({ track, listenerPubkey }: { track: Track; listenerPubkey: string }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [sessionId, setSessionId] = useState('');
    const [credited, setCredited] = useState(0);
    const [eligible, setEligible] = useState(false);
    const queueRef = useRef<any[]>([]);
    const isProcessingQueue = useRef(false);

    // Initialize session
    const startSession = async () => {
        if (sessionId) return sessionId;
        const sid = uuidv4();
        setSessionId(sid);

        await fetch('/api/poe/start', {
            method: 'POST',
            body: JSON.stringify({ sessionId: sid, trackId: track.id, listenerPubkey }),
            headers: { 'Content-Type': 'application/json' }
        });
        return sid;
    };

    const processQueue = async () => {
        if (isProcessingQueue.current || queueRef.current.length === 0) return;
        isProcessingQueue.current = true;

        // Take batch of 3 max
        const batch = queueRef.current.slice(0, 3);
        // Remove from queue assumption? Wait, if fail, retry?
        // "failures: queue at most N heartbeats... never backfill > 30s".
        // We will try one by one for simplicity in this MVP to handle errors differently.

        const event = batch[0];
        try {
            const res = await fetch('/api/poe/heartbeat', {
                method: 'POST',
                body: JSON.stringify(event),
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.credited) setCredited(data.credited);
                if (data.eligible) setEligible(data.eligible);
                // Remove success
                queueRef.current.shift();
            } else {
                if (res.status === 400 || res.status === 403) {
                    // Fatal error, drop logic
                    console.error('PoE Rejected', await res.json());
                    queueRef.current.shift();
                } else {
                    // Server error / network, keep in queue (retry later)
                    // But cap queue size
                    if (queueRef.current.length > 6) { // 30s buffer
                        queueRef.current.shift(); // Drop oldest
                    }
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            isProcessingQueue.current = false;
            if (queueRef.current.length > 0) {
                // Schedule next drain
                setTimeout(processQueue, 1000);
            }
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isPlaying && sessionId) {
            interval = setInterval(async () => {
                try {
                    if (!window.nostr || !audioRef.current) return;

                    // Checks: Visible, Volume, Rate
                    if (document.hidden) return;
                    if (audioRef.current.volume < 0.05) return;
                    if (audioRef.current.playbackRate < 0.75 || audioRef.current.playbackRate > 1.25) return;

                    const content = {
                        trackId: track.id,
                        sessionId,
                        positionMs: Math.floor(audioRef.current.currentTime * 1000),
                        clientTs: Date.now(),
                        isPlaying: true,
                        playbackRate: audioRef.current.playbackRate,
                        volume: audioRef.current.volume,
                        tabVisible: !document.hidden
                    };

                    const event = {
                        kind: 30334,
                        created_at: Math.floor(Date.now() / 1000),
                        tags: [
                            ['d', sessionId],
                            ['e', track.nostrEventId],
                            ['p', track.artistPubkey], // optional, helpful
                            ['t', 'bitune-poe']
                        ],
                        content: JSON.stringify(content),
                        pubkey: listenerPubkey,
                    };

                    const signedEvent = await window.nostr.signEvent(event);

                    queueRef.current.push(signedEvent);
                    processQueue();

                } catch (e) {
                    console.error(e);
                }
            }, POE_HEARTBEAT_INTERVAL_MS);
        }

        return () => clearInterval(interval);
    }, [isPlaying, sessionId, track, listenerPubkey]);

    // Cleanup on unmount or track change?
    // Ideally call finalize API.
    useEffect(() => {
        const sid = sessionId;
        return () => {
            if (sid) {
                fetch('/api/poe/finalize', {
                    method: 'POST',
                    body: JSON.stringify({ sessionId: sid, pubkey: listenerPubkey }),
                    headers: { 'Content-Type': 'application/json' },
                    keepalive: true // Send even if navigating away
                }).catch(() => { });
            }
        }
    }, [sessionId, listenerPubkey]);

    return (
        <div className="player" style={{ padding: '1rem', border: '1px solid #ccc', margin: '1rem 0' }}>
            <h4>Now Playing: {track.title}</h4>
            <audio
                ref={audioRef}
                src={track.audioUrl || '/demo.mp3'}
                controls
                onPlay={async () => {
                    await startSession();
                    setIsPlaying(true);
                }}
                onPause={() => setIsPlaying(false)}
            />
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                <div>Session: {sessionId}</div>
                <div>Credited: {credited}s {eligible ? '(Eligible for Payout ✅)' : '(Pending...)'}</div>
            </div>
        </div>
    );
}
