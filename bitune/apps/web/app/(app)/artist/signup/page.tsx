'use client';

import TrackUploadForm from '@/components/TrackUploadForm';

export default function ArtistSignupPage() {
    return (
        <div className="signup-page">
            <div className="onboarding-header">
                <h1 className="onboarding-title">Upload Your Music</h1>
                <p className="onboarding-subtitle">
                    Drop your track below to get started. Your artist profile is created automatically.
                </p>
            </div>

            <TrackUploadForm />

            <style jsx>{`
                .signup-page {
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 3rem 2rem;
                }
                .onboarding-header {
                    text-align: center;
                    margin-bottom: 2.5rem;
                }
                .onboarding-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 0.75rem;
                    background: linear-gradient(to right, #fff, #f7931a);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .onboarding-subtitle {
                    color: var(--muted);
                    font-size: 1.1rem;
                    max-width: 500px;
                    margin: 0 auto;
                    line-height: 1.6;
                }
            `}</style>
        </div>
    );
}
