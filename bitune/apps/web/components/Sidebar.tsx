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
          padding: 2rem 1.5rem;
          z-index: 50;
          border-right: 1px solid var(--border);
          background: var(--background); /* Ensure solid background */
        }

        @media (max-width: 768px) {
          .sidebar {
            display: none;
          }
        }

        .logo-container {
          margin-bottom: 2.5rem;
          padding-left: 0.5rem;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.05em;
        }

        .nav-menu {
          flex: 1;
        }

        .nav-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 1rem;
          margin-top: 2rem;
          padding-left: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        ul {
          list-style: none;
        }

        .nav-item {
          display: flex;
          align-items: center;
          padding: 0.75rem 0.75rem;
          color: var(--muted);
          border-radius: var(--radius-md);
          margin-bottom: 0.25rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .nav-item:hover {
          color: var(--foreground);
          background: rgba(255, 255, 255, 0.03);
        }

        .nav-item.active {
          color: var(--foreground);
          background: var(--accent-dim);
          font-weight: 600;
        }

        .nav-item.active .icon {
          color: var(--accent);
        }

        .icon {
          margin-right: 0.75rem;
          font-size: 1.1rem;
          transition: color 0.2s;
        }

        .sidebar-footer {
          font-size: 0.75rem;
          color: var(--muted);
          padding-top: 1rem;
          border-top: 1px solid var(--border);
        }
      `}</style>
    </aside>
  );
}
