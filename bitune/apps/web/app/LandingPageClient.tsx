'use client';

import Link from 'next/link';
import TrackCard from '@/components/TrackCard';
import Footer from '@/components/Footer';

interface LandingPageProps {
    trending: any[];
    releases: any[];
}

export default function LandingPageClient({ trending, releases }: LandingPageProps) {
    return (
        <div className="home-page fade-in">
            {/* Hero Section */}
            <section className="hero-section glass-card">
                <div className="hero-content">
                    <div className="hero-badge">Featured Artist</div>
                    <h1 className="hero-title">
                        The Future of <span className="text-gradient">Sound</span>
                    </h1>
                    <p className="hero-subtitle">
                        Experience music streaming powered by Bitcoin. Support specific artists directly and earn rewards for your engagement.
                    </p>
                    <div className="hero-actions">
                        <Link href="/feed" className="btn btn-primary">Start Listening</Link>
                        <Link href="/upload" className="btn btn-secondary">Upload Music</Link>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="visual-circle"></div>
                </div>
            </section>

            {/* Features Showcase */}
            <section className="features-section">
                <div className="section-header center">
                    <h2 className="section-title">Why BitTune?</h2>
                    <p className="section-subtitle">Built for artists, powered by listeners.</p>
                </div>
                <div className="features-grid">
                    <div className="feature-card glass-card">
                        <div className="feature-icon">⚡</div>
                        <h3>Instant Payments</h3>
                        <p>Stream Sats directly to artists. No middlemen, no waiting months for payouts.</p>
                    </div>
                    <div className="feature-card glass-card">
                        <div className="feature-icon">💎</div>
                        <h3>Lossless Quality</h3>
                        <p>Experience music in high-fidelity audio. Pure sound, exactly as the artist intended.</p>
                    </div>
                    <div className="feature-card glass-card">
                        <div className="feature-icon">🔑</div>
                        <h3>True Ownership</h3>
                        <p>Buy tracks and own them forever on the decentralized web. Your library, portable everywhere.</p>
                    </div>
                </div>
            </section>

            {/* Trending Section */}
            <section>
                <div className="section-header">
                    <h2 className="section-title">Trending Now <span className="text-gradient-subtle">🔥</span></h2>
                    <Link href="/discovery/top-charts" className="see-all">See All</Link>
                </div>
                <div className="grid-layout">
                    {trending.length > 0 ? (
                        trending.map((track, i) => (
                            <TrackCard key={track.id} track={track} index={i} artist={track.artist} />
                        ))
                    ) : (
                        <div className="empty-state">No trending tracks yet. Be the first to upload!</div>
                    )}
                </div>
            </section>

            {/* Social Proof Section */}
            <section className="testimonials-section">
                <div className="section-header">
                    <h2 className="section-title">Trusted by Artists</h2>
                </div>
                <div className="testimonials-grid">
                    <div className="testimonial-card glass-card">
                        <p className="quote">"BitTune changed how I release music. I get paid instantly for every stream."</p>
                        <div className="author">
                            <div className="author-avatar">A</div>
                            <div>
                                <strong>Alex Rivera</strong>
                                <span>Indie Producer</span>
                            </div>
                        </div>
                    </div>
                    <div className="testimonial-card glass-card">
                        <p className="quote">"Finally, a platform that respects artist ownership. My fans love the direct connection."</p>
                        <div className="author">
                            <div className="author-avatar" style={{ background: 'var(--accent)' }}>S</div>
                            <div>
                                <strong>Sarah J.</strong>
                                <span>Singer-Songwriter</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* New Releases Section */}
            <section>
                <div className="section-header">
                    <h2 className="section-title">New Releases <span className="text-gradient-subtle">✨</span></h2>
                    <Link href="/discovery/new-releases" className="see-all">See All</Link>
                </div>
                <div className="grid-layout">
                    {releases.length > 0 ? (
                        releases.map((track, i) => (
                            <TrackCard key={`new-${track.id}`} track={track} index={i} artist={track.artist} />
                        ))
                    ) : (
                        <div className="empty-state">No new releases.</div>
                    )}
                </div>
            </section>

            {/* Pricing / CTA Section */}
            <section className="pricing-section glass-card">
                <div className="pricing-content">
                    <h2>Fair for Everyone</h2>
                    <p>Join thousands of artists and listeners building the future of music.</p>
                    <div className="pricing-actions">
                        <Link href="/signup" className="btn btn-primary btn-lg">Join for Free</Link>
                    </div>
                </div>
            </section>

            <Footer />

            <style jsx>{`
         .features-section { padding: 4rem 0; }
         .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-top: 2rem; }
         .feature-card { padding: 2rem; border-radius: 24px; text-align: center; transition: transform 0.3s; }
         .feature-card:hover { transform: translateY(-5px); }
         .feature-icon { font-size: 2.5rem; margin-bottom: 1rem; }
         .feature-card h3 { margin-bottom: 0.5rem; font-weight: 700; color: var(--foreground); }
         .feature-card p { color: var(--muted); font-size: 0.95rem; line-height: 1.6; }

         .testimonials-section { padding: 4rem 0; }
         .testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem; }
         .testimonial-card { padding: 2rem; border-radius: 24px; }
         .quote { font-style: italic; font-size: 1.1rem; margin-bottom: 1.5rem; color: var(--foreground-soft); }
         .author { display: flex; align-items: center; gap: 1rem; }
         .author-avatar { width: 40px; height: 40px; border-radius: 50%; background: #333; display: flex; align-items: center; justify-content: center; font-weight: bold; }
         .author span { display: block; font-size: 0.8rem; color: var(--muted); }

         .pricing-section {
            margin: 4rem 0;
            padding: 4rem;
            text-align: center;
            border-radius: 32px;
            background: linear-gradient(135deg, rgba(247, 147, 26, 0.1), rgba(0,0,0,0));
            border: 1px solid var(--accent-dim);
         }
         .pricing-content h2 { font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; }
         .pricing-content p { color: var(--muted); margin-bottom: 2rem; font-size: 1.1rem; }
       `}</style>
        </div>
    );
}
