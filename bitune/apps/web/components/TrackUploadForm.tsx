'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import { NostrSigner } from '../lib/nostr/signer';
import { KeyManager } from '../lib/nostr/key-manager';
import Image from 'next/image';

interface TrackUploadFormProps {
    title?: string;
    description?: string;
    onSuccess?: (trackId: string) => void;
}

type Step = 'drop' | 'details' | 'publishing' | 'done';

export default function TrackUploadForm({ onSuccess }: TrackUploadFormProps) {
    const [step, setStep] = useState<Step>('drop');
    const [file, setFile] = useState<File | null>(null);
    const [artistName, setArtistName] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [genre, setGenre] = useState('');
    const [explicit, setExplicit] = useState(false);
    const [cover, setCover] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string>('');
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressLabel, setProgressLabel] = useState('');
    const [publishedTrackId, setPublishedTrackId] = useState('');

    const { showToast } = useToast();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    // --- File Handlers ---
    const handleFile = (f: File) => {
        if (!f.type.startsWith('audio/')) {
            showToast('Please select an audio file (MP3, WAV, AAC, etc.)', 'error');
            return;
        }
        setFile(f);
        const name = f.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
        setTitle(name);
        setStep('details');
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    };

    const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const f = e.target.files[0];
            setCover(f);
            setCoverPreview(URL.createObjectURL(f));
        }
    };

    // --- Upload Logic ---
    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title.trim()) return;
        if (!artistName.trim()) {
            showToast('Please enter your artist name.', 'error');
            return;
        }

        setStep('publishing');
        setProgress(5);
        setProgressLabel('Preparing...');

        try {
            // 1. Ensure user has a session (auto-generate if first time)
            let session = KeyManager.getSession();
            if (!session) {
                const keys = KeyManager.generate();
                KeyManager.saveSession(keys.nsec);
                session = KeyManager.getSession();
            }
            if (!session) throw new Error('Could not create a user session.');

            // 2. Get presigned URL for audio — token signed per request
            setProgress(15);
            setProgressLabel('Requesting secure upload URL...');
            const presignUrl = window.location.origin + '/api/upload/presign';
            const audioPresignAuth = await NostrSigner.generateAuthHeader('POST', presignUrl);

            const presignRes = await fetch('/api/upload/presign', {
                method: 'POST',
                headers: { 'Authorization': audioPresignAuth, 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: file.name, contentType: file.type, type: 'audio' })
            });

            if (!presignRes.ok) {
                const err = await presignRes.json();
                throw new Error(err.error || 'Failed to get upload URL. Check your S3 configuration.');
            }

            const { uploadUrl: audioUploadUrl, finalUrl: audioFinalUrl } = await presignRes.json();

            // 3. Upload audio to R2 with XHR for progress
            setProgress(20);
            setProgressLabel('Uploading audio track...');
            await uploadWithProgress(file, audioUploadUrl, (pct) => {
                setProgress(20 + Math.round(pct * 0.55)); // 20% → 75%
            });

            // 4. Optionally upload cover art
            let coverFinalUrl: string | null = null;
            if (cover) {
                setProgress(75);
                setProgressLabel('Uploading cover art...');
                const coverPresignAuth = await NostrSigner.generateAuthHeader('POST', presignUrl);
                const coverPresignRes = await fetch('/api/upload/presign', {
                    method: 'POST',
                    headers: { 'Authorization': coverPresignAuth, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename: cover.name, contentType: cover.type, type: 'cover' })
                });
                if (coverPresignRes.ok) {
                    const { uploadUrl: coverUploadUrl, finalUrl } = await coverPresignRes.json();
                    await uploadWithProgress(cover, coverUploadUrl, () => { });
                    coverFinalUrl = finalUrl;
                }
            }

            // 5. Save artist name to profile — fresh token for profile endpoint
            if (artistName.trim()) {
                setProgressLabel('Saving your artist profile...');
                const profileApiUrl = window.location.origin + '/api/profile';
                const profileAuth = await NostrSigner.generateAuthHeader('PUT', profileApiUrl);
                await fetch('/api/profile', {
                    method: 'PUT',
                    headers: { 'Authorization': profileAuth, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: artistName.trim() })
                });
                // Non-blocking: if profile save fails, continue with upload anyway
            }

            // 6. Finalize track in DB — fresh token for different endpoint
            setProgress(88);
            setProgressLabel('Publishing your track...');
            const finalizeApiUrl = window.location.origin + '/api/upload/audio';
            const finalizeAuth = await NostrSigner.generateAuthHeader('POST', finalizeApiUrl);

            const finalizeRes = await fetch('/api/upload/audio', {
                method: 'POST',
                headers: { 'Authorization': finalizeAuth, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || null,
                    genre: genre || null,
                    explicit,
                    audioUrl: audioFinalUrl,
                    coverUrl: coverFinalUrl,
                    authUrl: finalizeApiUrl
                })
            });

            if (!finalizeRes.ok) {
                const err = await finalizeRes.json();
                throw new Error(err.error || 'Failed to publish track.');
            }

            const data = await finalizeRes.json();
            setProgress(100);
            setProgressLabel('Published!');
            setPublishedTrackId(data.trackId);
            setTimeout(() => {
                setStep('done');
                if (onSuccess) onSuccess(data.trackId);
            }, 600);

        } catch (err: any) {
            console.error('Upload error:', err);
            showToast(err.message || 'Upload failed. Check the console for details.', 'error');
            setStep('details'); // Go back to form
            setProgress(0);
        }
    };

    // XHR upload to track real progress
    const uploadWithProgress = (file: File, url: string, onProgress: (pct: number) => void) =>
        new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', url);
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) onProgress(e.loaded / e.total);
            };
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) resolve();
                else reject(new Error(`Upload failed: HTTP ${xhr.status}`));
            };
            xhr.onerror = () => reject(new Error('Network error during upload'));
            xhr.send(file);
        });

    // --- Render ---
    return (
        <div className="upload-root">

            {/* STEP 1: Drop Zone */}
            {step === 'drop' && (
                <div
                    className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        accept="audio/*"
                        ref={fileInputRef}
                        onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                        style={{ display: 'none' }}
                    />
                    <div className="drop-icon">🎵</div>
                    <h2 className="drop-heading">Drop your track here</h2>
                    <p className="drop-sub">or click to browse files</p>
                    <p className="drop-formats">MP3, WAV, AAC, FLAC &bull; up to 50MB</p>
                    <button
                        className="btn btn-primary drop-btn"
                        type="button"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    >
                        Select File
                    </button>
                </div>
            )}

            {/* STEP 2: Details Form */}
            {step === 'details' && file && (
                <div className="details-wrap animate-in">
                    {/* File pill */}
                    <div className="file-pill">
                        <span className="file-pill-icon">🎵</span>
                        <span className="file-pill-name">{file.name}</span>
                        <span className="file-pill-size">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                        <button
                            type="button"
                            className="file-pill-change"
                            onClick={() => { setFile(null); setStep('drop'); }}
                        >
                            Change
                        </button>
                    </div>

                    <div className="details-grid">
                        {/* Cover Art */}
                        <div className="cover-col">
                            <label className="field-label">Cover Art</label>
                            <div
                                className="cover-box"
                                onClick={() => coverInputRef.current?.click()}
                                title="Click to upload cover art"
                            >
                                {coverPreview
                                    ? <Image src={coverPreview} alt="Cover" fill style={{ objectFit: 'cover' }} />
                                    : <div className="cover-placeholder">
                                        <span className="cover-ph-icon">🖼️</span>
                                        <span>Add Artwork</span>
                                    </div>
                                }
                                <div className="cover-hover-overlay">
                                    <span>{coverPreview ? '🔄 Replace' : '📁 Upload'}</span>
                                </div>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                ref={coverInputRef}
                                onChange={handleCoverSelect}
                                style={{ display: 'none' }}
                            />
                            <p className="field-hint">Recommended: 1000×1000 JPG/PNG</p>
                        </div>

                        {/* Metadata Form */}
                        <form className="meta-form" onSubmit={handlePublish}>
                            <div className="field-group">
                                <label className="field-label">Artist Name <span className="required">*</span></label>
                                <input
                                    className="field-input"
                                    value={artistName}
                                    onChange={(e) => setArtistName(e.target.value)}
                                    placeholder="e.g. The Weeknd, Taylor Swift..."
                                    required
                                />
                                <p className="field-hint">Your public display name on BitTune</p>
                            </div>

                            <div className="field-group">
                                <label className="field-label">Track Title <span className="required">*</span></label>
                                <input
                                    className="field-input"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Blue Skies"
                                    required
                                />
                            </div>

                            <div className="field-group">
                                <label className="field-label">Description</label>
                                <textarea
                                    className="field-input field-textarea"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Tell listeners what this track is about..."
                                />
                            </div>

                            <div className="field-row">
                                <div className="field-group field-half">
                                    <label className="field-label">Genre</label>
                                    <select
                                        className="field-input field-select"
                                        value={genre}
                                        onChange={(e) => setGenre(e.target.value)}
                                    >
                                        <option value="">Select genre...</option>
                                        {['Hip Hop', 'R&B', 'Pop', 'Rock', 'Electronic', 'Country', 'Jazz', 'Classical', 'Alternative', 'Reggae', 'Latin', 'Other'].map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="field-group field-half explicit-group">
                                    <label className="field-label">Content</label>
                                    <label className="toggle-label">
                                        <input
                                            type="checkbox"
                                            checked={explicit}
                                            onChange={(e) => setExplicit(e.target.checked)}
                                        />
                                        <span className="toggle-track">
                                            <span className="toggle-thumb" />
                                        </span>
                                        <span className="toggle-text">{explicit ? '🔞 Explicit' : '✅ Clean'}</span>
                                    </label>
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary publish-btn">
                                🚀 Publish Release
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* STEP 3: Publishing Progress */}
            {step === 'publishing' && (
                <div className="publishing-wrap">
                    <div className="publishing-icon">
                        {progress < 100 ? '📤' : '🎉'}
                    </div>
                    <h2 className="publishing-heading">
                        {progress < 100 ? 'Publishing Your Track...' : 'Track Published!'}
                    </h2>
                    <p className="publishing-label">{progressLabel}</p>
                    <div className="progress-track">
                        <div className="progress-bar" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="progress-pct">{progress}%</p>
                </div>
            )}

            {/* STEP 4: Done */}
            {step === 'done' && (
                <div className="done-wrap animate-in">
                    <div className="done-icon">🎉</div>
                    <h2 className="done-heading">Your track is live!</h2>
                    <p className="done-sub">It's now available for listeners on BitTune.</p>
                    <div className="done-actions">
                        <button
                            className="btn btn-primary"
                            onClick={() => router.push(`/release/${publishedTrackId}`)}
                        >
                            View Track
                        </button>
                        <button
                            className="btn btn-ghost"
                            onClick={() => {
                                setStep('drop');
                                setFile(null);
                                setArtistName('');
                                setTitle('');
                                setDescription('');
                                setGenre('');
                                setExplicit(false);
                                setCover(null);
                                setCoverPreview('');
                                setProgress(0);
                            }}
                        >
                            Upload Another
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .upload-root {
                    width: 100%;
                }

                /* ===== DROP ZONE ===== */
                .drop-zone {
                    border: 2px dashed var(--border);
                    border-radius: var(--radius-lg);
                    padding: 5rem 2rem;
                    text-align: center;
                    cursor: pointer;
                    transition: border-color 0.2s, background 0.2s;
                    background: rgba(255,255,255,0.01);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.75rem;
                    min-height: 420px;
                    justify-content: center;
                }
                .drop-zone:hover, .drop-zone.dragging {
                    border-color: var(--accent);
                    background: rgba(247,147,26,0.04);
                }
                .drop-icon { font-size: 3.5rem; }
                .drop-heading { font-size: 1.6rem; font-weight: 800; margin: 0; }
                .drop-sub { color: var(--muted); margin: 0; font-size: 1rem; }
                .drop-formats { color: var(--muted); font-size: 0.8rem; margin: 0.25rem 0 1.5rem; }
                .drop-btn { pointer-events: none; }

                /* ===== DETAILS ===== */
                .details-wrap { animation: fadeUp 0.3s ease-out; }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-in { animation: fadeUp 0.3s ease-out; }

                .file-pill {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid var(--border);
                    border-radius: 2rem;
                    padding: 0.5rem 1rem;
                    margin-bottom: 2rem;
                    font-size: 0.9rem;
                }
                .file-pill-icon { font-size: 1.1rem; }
                .file-pill-name {
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .file-pill-size { color: var(--muted); font-size: 0.8rem; }
                .file-pill-change {
                    background: none;
                    border: none;
                    color: var(--accent);
                    cursor: pointer;
                    font-size: 0.85rem;
                    text-decoration: underline;
                    padding: 0;
                    white-space: nowrap;
                }

                .details-grid {
                    display: grid;
                    grid-template-columns: 260px 1fr;
                    gap: 2.5rem;
                    align-items: start;
                }
                @media (max-width: 700px) {
                    .details-grid { grid-template-columns: 1fr; }
                }

                /* Cover */
                .cover-col { display: flex; flex-direction: column; gap: 0.5rem; }
                .cover-box {
                    width: 100%;
                    aspect-ratio: 1;
                    border-radius: var(--radius-md);
                    border: 1px dashed var(--border);
                    background: rgba(255,255,255,0.03);
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                    transition: border-color 0.2s;
                }
                .cover-box:hover { border-color: var(--accent); }
                .cover-placeholder {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: var(--muted);
                    gap: 0.5rem;
                    font-size: 0.9rem;
                }
                .cover-ph-icon { font-size: 2rem; }
                .cover-hover-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.55);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.2s;
                    font-size: 0.9rem;
                    color: white;
                }
                .cover-box:hover .cover-hover-overlay { opacity: 1; }

                /* Form */
                .meta-form { display: flex; flex-direction: column; gap: 1.25rem; }
                .field-group { display: flex; flex-direction: column; gap: 0.4rem; }
                .field-label { font-size: 0.85rem; color: var(--muted); font-weight: 500; }
                .required { color: var(--accent); }
                .field-hint { font-size: 0.75rem; color: var(--muted); margin: 0.25rem 0 0; }
                .field-input {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    padding: 0.75rem 1rem;
                    color: var(--foreground);
                    font-size: 0.95rem;
                    width: 100%;
                    box-sizing: border-box;
                    transition: border-color 0.2s;
                }
                .field-input:focus { outline: none; border-color: var(--accent); }
                .field-textarea { height: 100px; resize: vertical; }
                .field-select {
                    appearance: none;
                    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
                    background-repeat: no-repeat;
                    background-position: right 1rem center;
                    background-size: 1em;
                    padding-right: 2.5rem;
                }
                .field-row { display: flex; gap: 1rem; }
                .field-half { flex: 1; }

                /* Explicit toggle */
                .explicit-group { justify-content: flex-end; padding-bottom: 0.1rem; }
                .toggle-label {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    padding: 0.75rem 1rem;
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    background: rgba(255,255,255,0.03);
                }
                .toggle-label input { display: none; }
                .toggle-track {
                    width: 36px;
                    height: 20px;
                    background: var(--border);
                    border-radius: 10px;
                    position: relative;
                    transition: background 0.2s;
                    flex-shrink: 0;
                }
                .toggle-label input:checked + .toggle-track { background: var(--accent); }
                .toggle-thumb {
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    width: 16px;
                    height: 16px;
                    background: white;
                    border-radius: 50%;
                    transition: transform 0.2s;
                }
                .toggle-label input:checked + .toggle-track .toggle-thumb { transform: translateX(16px); }
                .toggle-text { font-size: 0.85rem; }

                .publish-btn { width: 100%; padding: 0.9rem; font-size: 1rem; font-weight: 700; margin-top: 0.5rem; }

                /* ===== PUBLISHING ===== */
                .publishing-wrap {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 420px;
                    gap: 1rem;
                    text-align: center;
                    padding: 3rem;
                }
                .publishing-icon { font-size: 4rem; }
                .publishing-heading { font-size: 1.6rem; font-weight: 800; margin: 0; }
                .publishing-label { color: var(--muted); font-size: 0.95rem; margin: 0; }
                .progress-track {
                    width: 100%;
                    max-width: 400px;
                    height: 8px;
                    background: rgba(255,255,255,0.08);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-top: 0.5rem;
                }
                .progress-bar {
                    height: 100%;
                    background: linear-gradient(90deg, var(--accent), #ff9a4d);
                    border-radius: 4px;
                    transition: width 0.4s ease;
                }
                .progress-pct { color: var(--muted); font-size: 0.85rem; margin: 0; }

                /* ===== DONE ===== */
                .done-wrap {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 420px;
                    gap: 1rem;
                    text-align: center;
                    padding: 3rem;
                }
                .done-icon { font-size: 5rem; }
                .done-heading { font-size: 2rem; font-weight: 800; margin: 0; }
                .done-sub { color: var(--muted); font-size: 1rem; margin: 0; }
                .done-actions { display: flex; gap: 1rem; margin-top: 0.5rem; flex-wrap: wrap; justify-content: center; }
                .btn-ghost {
                    padding: 0.75rem 1.5rem;
                    border-radius: var(--radius-full);
                    border: 1px solid var(--border);
                    background: transparent;
                    color: var(--foreground);
                    cursor: pointer;
                    font-size: 0.95rem;
                    transition: border-color 0.2s, background 0.2s;
                }
                .btn-ghost:hover { border-color: var(--muted); background: rgba(255,255,255,0.04); }
            `}</style>
        </div>
    );
}
