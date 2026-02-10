'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: 'Home', href: '/', icon: '🏠' },
    { name: 'Browse', href: '/feed', icon: '🔍' },
    { name: 'Library', href: '/library', icon: '📚' },
    { name: 'Wallet', href: '/wallet', icon: '⚡' },
  ];

  const artistLinks = [
    { name: 'Upload', href: '/upload', icon: '☁️' },
    { name: 'Analytics', href: '/analytics', icon: '📊' },
    { name: 'Artist Signup', href: '/artist/signup', icon: '🎤' },
  ];

  return (
    <aside className="sidebar glass">
      <div className="logo-container">
        <Link href="/" className="logo text-gradient">
          BitTune
        </Link>
      </div>

      <nav className="nav-menu">
        <p className="nav-label">Discover</p>
        <ul>
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`nav-item ${pathname === link.href ? 'active' : ''}`}
              >
                <span className="icon">{link.icon}</span>
                {link.name}
              </Link>
            </li>
          ))}
        </ul>

        <p className="nav-label">Artist Zone</p>
        <ul>
          {artistLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`nav-item ${pathname === link.href ? 'active' : ''}`}
              >
                <span className="icon">{link.icon}</span>
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <Link href="/legal/terms">Legal</Link>
      </div>

      <style jsx>{`
        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          display: flex;
          flex-direction: column;
          padding: 3rem 2rem;
          z-index: 50;
          border-right: 1px solid var(--border);
          background: var(--background);
        }

        @media (max-width: 768px) {
          .sidebar {
            display: none;
          }
        }

        .logo-container {
          margin-bottom: 4rem;
          padding-left: 0.5rem;
        }

        .logo {
          font-size: 1.8rem;
          font-weight: 900;
          letter-spacing: -0.06em;
          text-transform: lowercase;
        }

        .nav-menu {
          flex: 1;
        }

        .nav-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 1.25rem;
          margin-top: 2.5rem;
          padding-left: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          opacity: 0.8;
        }

        ul {
          list-style: none;
        }

        .nav-item {
          display: flex;
          align-items: center;
          padding: 0.85rem 1rem;
          color: var(--muted);
          border-radius: var(--radius-md);
          margin-bottom: 0.5rem;
          font-weight: 500;
          font-size: 0.95rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nav-item:hover {
          color: var(--foreground);
          background: rgba(255, 255, 255, 0.04);
          transform: translateX(4px);
        }

        .nav-item.active {
          color: var(--foreground);
          background: var(--accent-dim);
          font-weight: 600;
          box-shadow: inset 0 0 20px rgba(247, 147, 26, 0.05);
        }

        .nav-item.active .icon {
          color: var(--accent);
          filter: drop-shadow(0 0 5px var(--accent-glow));
        }

        .icon {
          margin-right: 1rem;
          font-size: 1.2rem;
          transition: transform 0.3s;
        }

        .nav-item:hover .icon {
            transform: scale(1.1);
        }

        .sidebar-footer {
          font-size: 0.8rem;
          color: var(--muted);
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
        }

        .sidebar-footer a:hover {
            color: var(--accent);
        }
      `}</style>
    </aside>
  );
}
