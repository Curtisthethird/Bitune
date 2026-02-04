'use client';
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="not-found-container fade-in">
            <div className="content">
                <h1 className="glitch-text" data-text="404">404</h1>
                <h2>Lost in the Static?</h2>
                <p>The page you are looking for seems to have drifted off frequency.</p>
                <Link href="/" className="btn btn-primary">Return to Signal</Link>
            </div>

            <style jsx>{`
        .not-found-container {
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

        h1 {
            font-size: 8rem;
            font-weight: 900;
            line-height: 1;
            margin-bottom: 1rem;
            color: var(--accent);
            text-shadow: 0 0 20px rgba(247, 147, 26, 0.4);
        }

        h2 {
            font-size: 2rem;
            margin-bottom: 1rem;
        }

        p {
            color: var(--muted);
            margin-bottom: 2rem;
            font-size: 1.1rem;
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
