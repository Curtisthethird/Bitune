'use client';

export default function EngagementRing({ active, children }: { active: boolean, children: React.ReactNode }) {
    return (
        <div className="poe-container">
            <div className={`ring ${active ? 'active' : ''}`} />
            <div className="content">{children}</div>

            <style jsx>{`
        .poe-container {
            position: relative;
            display: inline-flex;
            justify-content: center;
            align-items: center;
        }

        .ring {
            position: absolute;
            top: -4px;
            left: -4px;
            right: -4px;
            bottom: -4px;
            border-radius: 50%;
            border: 2px solid transparent;
            transition: all 0.5s ease;
            pointer-events: none;
        }

        .ring.active {
            border-color: var(--accent);
            box-shadow: 0 0 10px var(--accent-glow);
            animation: pulse-ring 2s infinite;
        }

        @keyframes pulse-ring {
            0% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.05); opacity: 0.4; }
            100% { transform: scale(1); opacity: 0.8; }
        }
        
        .content {
            z-index: 1;
        }
      `}</style>
        </div>
    );
}
