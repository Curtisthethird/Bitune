'use client';

import { useMemo } from 'react';

export default function Waveform({ isPlaying }: { isPlaying: boolean }) {
    // Generate random bar heights for visual simulation
    const bars = useMemo(() => Array.from({ length: 40 }, () => Math.random() * 0.8 + 0.2), []);

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

            <style jsx>{`
        .waveform-container {
          display: flex;
          align-items: center;
          gap: 2px;
          height: 32px;
          width: 100%;
          opacity: 0.8;
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
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
      `}</style>
        </div>
    );
}
