
'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer glass-card">
      <div className="footer-content">
        <div className="footer-brand">
          <Link href="/" className="logo text-gradient">BitTune</Link>
          <p className="footer-desc">The Future of Sound on Bitcoin.</p>
        </div>

        <div className="footer-links">
          <div className="link-column">
            <h4>Platform</h4>
            <Link href="/feed">Browse</Link>
            <Link href="/upload">For Artists</Link>
            <Link href="/pricing">Pricing</Link>
          </div>
          <div className="link-column">
            <h4>Support</h4>
            <Link href="/help">Help Center</Link>
            <Link href="/legal/terms">Terms of Service</Link>
            <Link href="/legal/privacy">Privacy Policy</Link>
          </div>
          <div className="link-column">
            <h4>Social</h4>
            <a href="https://twitter.com/bittune" target="_blank" rel="noopener noreferrer">Twitter</a>
            <a href="https://nostr.com" target="_blank" rel="noopener noreferrer">Nostr</a>
            <a href="https://github.com/bittune" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} BitTune. Built on Bitcoin.</p>
      </div>

      <style jsx>{`
        .footer {
          margin-top: 4rem;
          padding: 4rem 2rem 2rem;
          border-top: 1px solid var(--border);
          background: rgba(0,0,0,0.8);
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 3rem;
          margin-bottom: 3rem;
        }

        .footer-brand {
          max-width: 300px;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          display: block;
        }

        .footer-desc {
          color: var(--muted);
          font-size: 0.9rem;
        }

        .footer-links {
          display: flex;
          gap: 4rem;
          flex-wrap: wrap;
        }

        .link-column h4 {
          font-size: 0.9rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: var(--foreground);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .link-column a {
          display: block;
          color: var(--muted);
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          transition: color 0.2s;
        }

        .link-column a:hover {
          color: var(--accent);
        }

        .footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding-top: 2rem;
          border-top: 1px solid var(--border);
          text-align: center;
          color: var(--muted);
          font-size: 0.8rem;
        }

        @media (max-width: 768px) {
          .footer-links {
            gap: 2rem;
          }
          .footer-content {
            flex-direction: column;
          }
        }
      `}</style>
    </footer>
  );
}
