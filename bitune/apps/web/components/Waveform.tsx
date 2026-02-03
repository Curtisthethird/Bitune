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
  duration?: number;
  currentTime?: number;
  comments?: Comment[];
  onCommentClick?: (comment: Comment) => void;
}

export default function Waveform({ isPlaying, duration = 180, currentTime = 0, comments = [], onCommentClick }: WaveformProps) {
  const [hoveredComment, setHoveredComment] = useState<Comment | null>(null);

  // Generate random bar heights
  const bars = useMemo(() => Array.from({ length: 100 }, () => Math.random() * 0.7 + 0.3), []);

  const getCommentPosition = (timestampMs: number) => {
    const totalMs = duration * 1000;
    if (totalMs === 0) return 0;
    return (timestampMs / totalMs) * 100;
  };

  const progress = (currentTime / duration) * 100;

  return (
    <div className="waveform-container">
      <div className="bars-container">
        {bars.map((height, i) => {
          const barProgress = (i / bars.length) * 100;
          const isPlayed = barProgress < progress;

          return (
            <div
              key={i}
              className={`wave-bar ${isPlaying && !isPlayed ? 'animating' : ''} ${isPlayed ? 'played' : ''}`}
              style={{
                height: `${height * 100}%`,
                animationDelay: `${i * 0.02}s`,
                opacity: isPlayed ? 1 : 0.3,
                backgroundSize: '100% 200%',
                backgroundImage: isPlayed
                  ? 'linear-gradient(to bottom, var(--accent), var(--accent-dim))'
                  : 'linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(255,255,255,0.1))'
              }}
            />
          );
        })}
      </div>

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
            height: 60px;
            width: 100%;
            display: flex;
            align-items: center;
        }

        .bars-container {
            display: flex;
            align-items: center;
            gap: 2px;
            height: 100%;
            width: 100%;
        }

        .wave-bar {
            flex: 1;
            border-radius: 2px;
            min-width: 2px;
            transition: all 0.3s ease;
        }

        .wave-bar.played {
            background-color: var(--accent);
            box-shadow: 0 0 8px rgba(247, 147, 26, 0.2);
        }

        .wave-bar.animating {
            animation: bounce 1.2s ease-in-out infinite alternate;
        }

        @keyframes bounce {
            0% { transform: scaleY(0.6); }
            100% { transform: scaleY(1.2); }
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
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10;
            pointer-events: auto;
        }

        .marker-dot {
            width: 6px;
            height: 6px;
            background: #fff;
            border: 1.5px solid var(--accent);
            border-radius: 50%;
            transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .comment-marker:hover .marker-dot, .comment-marker.hovered .marker-dot {
            width: 10px;
            height: 10px;
            background: var(--accent);
            box-shadow: 0 0 10px var(--accent);
        }

        .comment-popover {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%) translateY(-10px);
            background: rgba(10, 10, 10, 0.98);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(247, 147, 26, 0.3);
            border-radius: 12px;
            padding: 12px;
            min-width: 200px;
            max-width: 300px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.8);
            z-index: 100;
            animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes popIn {
            from { opacity: 0; transform: translateX(-50%) translateY(0) scale(0.9); }
            to { opacity: 1; transform: translateX(-50%) translateY(-10px) scale(1); }
        }

        .popover-content {
            display: flex;
            gap: 12px;
            align-items: flex-start;
        }

        .popover-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            object-fit: cover;
            border: 1px solid var(--accent);
        }

        .popover-text {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .popover-user {
            font-size: 0.8rem;
            font-weight: 800;
            color: var(--accent);
            letter-spacing: 0.05em;
        }

        .popover-msg {
            font-size: 0.9rem;
            color: #eee;
            line-height: 1.4;
        }

        .popover-arrow {
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-width: 6px;
            border-style: solid;
            border-color: rgba(247, 147, 26, 0.3) transparent transparent transparent;
        }
      `}</style>
    </div>
  );
}


