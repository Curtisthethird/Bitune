'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TopBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <header className="topbar">
      <form className="search-container" onSubmit={handleSearch}>
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search for artists, tracks..."
          className="search-input glass"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      <div className="user-actions">
        <Link href="/artist/signup">
          <button className="upload-btn">Upload</button>
        </Link>
        <div className="profile-avatar">
          {/* Placeholder for user avatar */}
          <div className="avatar-circle">U</div>
        </div>
      </div>

      <style jsx>{`
        .topbar {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(9, 9, 11, 0.8);
          backdrop-filter: blur(12px);
        }

        .search-container {
          position: relative;
          width: 400px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.9rem;
          opacity: 0.5;
        }

        .search-input {
          width: 100%;
          padding: 0.6rem 1rem 0.6rem 2.5rem;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid transparent;
          color: var(--foreground);
          font-size: 0.9rem;
          outline: none;
          transition: all 0.2s;
        }

        .search-input:focus {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--accent);
          box-shadow: 0 0 0 2px var(--accent-glow);
        }

        .user-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .upload-btn {
          background: transparent;
          color: var(--foreground);
          border: 1px solid var(--border);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          cursor: pointer;
          transition: 0.2s;
        }

        .upload-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--foreground);
        }

        .avatar-circle {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--accent), #c084fc);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.85rem;
          color: white;
          cursor: pointer;
        }
      `}</style>
    </header>
  );
}
