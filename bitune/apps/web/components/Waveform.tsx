'use client';

import { useMemo, useState } from 'react';

interface Comment {
  id: string;
  content: string;
  timestampMs: number;
  user?: {
    name?: string;
    picture?: string;
  }
}

interface WaveformProps {
  isPlaying: boolean;
  duration?: number; // Total duration in seconds
  comments?: Comment[];
  onCommentClick?: (comment: Comment) => void;
}

export default function Waveform({ isPlaying, duration = 180, comments = [], onCommentClick }: WaveformProps) {
  const [hoveredComment, setHoveredComment] = useState<Comment | null>(null);

  // Generate random bar heights for visual simulation
  const bars = useMemo(() => Array.from({ length: 60 }, () => Math.random() * 0.7 + 0.3), []);

  // Helper to calculate position percentage of a comment
  const getCommentPosition = (timestampMs: number) => {
    const totalMs = duration * 1000;
    if (totalMs === 0) return 0;
    return (timestampMs / totalMs) * 100;
  };

  return (
    <div className="waveform-container">
      <div className="bars-container">
        {bars.map((height, i) => (
          <div
            key={i}
            className={`wave-bar ${isPlaying ? 'animating' : ''}`}
            style={{
              height: `${height * 100}%`,
              animationDelay: `${i * 0.05}s`,
              animationDuration: isPlaying ? '0.8s' : '0s'
            }}
          />
        ))}
      </div>

      {/* Render Comment Markers */}
      <div className="markers-overlay">
        {comments.map((comment) => {
          const left = getCommentPosition(comment.timestampMs);
          if (left < 0 || left > 100) return null;

          return (
            <div
              key={comment.id}
              className={`comment-marker ${hoveredComment?.id === comment.id ? 'hovered' : ''}`}
              style={{ left: `${left}%` }}
              onMouseEnter={() => setHoveredComment(comment)}
              onMouseLeave={() => setHoveredComment(null)}
              onClick={(e) => {
                e.stopPropagation();
                onCommentClick?.(comment);
              }}
            >
              <div className="marker-dot"></div>
              {hoveredComment?.id === comment.id && (
                <div className="comment-popover">
                  <div className="popover-content">
                    <img
                      src={comment.user?.picture || '/default-avatar.png'}
                      alt=""
                      className="popover-avatar"
                      onError={(e) => (e.target as HTMLImageElement).src = '/default-avatar.png'}
                    />
                    <div className="popover-text">
                      <span className="popover-user">{comment.user?.name || 'User'}</span>
                      <span className="popover-msg">{comment.content}</span>
                    </div>
                  </div>
                  <div className="popover-arrow"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
                .waveform-container {
                    position: relative;
                    height: 48px;
                    width: 100%;
                    display: flex;
                    align-items: center;
                }

                .bars-container {
                    display: flex;
                    align-items: center;
                    gap: 3px;
                    height: 100%;
                    width: 100%;
                    opacity: 0.6;
                }

                .wave-bar {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 4px;
                    min-width: 3px;
                    transition: all 0.2s ease;
                }

                .wave-bar.animating {
                    animation: bounce 1s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
                    background: var(--accent);
                    box-shadow: 0 0 10px rgba(247, 147, 26, 0.3);
                }

                @keyframes bounce {
                    0% { transform: scaleY(0.4); opacity: 0.5; }
                    100% { transform: scaleY(1.1); opacity: 1; }
                }

                .markers-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                }

                .comment-marker {
                    position: absolute;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 10;
                    pointer-events: auto;
                }

                .marker-dot {
                    width: 8px;
                    height: 8px;
                    background: #fff;
                    border: 2px solid var(--accent);
                    border-radius: 50%;
                    box-shadow: 0 0 10px rgba(0,0,0,0.5);
                    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                .comment-marker:hover .marker-dot, .comment-marker.hovered .marker-dot {
                    width: 12px;
                    height: 12px;
                    background: var(--accent);
                    transform: scale(1.2);
                    box-shadow: 0 0 15px var(--accent);
                }

                .comment-popover {
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%) translateY(-10px);
                    background: rgba(15, 15, 15, 0.95);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 10px;
                    min-width: 180px;
                    max-width: 280px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                    z-index: 100;
                    animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                @keyframes popIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(0) scale(0.8); }
                    to { opacity: 1; transform: translateX(-50%) translateY(-10px) scale(1); }
                }

                .popover-content {
                    display: flex;
                    gap: 10px;
                    align-items: flex-start;
                }

                .popover-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .popover-text {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .popover-user {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: var(--accent);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .popover-msg {
                    font-size: 0.85rem;
                    color: #fff;
                    line-height: 1.4;
                }

                .popover-arrow {
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    border-width: 6px;
                    border-style: solid;
                    border-color: rgba(15, 15, 15, 0.95) transparent transparent transparent;
                }
            `}</style>
    </div>
  );
}

