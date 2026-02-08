'use client';

import { useState, useEffect, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { POE_HEARTBEAT_INTERVAL_MS } from '@/lib/shared/constants';
import { KeyManager } from '@/lib/nostr/key-manager';
import { NostrSigner } from '@/lib/nostr/signer';
import Waveform from './Waveform';
import EngagementRing from './EngagementRing';
import TipModal from './TipModal';
import PurchaseModal from './PurchaseModal';
import SupporterBadge from './SupporterBadge';

export default function Player() {
    const {
        currentTrack: track, isPlaying, queue, history,
        pause, play, toggle, next, previous
    } = usePlayer();

    const audioRef = useRef<HTMLAudioElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [poeActive, setPoeActive] = useState(false);
    const [showQueue, setShowQueue] = useState(false);

    // Comment State
    const [comments, setComments] = useState<any[]>([]);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [showTipModal, setShowTipModal] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);

    // Player Preference State
    const [volume, setVolume] = useState(0.8);
    const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
    const [isShuffled, setIsShuffled] = useState(false);

    // Visualizer State
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const animationRef = useRef<number>(0);

    // Setup Audio Context for Visualizer
    useEffect(() => {
        if (!audioRef.current || analyzerRef.current) return;

        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContext.createMediaElementSource(audioRef.current);
            const analyzer = audioContext.createAnalyser();

            source.connect(analyzer);
            analyzer.connect(audioContext.destination);

            analyzer.fftSize = 256;
            analyzerRef.current = analyzer;

            return () => {
                audioContext.close();
            };
        } catch (e) {
            console.error("AudioContext failed", e);
        }
    }, []);

    // Visualizer Animation
    useEffect(() => {
        if (!isPlaying || !canvasRef.current || !analyzerRef.current) {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const analyzer = analyzerRef.current;
        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            analyzer.getByteFrequencyData(dataArray);

            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;
                ctx.fillStyle = `rgba(247, 147, 26, ${barHeight / 100})`;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        };

        draw();
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isPlaying]);

    // Sync Audio Element with Context State
    useEffect(() => {
        if (!audioRef.current) return;
        if (isPlaying) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Playback failed", error);
                    pause();
                });
            }
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, track?.id, pause]);

    // Simulated PoE activation
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isPlaying) {
            timer = setTimeout(() => setPoeActive(true), 5000);
        } else {
            setPoeActive(false);
        }
        return () => clearTimeout(timer);
    }, [isPlaying, track?.id]);

    // Volume handling
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // Fetch comments when track changes
    useEffect(() => {
        if (track?.id) {
            fetchComments(track.id);
        } else {
            setComments([]);
        }
    }, [track?.id]);

    const fetchComments = async (trackId: string) => {
        try {
            const res = await fetch(`/api/comments?trackId=${trackId}`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleEnded = () => {
        if (repeatMode === 'one') {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play();
            }
        } else if (repeatMode === 'all') {
            if (queue.length === 0 && history.length > 0) {
                // Wrap around to start of history if at the end of queue
                const firstTrack = history[history.length - 1];
                play(firstTrack);
            } else {
                handleNext();
            }
        } else {
            handleNext();
        }
    };

    const handleNext = () => {
        if (isShuffled && queue.length > 0) {
            const randomIndex = Math.floor(Math.random() * queue.length);
            const nextTrack = queue[randomIndex];

            // Overriding next behavior: play the random track and update queue
            play(nextTrack);

            // Remove the picked track from queue (requires context update or manual set)
            // For now, let's keep it simple: next() only happens in linear mode.
            // In shuffle mode, we basically jump to a track.
            // A better way would be for the context to handle shuffle state.
        } else {
            next();
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim() || !track) return;
        const session = KeyManager.getSession();
        if (!session) {
            alert('Please login to comment');
            return;
        }

        setIsPosting(true);
        try {
            const currentTimeMs = audioRef.current ? Math.floor(audioRef.current.currentTime * 1000) : 0;

            const event = {
                kind: 27235,
                created_at: Math.floor(Date.now() / 1000),
                tags: [['u', window.location.origin + '/api/comments'], ['method', 'POST']],
                content: ''
            };
            const signedEvent = await NostrSigner.sign(event);
            const token = btoa(JSON.stringify(signedEvent));

            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: {
                    'Authorization': `Nostr ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    trackId: track.id,
                    content: newComment,
                    timestampMs: currentTimeMs
                })
            });

            if (res.ok) {
                const savedComment = await res.json();
                const optimisticComment = {
                    ...savedComment,
                    user: {
                        pubkey: session.pubkey,
                        name: 'Me',
                        picture: '/default-avatar.png'
                    }
                };
                setComments(prev => [...prev, optimisticComment].sort((a, b) => a.timestampMs - b.timestampMs));
                setNewComment('');
                setShowComments(true);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to post comment');
        } finally {
            setIsPosting(false);
        }
    };

    const handleReport = async () => {
        if (!track) return;
        if (!confirm('Are you sure you want to report this content for violating community standards?')) return;

        try {
            const authHeader = await NostrSigner.generateAuthHeader('POST', window.location.origin + '/api/track/report');

            const res = await fetch('/api/track/report', {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ trackId: track.id, reason: 'Manual report from player' })
            });

            if (res.ok) {
                alert('Thank you. Content has been flagged for review.');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to report content');
            }
        } catch (e) {
            console.error('Report failed', e);
            alert('An error occurred while reporting.');
        }
    };

    const handlePurchaseSuccess = async () => {
        if (!track) return;
        try {
            const res = await fetch(`/api/tracks/${track.id}`);
            if (res.ok) {
                const updatedTrack = await res.json();
                play(updatedTrack); // This will update the current track in context
            }
        } catch (e) {
            console.error("Failed to refresh track after purchase", e);
        }
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current || !track) return;
        const cur = audioRef.current.currentTime;
        const dur = audioRef.current.duration;

        // Gating Logic: 30s preview for non-purchased tracks
        if (track.price && track.price > 0 && !track.hasPurchased && cur >= 30) {
            audioRef.current.currentTime = 30;
            pause();
            setShowPurchaseModal(true);
        }

        setCurrentTime(cur);
        setDuration(dur);
        setProgress((cur / dur) * 100);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current || !duration || !track) return;
        let newTime = (Number(e.target.value) / 100) * duration;

        // Prevent seeking past preview limit
        if (track.price && track.price > 0 && !track.hasPurchased && newTime > 30) {
            newTime = 30;
        }

        audioRef.current.currentTime = newTime;
        setProgress(Number(e.target.value));
    };

    if (!track) return null;

    return (
        <div className={`player-bar glass ${showComments || showQueue ? 'expanded' : ''}`}>
            {/* Visualizer Background */}
            <canvas ref={canvasRef} className="visualizer-canvas" width="400" height="60" />

            {/* Progress Bar hovering at the top edge */}
            <div className="progress-container">
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={progress || 0}
                    className="progress-slider"
                    onChange={handleSeek}
                    style={{ backgroundSize: `${progress}% 100%` }}
                />
            </div>

            <div className="player-content">
                <div className="track-info">
                    <EngagementRing active={poeActive}>
                        <div className="track-art-wrapper">
                            {track.coverUrl ? (
                                <img src={track.coverUrl} alt="Art" className="track-art-img" />
                            ) : (
                                <div className="art-placeholder">🎵</div>
                            )}
                        </div>
                    </EngagementRing>
                    <div className="track-details">
                        <div className="track-title" title={track.title}>
                            {track.title}
                            {track.hasPurchased && <span className="ml-2" title="Owned">💎</span>}
                        </div>
                        <div className="artist-name">{track.artist?.name || 'Unknown Artist'}</div>
                        {poeActive && (
                            <div className="poe-badge">
                                <span className="poe-dot pulse-dot"></span>
                                <span className="poe-text">Earning Sats</span>
                            </div>
                        )}
                    </div>
                    <div className="player-extra-actions">
                        <button className="control-btn tip-btn" onClick={() => setShowTipModal(true)} title="Tip Artist">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l3-8z" /></svg>
                        </button>
                        {track.price && track.price > 0 && !track.hasPurchased && (
                            <button
                                className="control-btn purchase-btn"
                                onClick={() => setShowPurchaseModal(true)}
                                title={`Unlock for ${track.price} Sats`}
                            >
                                <span style={{ fontSize: '1.2rem' }}>⚡</span>
                            </button>
                        )}
                        <button
                            className="control-btn report-btn"
                            onClick={handleReport}
                            title="Report content"
                            style={{ fontSize: '1.1rem', opacity: 0.5 }}
                        >
                            🚩
                        </button>
                    </div>
                </div>

                <div className="waveform-wrapper">
                    <Waveform
                        isPlaying={isPlaying}
                        duration={duration || 180}
                        currentTime={currentTime}
                        comments={comments}
                        onCommentClick={(c) => {
                            setShowComments(true);
                        }}
                    />
                </div>

                <div className="controls">
                    <button
                        className="control-btn secondary"
                        title="Previous"
                        onClick={previous}
                        disabled={history.length === 0}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                    </button>

                    <button
                        className={`play-pause-btn ${isPlaying ? 'playing' : ''}`}
                        onClick={toggle}
                    >
                        {isPlaying ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}><path d="M8 5v14l11-7z" /></svg>
                        )}
                    </button>

                    <button
                        className="control-btn secondary"
                        title="Next"
                        onClick={handleNext}
                        disabled={queue.length === 0}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                    </button>

                    <button
                        className={`control-btn secondary ${showComments ? 'active' : ''}`}
                        onClick={() => { setShowComments(!showComments); setShowQueue(false); }}
                        title="Comments"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" /></svg>
                        <span className="count-badge">{comments.length}</span>
                    </button>

                    <button
                        className={`control-btn secondary ${showQueue ? 'active' : ''}`}
                        onClick={() => { setShowQueue(!showQueue); setShowComments(false); }}
                        title="Queue"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" /></svg>
                        <span className="count-badge">{queue.length}</span>
                    </button>
                </div>

                <div className="volume-controls desktop-only">
                    <div className="player-pref-actions">
                        <button
                            className={`control-btn mini ${isShuffled ? 'active' : ''}`}
                            onClick={() => setIsShuffled(!isShuffled)}
                            title="Shuffle"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" /></svg>
                        </button>
                        <button
                            className={`control-btn mini ${repeatMode !== 'none' ? 'active' : ''}`}
                            onClick={() => {
                                if (repeatMode === 'none') setRepeatMode('all');
                                else if (repeatMode === 'all') setRepeatMode('one');
                                else setRepeatMode('none');
                            }}
                            title={`Repeat: ${repeatMode}`}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                {repeatMode === 'one' ? (
                                    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z" />
                                ) : (
                                    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
                                )}
                            </svg>
                        </button>
                    </div>

                    <div className="volume-slider-wrapper">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="volume-slider"
                        />
                    </div>
                    <div className="time-display">{formatTime(currentTime)} / {formatTime(duration)}</div>
                </div>

                <audio
                    ref={audioRef}
                    src={track.audioUrl || '/demo.mp3'}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleEnded}
                />
            </div>

            {/* Drawers */}
            {(showComments || showQueue) && (
                <div className="drawers-container">
                    {showComments && (
                        <div className="comments-drawer">
                            <div className="drawer-header">
                                <h3>Comments</h3>
                                <button onClick={() => setShowComments(false)}>✕</button>
                            </div>
                            <div className="drawer-content">
                                {comments.length === 0 ? (
                                    <div className="no-data">No comments yet.</div>
                                ) : comments.map(c => (
                                    <div key={c.id} className="comment-item">
                                        <div className="comment-avatar"><img src={c.user?.picture || '/default-avatar.png'} /></div>
                                        <div className="comment-body">
                                            <div className="comment-author">
                                                {c.user?.name || 'User'}
                                                {c.supporterLevel && <SupporterBadge level={c.supporterLevel} />}
                                                <span className="comment-time">{formatTime((c.timestampMs || 0) / 1000)}</span>
                                            </div>
                                            <div className="comment-text">{c.content}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="comment-input-area">
                                <input
                                    type="text"
                                    placeholder="Add a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                                    className="comment-input"
                                />
                                <button className="send-btn" disabled={isPosting} onClick={handlePostComment}>➜</button>
                            </div>
                        </div>
                    )}

                    {showQueue && (
                        <div className="queue-drawer">
                            <div className="drawer-header">
                                <h3>Up Next</h3>
                                <button onClick={() => setShowQueue(false)}>✕</button>
                            </div>
                            <div className="drawer-content">
                                {queue.length === 0 ? (
                                    <div className="no-data">Queue is empty. Add some tracks!</div>
                                ) : queue.map((t, i) => (
                                    <div key={`${t.id}-${i}`} className="queue-item" onClick={() => play(t)}>
                                        <img src={t.coverUrl || '/platinum-cd.svg'} className="queue-art" />
                                        <div className="queue-details">
                                            <div className="queue-title">{t.title}</div>
                                            <div className="queue-artist">{t.artist?.name || 'Artist'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showTipModal && track && (
                <TipModal
                    artist={{ pubkey: track.artistPubkey, name: track.artist?.name }}
                    onClose={() => setShowTipModal(false)}
                />
            )}

            {showPurchaseModal && track && (
                <PurchaseModal
                    track={{
                        ...track,
                        price: track.price || 1000,
                        artist: { name: track.artist?.name || 'Unknown Artist' }
                    }}
                    onClose={() => setShowPurchaseModal(false)}
                    onSuccess={handlePurchaseSuccess}
                />
            )}

            <style jsx>{`
                .player-bar {
                    position: fixed;
                    bottom: 0;
                    left: 0; 
                    width: 100vw;
                    height: 96px;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    padding: 0 2rem;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    background: rgba(10, 10, 12, 0.85);
                    backdrop-filter: blur(20px);
                    border-top: 1px solid rgba(255,255,255,0.05);
                }
                
                .visualizer-canvas {
                    position: absolute;
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 100%;
                    max-width: 600px;
                    height: 60px;
                    opacity: 0.3;
                    pointer-events: none;
                }

                .player-bar.expanded {
                    height: 85vh;
                    background: rgba(5, 5, 5, 0.98);
                    justify-content: flex-start;
                    padding-top: 1rem;
                    border-top: 2px solid var(--accent);
                }

                .player-content {
                    width: 100%;
                    max-width: 1400px;
                    margin: 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    height: 96px;
                    flex-shrink: 0;
                }

                .progress-container {
                    position: absolute;
                    top: -4px;
                    left: 0;
                    width: 100%;
                    height: 8px;
                    z-index: 10;
                }

                .progress-slider {
                    width: 100%;
                    cursor: pointer;
                    height: 4px;
                    background: rgba(255,255,255,0.1);
                    appearance: none;
                    background-image: linear-gradient(var(--accent), var(--accent));
                    background-repeat: no-repeat;
                    outline: none;
                }

                .progress-slider::-webkit-slider-thumb {
                    appearance: none;
                    height: 12px;
                    width: 12px;
                    background: #fff;
                    border-radius: 50%;
                    box-shadow: 0 0 10px var(--accent);
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .progress-container:hover .progress-slider::-webkit-slider-thumb {
                    opacity: 1;
                }

                .track-info {
                    display: flex;
                    align-items: center;
                    width: 300px;
                    gap: 1rem;
                }

                .track-art-wrapper {
                    width: 56px;
                    height: 56px;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
                    background: var(--secondary);
                }

                .track-art-img { width: 100%; height: 100%; object-fit: cover; }
                .art-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
                
                .track-details { min-width: 0; }
                .track-title { font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.95rem; }
                .artist-name { font-size: 0.85rem; color: var(--muted); }

                .waveform-wrapper { flex: 1; padding: 0 2rem; max-width: 600px; }

                .controls { display: flex; align-items: center; gap: 1.25rem; }
                
                .player-pref-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-right: 1.5rem;
                }

                .control-btn.mini {
                    padding: 4px;
                    opacity: 0.6;
                }
                .control-btn.mini:hover { opacity: 1; }
                .control-btn.mini.active { opacity: 1; color: var(--accent); }

                .volume-slider-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-right: 1.5rem;
                    color: var(--muted);
                }

                .volume-slider {
                    width: 80px;
                    cursor: pointer;
                    height: 4px;
                    background: rgba(255,255,255,0.1);
                    appearance: none;
                    border-radius: 2px;
                    outline: none;
                }

                .volume-slider::-webkit-slider-thumb {
                    appearance: none;
                    height: 12px;
                    width: 12px;
                    background: #fff;
                    border-radius: 50%;
                    cursor: pointer;
                }

                .control-btn {
                    background: transparent;
                    border: none;
                    color: var(--muted);
                    cursor: pointer;
                    position: relative;
                    padding: 8px;
                    border-radius: 50%;
                    transition: all 0.2s;
                }
                
                .control-btn:hover:not(:disabled) { color: #fff; background: rgba(255,255,255,0.05); }
                .control-btn:disabled { opacity: 0.2; cursor: not-allowed; }
                .control-btn.active { color: var(--accent); background: rgba(247, 147, 26, 0.1); }
                
                .tip-btn {
                    color: var(--accent);
                }
                .tip-btn:hover {
                    color: #fff !important;
                    background: var(--accent) !important;
                    box-shadow: 0 0 15px var(--accent-dim);
                }

                .purchase-btn {
                    color: var(--accent);
                    margin-left: -0.5rem;
                }
                
                .purchase-btn:hover {
                    transform: scale(1.2);
                    color: #fff;
                }

                .player-extra-actions {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    margin-left: 0.5rem;
                }

                .count-badge {
                    position: absolute;
                    top: 0px;
                    right: 0px;
                    font-size: 0.6rem;
                    background: var(--accent);
                    color: #000;
                    padding: 1px 4px;
                    border-radius: 10px;
                    font-weight: 800;
                    min-width: 16px;
                }

                .play-pause-btn {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background: #fff;
                    color: #000;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
                }
                
                .play-pause-btn:hover { transform: scale(1.08); }
                .play-pause-btn:active { transform: scale(0.95); }

                .volume-controls { width: 300px; display: flex; justify-content: flex-end; }
                .time-display { font-size: 0.8rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; opacity: 0.8; }

                .drawers-container {
                    flex: 1;
                    width: 100%;
                    max-width: 1400px;
                    margin: 0 auto;
                    display: flex;
                    gap: 2rem;
                    padding: 1rem 0;
                    overflow: hidden;
                    animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }

                @keyframes slideUp {
                    from { transform: translateY(40px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .comments-drawer, .queue-drawer {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                }

                .drawer-header {
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .drawer-header h3 { font-size: 1.1rem; font-weight: 700; color: var(--accent); }
                .drawer-header button { background: transparent; border: none; color: var(--muted); cursor: pointer; font-size: 1.25rem; }

                .drawer-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.5rem;
                }

                .no-data { text-align: center; color: var(--muted); padding: 4rem; font-style: italic; }

                .comment-item { display: flex; gap: 1rem; margin-bottom: 1.25rem; animation: fadeIn 0.3s ease; }
                .comment-avatar { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
                .comment-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .comment-author { font-size: 0.85rem; font-weight: 800; color: var(--accent); margin-bottom: 2px; }
                .comment-time { color: var(--muted); font-weight: 400; font-size: 0.75rem; margin-left: 8px; opacity: 0.6; }
                .comment-text { font-size: 0.9rem; color: #ddd; line-height: 1.4; }

                .comment-input-area { padding: 1.25rem 1.5rem; background: rgba(0, 0, 0, 0.2); border-top: 1px solid rgba(255, 255, 255, 0.05); display: flex; gap: 1rem; }
                .comment-input { flex: 1; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 0.75rem 1.25rem; border-radius: 30px; color: #fff; outline: none; transition: border-color 0.2s; }
                .comment-input:focus { border-color: var(--accent); }
                .send-btn { background: var(--accent); border: none; width: 40px; height: 40px; border-radius: 50%; color: #000; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 900; }

                .queue-item {
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    padding: 0.85rem;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: 1px solid transparent;
                    margin-bottom: 0.5rem;
                }
                .queue-item:hover { background: rgba(255,255,255,0.05); border-color: rgba(247, 147, 26, 0.2); }
                .queue-art { width: 48px; height: 48px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
                .queue-title { font-weight: 700; font-size: 0.95rem; color: #fff; }
                .queue-artist { font-size: 0.8rem; color: var(--muted); }

                @media (max-width: 1024px) {
                    .waveform-wrapper { max-width: 400px; }
                    .volume-controls { width: auto; }
                }

                @media (max-width: 768px) {
                    .waveform-wrapper, .desktop-only { display: none; }
                    .track-info { width: auto; flex: 1; }
                    .player-bar { height: 80px; bottom: 64px; padding: 0 1rem; }
                    .player-bar.expanded { height: 100vh; bottom: 0; padding-top: env(safe-area-inset-top); }
                    .drawers-container { flex-direction: column; padding: 1rem; gap: 1rem; }
                    .player-content { height: 80px; }
                }
            `}</style>
        </div>
    );
}

function formatTime(seconds: number) {
    if (isNaN(seconds)) return '0:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}



