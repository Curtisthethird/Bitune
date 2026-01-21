'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileNav() {
  const pathname = usePathname();

  const links = [
    { name: 'Home', href: '/', icon: '🏠' },
    { name: 'Browse', href: '/feed', icon: '🔍' },
    { name: 'Library', href: '/library', icon: '📚' },
    { name: 'Profile', href: '/profile', icon: '👤' },
  ];

  return (
    <nav className="mobile-nav glass">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`nav-item ${pathname === link.href ? 'active' : ''}`}
        >
          <span className="icon">{link.icon}</span>
          <span className="label">{link.name}</span>
        </Link>
      ))}

      <style jsx>{`
        .mobile-nav {
          display: none;
          position: fixed;
          bottom: 0; /* Fix to bottom */
          left: 0;
          width: 100%;
          height: var(--mobile-nav-height);
          background: rgba(5, 5, 5, 0.95); /* More opaque for nav */
          backdrop-filter: blur(20px);
          border-top: 1px solid var(--border);
          z-index: 1001; /* Ensure on top of content, but verify vs player */
          justify-content: space-around;
          align-items: center;
          padding-bottom: env(safe-area-inset-bottom);
        }

        @media (max-width: 768px) {
          .mobile-nav {
            display: flex;
          }
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          height: 100%;
          color: var(--muted);
          font-size: 0.7rem;
          gap: 0.25rem;
        }

        .nav-item.active {
          color: var(--accent);
        }

        .icon {
          font-size: 1.25rem;
        }
        
        .label {
            font-weight: 500;
        }
      `}</style>
    </nav>
  );
}
