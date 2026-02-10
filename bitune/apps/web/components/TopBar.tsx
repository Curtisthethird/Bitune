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
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 3rem;
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }

        .search-container {
          position: relative;
          width: 440px;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1rem;
          opacity: 0.4;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 0.8rem 1rem 0.8rem 3rem;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid transparent;
          color: var(--foreground);
          font-size: 0.95rem;
          outline: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .search-input:focus {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(247, 147, 26, 0.3);
          box-shadow: 0 0 20px rgba(247, 147, 26, 0.05);
        }

        .user-actions {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .upload-btn {
          background: var(--accent);
          color: black;
          border: none;
          padding: 0.6rem 1.4rem;
          border-radius: var(--radius-full);
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: 0.3s;
          font-family: 'Outfit', sans-serif;
        }

        .upload-btn:hover {
          background: var(--accent-light);
          transform: translateY(-1px);
          box-shadow: 0 4px 15px var(--accent-glow);
        }

        .avatar-circle {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
          border: 1px solid var(--border);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.9rem;
          color: var(--foreground);
          cursor: pointer;
          transition: all 0.3s;
          font-family: 'Outfit', sans-serif;
        }

        .avatar-circle:hover {
            border-color: var(--accent);
            transform: scale(1.05);
        }
      `}</style>
    </header>
  );
}
