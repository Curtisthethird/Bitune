'use client';

import { useMemo } from 'react';

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
  // Generate random bar heights for visual simulation
  const bars = useMemo(() => Array.from({ length: 40 }, () => Math.random() * 0.8 + 0.2), []);

  // Helper to calculate position percentage of a comment
  const getCommentPosition = (timestampMs: number) => {
    const totalMs = duration * 1000;
    if (totalMs === 0) return 0;
    return (timestampMs / totalMs) * 100;
  };

  return (
    <div className="waveform-container">
      {bars.map((height, i) => (
        <div
          key={i}
          className={`wave-bar ${isPlaying ? 'animating' : ''}`}
          style={{
            height: `${height * 100}%`,
            animationDelay: `${i * 0.05}s`,
            animationDuration: isPlaying ? '1s' : '0s'
          }}
        />
      ))}

      {/* Render Comment Markers */}
      {comments.map((comment) => {
        const left = getCommentPosition(comment.timestampMs);
        // Only show if within bounds (0-100%)
        if (left < 0 || left > 100) return null;

        return (
          <div
            key={comment.id}
            className="comment-marker"
            style={{ left: `${left}%` }}
            onClick={(e) => {
              e.stopPropagation();
              onCommentClick?.(comment);
            }}
            title={`${comment.user?.name || 'User'}: ${comment.content}`}
          >
            <div className="marker-avatar">
              <img
                src={comment.user?.picture || '/default-avatar.png'}
                alt="U"
                onError={(e) => (e.target as HTMLImageElement).src = '/default-avatar.png'}
              />
            </div>
          </div>
        );
      })}

      <style jsx>{`
        .waveform-container {
          display: flex;
          align-items: center;
          gap: 2px;
          height: 32px;
          width: 100%;
          opacity: 0.8;
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          position: relative; /* For markers */
        }

        .wave-bar {
          flex: 1;
          background: var(--foreground);
          border-radius: 2px;
          min-width: 2px;
          transition: height 0.2s;
          opacity: 0.5;
        }

        .wave-bar.animating {
          animation: bounce 0.8s ease-in-out infinite alternate;
          background: var(--accent);
          opacity: 1;
        }

        @keyframes bounce {
          0% { transform: scaleY(0.5); }
          100% { transform: scaleY(1.2); }
        }

        .comment-marker {
            position: absolute;
            background: #fff;
            width: 16px;
            height: 16px;
            border-radius: 50%; /* Tear drop shape later? */
            z-index: 10;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.5);
            transition: transform 0.2s;
        }
        .comment-marker:hover {
            transform: scale(1.5);
            z-index: 20;
        }
        .marker-avatar {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            overflow: hidden;
            border: 1px solid var(--accent);
        }
        .marker-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
      `}</style>
    </div>
  );
}
