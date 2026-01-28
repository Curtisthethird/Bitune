'use client';

import { useState, useEffect, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { POE_HEARTBEAT_INTERVAL_MS } from '@shared/constants';
import { KeyManager } from '@/lib/nostr/key-manager';
import { NostrSigner } from '@/lib/nostr/signer';
import Waveform from './Waveform';
import EngagementRing from './EngagementRing';

export default function Player() {
    const { currentTrack: track, isPlaying, pause, play, toggle } = usePlayer();
    const audioRef = useRef<HTMLAudioElement>(null);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [poeActive, setPoeActive] = useState(false);

    // Comment State
    const [comments, setComments] = useState<any[]>([]);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    // Sync Audio Element with Context State
    useEffect(() => {
        if (!audioRef.current) return;
        if (isPlaying) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Playback failed", error);
                    pause(); // Revert state if play fails
                });
            }
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, track, pause]);

    // Simulated PoE activation after 5 seconds of play
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isPlaying) {
            timer = setTimeout(() => setPoeActive(true), 5000);
        } else {
            setPoeActive(false);
        }
        return () => clearTimeout(timer);
    }, [isPlaying]);

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

    const handlePostComment = async () => {
        if (!newComment.trim() || !track) return;
        const session = KeyManager.getSession();
        if (!session) {
            alert('Please login to comment');
            return;
        }

        setIsPosting(true);
        try {
            // Current timestamp (mocking via progress for now. Ideally audioRef.current.currentTime * 1000)
            // Using progress (0-100) to estimate Ms is tricky without total duration.
            // We'll rely on audioRef
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
                // Manually append the user object from session for optimistic update
                const optimisticComment = {
                    ...savedComment,
                    user: {
                        pubkey: session.pubkey,
                        name: session.name || 'Me', // We might not have full details in session, but KeyManager usually stores it?
                        // Actually KeyManager only has pubkey/privkey usually. 
                        // For now, let's just refetch or assume basic info.
                        picture: session.picture // Assuming we might have stored it or just default.
                    }
                };
                setComments(prev => [...prev, optimisticComment].sort((a, b) => a.timestampMs - b.timestampMs));
                setNewComment('');
                setShowComments(true); // Open drawer to show it
            }
        } catch (e) {
            console.error(e);
            alert('Failed to post comment');
        } finally {
            setIsPosting(false);
        }
    };

    if (!track) return null;

    return (
        <div className={`player-bar glass ${showComments ? 'expanded' : ''}`}>
            {/* Progress Bar hovering at the top edge */}
            <div className="progress-container">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress} // Mock progress
                    className="progress-slider"
                    onChange={(e) => setProgress(Number(e.target.value))}
                    style={{ backgroundSize: `${progress}% 100%` }}
                />
            </div>

            <div className="player-content">
                {/* Track Info */}
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
                        <div className="track-title" title={track.title}>{track.title}</div>
                        <div className="artist-name">Unknown Artist</div>
                        {poeActive && (
                            <div className="poe-badge">
                                <span className="poe-dot pulse-dot"></span>
                                <span className="poe-text">Earning Sats</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Visualizer / Waveform (Central Feature) */}
                <div className="waveform-wrapper">
                    <Waveform
                        isPlaying={isPlaying}
                        duration={180} // Mock duration
                        comments={comments}
                        onCommentClick={(c) => {
                            alert(c.content);
                            setShowComments(true);
                        }}
                    />
                </div>

                {/* Controls */}
                <div className="controls">
                    <button className="control-btn secondary" title="Previous">
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

                    <button className="control-btn secondary" title="Next">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                    </button>

                    {/* Comment Toggle */}
                    <button
                        className={`control-btn secondary ${showComments ? 'active' : ''}`}
                        onClick={() => setShowComments(!showComments)}
                        title="Comments"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" /></svg>
                        <span style={{ fontSize: '0.7rem', marginLeft: '4px' }}>{comments.length}</span>
                    </button>
                </div>

                {/* Volume */}
                <div className="volume-controls desktop-only">
                    <button className="control-btn secondary icon-only">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                    </button>
                    <div className="volume-slider-wrapper">
                        <div className="volume-level" style={{ width: '70%' }}></div>
                    </div>
                </div>

                {/* Hidden Audio Element */}
                <audio
                    ref={audioRef}
                    src={track.audioUrl || '/demo.mp3'}
                    onPause={() => { }} // State handled via context effect loop
                    onTimeUpdate={() => {
                        // Update progress logic later
                    }}
                />
            </div>

            {/* Comments Drawer */}
            {showComments && (
                <div className="comments-drawer">
                    <div className="comments-list">
                        {comments.length === 0 ? (
                            <div className="no-comments">No comments yet. Be the first!</div>
                        ) : comments.map(c => (
                            <div key={c.id} className="comment-item">
                                <div className="comment-avatar">
                                    <img src={c.user?.picture || '/default-avatar.png'} />
                                </div>
                                <div className="comment-body">
                                    <div className="comment-author">{c.user?.name || 'User'} <span className="comment-time">{formatTime((c.timestampMs || 0) / 1000)}</span></div>
                                    <div className="comment-text">{c.content}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="comment-input-area">
                        <input
                            type="text"
                            placeholder="Add a comment at current time..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                            className="comment-input"
                        />
                        <button className="send-btn" disabled={isPosting} onClick={handlePostComment}>
                            ➜
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .player-bar {
                    position: fixed;
                    bottom: 0px;
                    left: 0; 
                    width: 100vw;
                    height: 96px;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 0 2rem;
                    transition: all 0.3s ease;
                }
                
                .player-bar.expanded {
                    height: 90vh; /* Nearly full screen on mobile */
                    bottom: 0px !important; /* Override mobile bottom offset */
                    background: rgba(5,5,5,0.98);
                    justify-content: flex-start;
                    padding-top: 1rem;
                    z-index: 2000; /* Above everything */
                    border-top: 1px solid var(--accent);
                }
                
                /* When expanded, keep player-content at top */
                .player-bar.expanded .player-content {
                    height: 96px;
                    flex-shrink: 0;
                }

                .waveform-wrapper {
                    flex: 1;
                    padding: 0 2rem;
                    max-width: 600px;
                }

                .comments-drawer {
                    flex: 1;
                    width: 100%;
                    max-width: 800px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    padding-bottom: 1rem;
                    border-top: 1px solid var(--border);
                    margin-top: 1rem;
                    animation: slideUp 0.3s ease;
                }
                
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .comments-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .comment-item {
                    display: flex;
                    gap: 0.75rem;
                    animation: fadeIn 0.3s;
                }
                
                .comment-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    overflow: hidden;
                    flex-shrink: 0;
                }
                .comment-avatar img { width: 100%; height: 100%; object-fit: cover; }
                
                .comment-author {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--accent);
                }
                .comment-time {
                    color: var(--muted);
                    font-weight: 400;
                    margin-left: 6px;
                    font-size: 0.75rem;
                }
                .comment-text {
                    font-size: 0.9rem;
                    color: var(--foreground);
                }
                
                .comment-input-area {
                    display: flex;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: rgba(255,255,255,0.05);
                    border-radius: 20px;
                    margin: 0 1rem;
                }
                
                .comment-input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: #fff;
                    outline: none;
                }
                
                .send-btn {
                    background: var(--accent);
                    border: none;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #000;
                    font-weight: bold;
                }

                .progress-container {
                    position: absolute;
                    top: -6px;
                    left: 0;
                    width: 100%;
                    height: 6px;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                
                .player-bar:hover .progress-container {
                    opacity: 1;
                }

                .progress-slider {
                    -webkit-appearance: none;
                    width: 100%;
                    height: 4px;
                    background: rgba(255,255,255,0.1);
                    outline: none;
                    cursor: pointer;
                    background-image: linear-gradient(var(--accent), var(--accent));
                    background-repeat: no-repeat;
                }

                .progress-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 0;
                    width: 0;
                    background: var(--accent);
                    border-radius: 50%;
                    transition: all 0.2s;
                    box-shadow: 0 0 10px var(--accent);
                }

                .progress-container:hover .progress-slider::-webkit-slider-thumb {
                    height: 12px;
                    width: 12px;
                    margin-top: -4px;
                }

                .player-content {
                    width: 100%;
                    max-width: 1800px;
                    margin: 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                /* Track Info */
                .track-info {
                    display: flex;
                    align-items: center;
                    width: 240px; /* Reduced to make room for waveform */
                    gap: 1rem;
                    flex-shrink: 0;
                }

                .track-art-wrapper {
                    width: 56px;
                    height: 56px;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
                    transition: transform 0.2s;
                }
                
                .track-art-wrapper:hover {
                    transform: scale(1.05);
                }

                .track-art-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .art-placeholder {
                    width: 100%;
                    height: 100%;
                    background: var(--secondary-hover);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                }

                .track-details {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    min-width: 0;
                }

                .track-title {
                    font-weight: 700;
                    font-size: 1rem;
                    color: #fff;
                    margin-bottom: 2px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .artist-name {
                    font-size: 0.85rem;
                    color: var(--muted);
                    font-weight: 500;
                }

                .poe-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.75rem;
                    color: var(--accent);
                    font-weight: 600;
                    margin-top: 4px;
                }

                .pulse-dot {
                    width: 6px;
                    height: 6px;
                    background: var(--accent);
                    border-radius: 50%;
                    box-shadow: 0 0 8px var(--accent);
                    animation: pulse 1.5s infinite;
                }

                /* Controls */
                .controls {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    flex-shrink: 0;
                }

                .control-btn {
                    background: transparent;
                    border: none;
                    color: var(--muted);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 8px;
                    border-radius: 50%;
                    transition: all 0.2s;
                }
                
                .control-btn:hover {
                    color: #fff;
                    background: rgba(255,255,255,0.05);
                }
                
                .control-btn.active {
                    color: var(--accent);
                    background: rgba(247, 147, 26, 0.1);
                }

                .play-pause-btn {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: #fff;
                    color: #000;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
                }
                
                .play-pause-btn:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 16px rgba(255, 255, 255, 0.3);
                }
                
                .play-pause-btn:active {
                    transform: scale(0.95);
                }

                /* Volume */
                .volume-controls {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 160px;
                    justify-content: flex-end;
                }
                
                .volume-slider-wrapper {
                    width: 100px;
                    height: 4px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 4px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: height 0.2s;
                }
                
                .volume-slider-wrapper:hover {
                    height: 6px;
                }

                .volume-level {
                    height: 100%;
                    background: var(--muted);
                    border-radius: 4px;
                }
                
                .volume-slider-wrapper:hover .volume-level {
                    background: #fff;
                }

                @media (max-width: 768px) {
                    .player-bar {
                        padding: 0 1rem;
                        height: 80px;
                        bottom: var(--mobile-nav-height);
                        border-top: 1px solid var(--border);
                        /* backdrop-filter handled by glass class, but can reinforce */
                        background: rgba(10, 10, 12, 0.85); 
                    }
                    /* Hide waveform on mobile if space is tight */
                    .waveform-wrapper {
                        display: none;
                    }
                    .track-info {
                        width: auto;
                        flex: 1;
                    }
                    .controls {
                        gap: 1rem;
                    }
                    .play-pause-btn {
                        width: 48px;
                        height: 48px;
                    }
                }
            `}</style>
        </div>
    );
}

// Helper
function formatTime(seconds: number) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}


