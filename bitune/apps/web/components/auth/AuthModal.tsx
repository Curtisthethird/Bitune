'use client';

import { useState } from 'react';
import { KeyManager } from '../../lib/nostr/key-manager';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (pubkey: string) => void;
}

export default function AuthModal({ isOpen, onClose, onLogin }: AuthModalProps) {
    const [tab, setTab] = useState<'extension' | 'input' | 'generate'>('generate');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [nsecInput, setNsecInput] = useState('');
    const [generatedKey, setGeneratedKey] = useState<{ nsec: string; npub: string } | null>(null);

    if (!isOpen) return null;

    const handleExtensionLogin = async () => {
        setLoading(true);
        setError('');
        try {
            if (!window.nostr) throw new Error('Nostr extension not found');
            const pubkey = await window.nostr.getPublicKey();
            onLogin(pubkey);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleNsecLogin = () => {
        const key = KeyManager.parseNsec(nsecInput);
        if (!key) {
            setError('Invalid nsec key');
            return;
        }
        KeyManager.saveSession(nsecInput);
        onLogin(key.pubkey);
        onClose();
    };

    const handleGenerate = () => {
        const key = KeyManager.generate();
        setGeneratedKey({ nsec: key.nsec, npub: key.npub });
        // Auto-login after generation (optional, but good UX)
        KeyManager.saveSession(key.nsec);
        onLogin(key.pubkey);
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <button onClick={onClose} style={styles.closeBtn}>×</button>
                <h2 style={styles.title}>Welcome to BitTune</h2>
                <div style={styles.tabs}>
                    <button style={tab === 'generate' ? styles.activeTab : styles.tab} onClick={() => setTab('generate')}>New Account</button>
                    <button style={tab === 'extension' ? styles.activeTab : styles.tab} onClick={() => setTab('extension')}>Extension</button>
                    <button style={tab === 'input' ? styles.activeTab : styles.tab} onClick={() => setTab('input')}>Paste Key</button>
                </div>

                <div style={styles.content}>
                    {tab === 'generate' && (
                        <div style={styles.section}>
                            <p className="text-gray-300">New to Nostr? Create a simplified account to get started immediately.</p>
                            {!generatedKey ? (
                                <button onClick={handleGenerate} style={styles.actionBtn}>Create Guest Account</button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-green-900/30 border border-green-800 p-4 rounded-lg">
                                        <p className="text-green-400 font-bold mb-2">Account Created!</p>
                                        <p className="text-sm text-gray-300 mb-4">
                                            This is a "Guest" account living in your browser.
                                            <br /><strong className="text-red-400">If you clear your cache, you lose it!</strong>
                                        </p>

                                        <div className="bg-black p-3 rounded flex items-center justify-between mb-2 border border-gray-700">
                                            <code className="text-xs text-gray-400 truncate flex-1 mr-2">{generatedKey.nsec}</code>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(generatedKey.nsec);
                                                    alert('Key copied to clipboard!');
                                                }}
                                                className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded text-white"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500">Save this key in a password manager to login elsewhere.</p>
                                    </div>

                                    <button onClick={onClose} style={styles.primaryBtn}>I Saved It, Start Listening</button>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'extension' && (
                        <div style={styles.section}>
                            <p>Connect with Alby, nos2x, or other Nostr extensions.</p>
                            <button onClick={handleExtensionLogin} disabled={loading} style={styles.actionBtn}>
                                {loading ? 'Connecting...' : 'Connect Extension'}
                            </button>
                        </div>
                    )}

                    {tab === 'input' && (
                        <div style={styles.section}>
                            <input
                                value={nsecInput}
                                onChange={(e) => setNsecInput(e.target.value)}
                                placeholder="nsec1..."
                                style={styles.input}
                            />
                            <button onClick={handleNsecLogin} style={styles.actionBtn}>Login</button>
                        </div>
                    )}
                </div>

                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed' as 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    },
    modal: {
        background: '#1a1a1a', padding: '2rem', borderRadius: '12px', width: '400px', maxWidth: '90%', position: 'relative' as 'relative',
        border: '1px solid #333'
    },
    closeBtn: {
        position: 'absolute' as 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#666', fontSize: '1.5rem', cursor: 'pointer'
    },
    title: { marginBottom: '1.5rem', textAlign: 'center' as 'center', color: '#fff' },
    tabs: { display: 'flex', borderBottom: '1px solid #333', marginBottom: '1.5rem' },
    tab: { flex: 1, padding: '10px', background: 'none', border: 'none', color: '#666', cursor: 'pointer' },
    activeTab: { flex: 1, padding: '10px', background: 'none', border: 'none', color: '#7b16ff', borderBottom: '2px solid #7b16ff', cursor: 'pointer' },
    content: { minHeight: '150px' },
    section: { display: 'flex', flexDirection: 'column' as 'column', gap: '1rem', alignItems: 'center', textAlign: 'center' as 'center' },
    input: { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #333', background: '#000', color: '#fff' },
    actionBtn: { width: '100%', padding: '12px', background: '#7b16ff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    primaryBtn: { width: '100%', padding: '12px', background: '#22c55e', color: 'black', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '10px', fontWeight: 'bold' }
};
