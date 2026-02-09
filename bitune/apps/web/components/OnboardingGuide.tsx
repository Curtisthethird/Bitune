'use client';

import { useState, useEffect } from 'react';
import { KeyManager } from '@/lib/nostr/key-manager';

export default function OnboardingGuide() {
    const [show, setShow] = useState(false);
    const [step, setStep] = useState(1);

    useEffect(() => {
        const hidden = localStorage.getItem('bitune_onboarding_hidden');
        if (!hidden) {
            // Small delay for effect
            const timer = setTimeout(() => setShow(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const dismiss = () => {
        localStorage.setItem('bitune_onboarding_hidden', 'true');
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="onboarding-overlay glass">
            <div className="onboarding-card">
                <button className="close-btn" onClick={dismiss}>✕</button>

                {step === 1 && (
                    <div className="step fade-in">
                        <div className="step-icon">👋</div>
                        <h2>Welcome to BitTune</h2>
                        <p>You're using a <strong>Guest Account</strong>. We've generated a secure key for you instantly—no login required.</p>
                        <div className="step-footer">
                            <button className="btn-primary" onClick={() => setStep(2)}>How do I use this?</button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="step fade-in">
                        <div className="step-icon">⚡</div>
                        <h2>Earn & Support</h2>
                        <p>Stream music to earn sats via <strong>Proof-of-Engagement</strong>. Use your earnings to tip artists or unlock full albums.</p>
                        <div className="step-footer">
                            <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                            <button className="btn-primary" onClick={() => setStep(3)}>Next</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="step fade-in">
                        <div className="step-icon">🔑</div>
                        <h2>Safety First</h2>
                        <p>Go to <strong>Settings</strong> to backup your recovery phrase. If you lose it, your earnings are gone forever!</p>
                        <div className="step-footer">
                            <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
                            <button className="btn-primary" onClick={dismiss}>Let's Go!</button>
                        </div>
                    </div>
                )}

                <div className="step-dots">
                    <div className={`dot ${step === 1 ? 'active' : ''}`} />
                    <div className={`dot ${step === 2 ? 'active' : ''}`} />
                    <div className={`dot ${step === 3 ? 'active' : ''}`} />
                </div>
            </div>

            <style jsx>{`
        .onboarding-overlay {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 350px;
          z-index: 10000;
          padding: 1.5rem;
          border-radius: 1.5rem;
          border: 1px solid var(--accent);
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .onboarding-card {
          position: relative;
        }

        .close-btn {
          position: absolute;
          top: -0.5rem;
          right: -0.5rem;
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .step-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        h2 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        p {
          font-size: 0.9rem;
          color: var(--muted);
          line-height: 1.5;
          margin-bottom: 1.5rem;
        }

        .step-footer {
          display: flex;
          gap: 0.5rem;
        }

        .step-dots {
          display: flex;
          gap: 0.5rem;
          margin-top: 1.5rem;
          justify-content: center;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          transition: all 0.2s;
        }

        .dot.active {
          background: var(--accent);
          transform: scale(1.5);
        }

        @media (max-width: 480px) {
          .onboarding-overlay {
            bottom: 6rem; /* Above search bar/bottom nav if any */
            right: 1rem;
            left: 1rem;
            width: auto;
          }
        }
      `}</style>
        </div>
    );
}
