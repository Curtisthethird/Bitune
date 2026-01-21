'use client';
import { useState, useEffect } from 'react';
import TrackUploadForm from '@/components/TrackUploadForm';
import ArtistProfileForm from '@/components/ArtistProfileForm';
import { KeyManager } from '@/lib/nostr/key-manager';

export default function ArtistSignupPage() {
    const [view, setView] = useState<'profile' | 'upload'>('profile');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const session = KeyManager.getSession();
        if (session) {
            setView('upload');
        }
        setIsLoading(false);
    }, []);

    if (isLoading) return <div className="loading">Loading...</div>;

    return (
        <div className="signup-page">
            <div className="onboarding-header">
                <h1 className="onboarding-title">Become a BitTune Artist</h1>
                <p className="onboarding-subtitle">
                    Join the decentralized music revolution. Zero intermediaries. 100% ownership.
                </p>
            </div>

            <div className="form-wrapper fade-in">
                {view === 'profile' ? (
                    <ArtistProfileForm onSuccess={() => setView('upload')} />
                ) : (
                    <TrackUploadForm
                        title="Upload Your Debut Track"
                        description="This track will be your first release and will initialize your artist profile."
                    />
                )}
            </div>

            <style jsx>{`
                .signup-page {
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 4rem 2rem;
                }

                .loading {
                    padding: 4rem;
                    text-align: center;
                    color: var(--muted);
                }

                .onboarding-header {
                    text-align: center;
                    margin-bottom: 3rem;
                }

                .onboarding-title {
                    font-size: 3rem;
                    font-weight: 800;
                    margin-bottom: 1rem;
                    background: linear-gradient(to right, #fff, #a78bfa);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .onboarding-subtitle {
                    color: var(--muted);
                    font-size: 1.2rem;
                    max-width: 600px;
                    margin: 0 auto;
                    line-height: 1.6;
                }

                .form-wrapper {
                    border-radius: var(--radius-lg);
                    /* border: 1px solid var(--border); */
                    /* padding: 2rem; */
                }
            `}</style>
        </div>
    );
}
