'use client';
import { useState, useEffect } from 'react';
import { KeyManager } from '@/lib/nostr/key-manager';
import { NostrSigner } from '@/lib/nostr/signer';
import { useToast } from '@/components/ToastProvider';

interface ArtistProfileFormProps {
    onSuccess: () => void;
}

export default function ArtistProfileForm({ onSuccess }: ArtistProfileFormProps) {
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. Generate Key if needed
            let session = KeyManager.getSession();
            let isNewUser = false;

            if (!session) {
                const keys = KeyManager.generate();
                KeyManager.saveSession(keys.nsec);
                session = KeyManager.getSession();
                isNewUser = true;
            }

            if (!session) throw new Error('Failed to generate session');

            // 2. Update Profile
            const event = {
                kind: 27235, // Using 27235 for auth/verification temporarily, but profile update is PUT
                created_at: Math.floor(Date.now() / 1000),
                tags: [['u', window.location.origin + '/api/profile'], ['method', 'PUT']],
                content: 'Update Profile',
                pubkey: session.pubkey
            };

            const signedEvent = await NostrSigner.sign(event);
            const token = btoa(JSON.stringify(signedEvent));

            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Nostr ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    about: bio
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to update profile');
            }

            showToast('Profile created successfully!', 'success');
            onSuccess();

        } catch (error: any) {
            console.error('Profile creation error:', error);
            showToast(error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="profile-form-container glass-card">
            <h1 className="title">Create Artist Profile</h1>
            <p className="subtitle">Let's get you set up. This is how you'll appear on BitTune.</p>

            <form onSubmit={handleSubmit} className="form">
                <div className="form-group">
                    <label>Artist Name <span className="required">*</span></label>
                    <input
                        className="input-field"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. The Midnight Echo"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Bio</label>
                    <textarea
                        className="input-field textarea"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us a bit about yourself..."
                    />
                </div>

                <button type="submit" className="btn btn-primary fluid" disabled={isLoading}>
                    {isLoading ? 'Creating Profile...' : 'Create Profile'}
                </button>
            </form>

            <style jsx>{`
                .profile-form-container {
                    max-width: 500px;
                    margin: 2rem auto;
                    padding: 3rem;
                    text-align: center;
                }

                .title {
                    font-size: 2rem;
                    font-weight: 800;
                    margin-bottom: 1rem;
                }

                .subtitle {
                    color: var(--muted);
                    margin-bottom: 2.5rem;
                }

                .form {
                    text-align: left;
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: var(--muted);
                    font-size: 0.9rem;
                }

                .required {
                    color: var(--accent);
                }

                .input-field {
                    width: 100%;
                    padding: 0.8rem;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                    background: rgba(255,255,255,0.05);
                    color: var(--foreground);
                    font-size: 1rem;
                }

                .input-field:focus {
                    border-color: var(--accent);
                    outline: none;
                }

                .textarea {
                    height: 100px;
                    resize: none;
                }

                .fluid {
                    width: 100%;
                }
            `}</style>
        </div>
    );
}
