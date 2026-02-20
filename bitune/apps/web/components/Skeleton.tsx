
'use client';
export default function Skeleton({
    className = "",
    height = "1rem",
    width = "100%",
    borderRadius = "4px"
}: {
    className?: string,
    height?: string,
    width?: string,
    borderRadius?: string
}) {
    return (
        <div
            className={`skeleton ${className}`}
            style={{ height, width, borderRadius }}
        >
            <style jsx>{`
                .skeleton {
                    background: rgba(255, 255, 255, 0.05);
                    position: relative;
                    overflow: hidden;
                }
                .skeleton::after {
                    content: "";
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    transform: translateX(-100%);
                    background-image: linear-gradient(
                        90deg,
                        rgba(255, 255, 255, 0) 0,
                        rgba(255, 255, 255, 0.05) 20%,
                        rgba(255, 255, 255, 0.1) 60%,
                        rgba(255, 255, 255, 0)
                    );
                    animation: shimmer 2s infinite;
                }
                @keyframes shimmer {
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}</style>
        </div>
    );
}
