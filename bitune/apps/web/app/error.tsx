'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application Error:', error);
    }, [error]);

    return (
        <div className="error-container fade-in">
            <div className="content">
                <h1 className="error-icon">⚠️</h1>
                <h2>System Failure</h2>
                <p>Something went wrong on our end. We've logged the error and our technicians are looking into it.</p>
                <div className="actions">
                    <button onClick={() => reset()} className="btn btn-primary">Try Again</button>
                    <button onClick={() => window.location.href = '/'} className="btn btn-secondary">Return Home</button>
                </div>
            </div>

            <style jsx>{`
        .error-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 70vh;
            text-align: center;
            padding: 2rem;
        }
        
        .content {
            max-width: 500px;
        }

        .error-icon {
            font-size: 5rem;
            margin-bottom: 1rem;
        }

        h2 {
            font-size: 2rem;
            margin-bottom: 1rem;
        }

        p {
            color: var(--muted);
            margin-bottom: 2rem;
            font-size: 1.1rem;
            line-height: 1.6;
        }

        .actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
        }

        .fade-in {
            animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}
