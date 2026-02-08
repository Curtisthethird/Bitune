'use client';

interface SupporterBadgeProps {
    level?: 'fan' | 'superfan' | 'patron';
    className?: string;
}

export default function SupporterBadge({ level = 'fan', className = '' }: SupporterBadgeProps) {
    const config = {
        fan: { icon: '⚡', label: 'Supporter', color: 'var(--accent)' },
        superfan: { icon: '💎', label: 'Superfan', color: '#00f2ff' },
        patron: { icon: '👑', label: 'Top Patron', color: '#ff0055' }
    };

    const { icon, label, color } = config[level];

    return (
        <div className={`supporter-badge ${className}`} title={label}>
            <span className="badge-icon">{icon}</span>
            <style jsx>{`
                .supporter-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 20px;
                    height: 20px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid ${color}44;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    cursor: help;
                    transition: all 0.2s;
                    vertical-align: middle;
                    margin-left: 6px;
                }
                .supporter-badge:hover {
                    background: ${color}22;
                    transform: scale(1.1);
                    border-color: ${color};
                }
                .badge-icon {
                    filter: drop-shadow(0 0 2px ${color}66);
                }
            `}</style>
        </div>
    );
}
