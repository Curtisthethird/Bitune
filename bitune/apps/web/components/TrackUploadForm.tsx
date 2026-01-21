'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import { NostrSigner } from '../lib/nostr/signer';
import Image from 'next/image';

interface TrackUploadFormProps {
    title?: string;
    description?: string;
    onSuccess?: (trackId: string) => void;
}

export default function TrackUploadForm({ title: pageTitle = "Upload Track", description: pageDesc, onSuccess }: TrackUploadFormProps) {
    const [step, setStep] = useState<'upload' | 'details'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [genre, setGenre] = useState('');
    const [explicit, setExplicit] = useState(false);
    const [cover, setCover] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string>('');
    const [isDragging, setIsDragging] = useState(false);

    // Status
    const [isUploading, setIsUploading] = useState(false);
    const { showToast } = useToast();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    // Audio DND Handlers
    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type.startsWith('audio/')) {
            setFile(droppedFile);
            setStep('details');
            // Auto-fill title from filename
            const name = droppedFile.name.replace(/\.[^/.]+$/, "");
            setTitle(name);
        } else {
            showToast('Please drop an audio file.', 'error');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStep('details');
            const name = e.target.files[0].name.replace(/\.[^/.]+$/, "");
            setTitle(name);
        }
    };

    const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setCover(f);
            setCoverPreview(URL.createObjectURL(f));
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !file) return;

        setIsUploading(true);
        showToast('Signing upload...', 'info');

        try {
            // 1. Sign
            let pubkey;
            try {
                pubkey = await NostrSigner.getPublicKey();
            } catch (err) {
                // If getPublicKey fails but we are in dev/test with mock data, fallback
                throw err;
            }
            const apiUrl = window.location.origin + '/api/upload/audio';
            const event: any = {
                kind: 27235,
                created_at: Math.floor(Date.now() / 1000),
                tags: [['u', apiUrl], ['method', 'POST']],
                content: 'Upload Track',
                pubkey
            };
            let signedEvent;
            try {
                signedEvent = await NostrSigner.sign(event);
            } catch (err) {
                throw err;
            }
            const token = btoa(JSON.stringify(signedEvent));

            // 2. Upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', title);
            formData.append('title', title);
            formData.append('description', description);
            formData.append('genre', genre);
            formData.append('explicit', explicit.toString());
            if (cover) formData.append('cover', cover);

            const res = await fetch('/api/upload/audio', {
                method: 'POST',
                headers: { 'Authorization': `Nostr ${token}` },
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Upload failed');
            }

            const data = await res.json();
            showToast('Published Successfully!', 'success');

            if (onSuccess) {
                onSuccess(data.trackId);
            } else {
                router.push(`/track/${data.trackId}`);
            }

        } catch (e: any) {
            console.error(e);
            showToast(e.message, 'error');
            setIsUploading(false);
        }
    };


    return (
        <div className="upload-container">
            {step === 'upload' && (
                <div
                    className={`upload-zone glass-card ${isDragging ? 'dragging' : ''}`}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                >
                    <div className="upload-content">
                        <div className="upload-icon">☁️</div>
                        <h2 className="upload-title">Drag and drop your track</h2>
                        <p className="upload-subtitle">WAV, MP3, AAC, or FLAC up to 50MB</p>

                        <input
                            type="file"
                            accept="audio/*"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="btn btn-primary"
                        >
                            Select File
                        </button>
                    </div>
                </div>
            )}

            {step === 'details' && file && (
                <div className="details-view animate-in">
                    <header className="page-header">
                        <div>
                            <h1 className="page-title">{pageTitle}</h1>
                            {pageDesc && <p className="page-desc">{pageDesc}</p>}
                        </div>
                        <div className="step-indicator">
                            <span className="step-done">1. Upload</span>
                            <span className="separator">→</span>
                            <span className="active">2. Details</span>
                        </div>
                    </header>

                    <div className="details-grid">
                        {/* Left Col: Cover Art */}
                        <div className="cover-section">
                            <label className="section-label">Artwork</label>
                            <div className="cover-preview glass-card" onClick={() => coverInputRef.current?.click()}>
                                {coverPreview ? (
                                    <Image src={coverPreview} alt="Cover" fill className="cover-image" style={{ objectFit: 'cover' }} />
                                ) : (
                                    <div className="placeholder-content">
                                        <Image src="/platinum-cd.svg" alt="Default" width={80} height={80} style={{ opacity: 0.5 }} />
                                        <span style={{ marginTop: '1rem' }}>Upload Artwork</span>
                                    </div>
                                )}
                                <div className="hover-overlay">
                                    <span className="btn-small">{coverPreview ? 'Replace' : 'Upload'}</span>
                                </div>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                ref={coverInputRef}
                                onChange={handleCoverSelect}
                                style={{ display: 'none' }}
                            />
                            <p className="helper-text">1000x1000px JPG or PNG</p>
                        </div>

                        {/* Right Col: Metadata */}
                        <div className="form-section glass-card">
                            <div className="form-header">
                                <h3 className="section-title">Track Metadata</h3>
                                <button
                                    type="button"
                                    onClick={() => { setFile(null); setStep('upload'); }}
                                    className="btn-text"
                                >
                                    Replace File
                                </button>
                            </div>

                            <form onSubmit={handleUpload} className="upload-form">
                                <div className="form-group">
                                    <label>Track Title <span className="required">*</span></label>
                                    <input
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className="input-field glass"
                                        placeholder="e.g. Summer Vibes"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className="input-field glass textarea"
                                        placeholder="Tell your listeners about this track..."
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group half">
                                        <label>Genre</label>
                                        <select
                                            value={genre}
                                            onChange={e => setGenre(e.target.value)}
                                            className="input-field glass"
                                        >
                                            <option value="">Select Genre</option>
                                            {['Pop', 'Hip Hop', 'Rock', 'Electronic', 'R&B', 'Country', 'Jazz', 'Classical', 'Alternative', 'Other'].map(g => (
                                                <option key={g} value={g}>{g}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group half checkbox-group">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={explicit}
                                                onChange={e => setExplicit(e.target.checked)}
                                            />
                                            <span>Explicit Content</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="file-summary">
                                    <div className="file-icon-small">📁</div>
                                    <span className="filename-small">{file.name}</span>
                                    <span className="filesize-small">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        disabled={isUploading}
                                        className="btn btn-primary fluid"
                                    >
                                        {isUploading ? 'Publishing...' : 'Publish Release'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .upload-container {
                    width: 100%;
                }

                .upload-zone {
                    border: 2px dashed var(--border);
                    padding: 4rem 2rem;
                    text-align: center;
                    transition: all 0.2s;
                    cursor: pointer;
                    min-height: 400px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .upload-zone:hover, .upload-zone.dragging {
                    border-color: var(--accent);
                    background: rgba(247, 147, 26, 0.05); /* Accent faint */
                }

                .upload-icon {
                    font-size: 3rem;
                    margin-bottom: 1.5rem;
                    opacity: 0.7;
                }

                .upload-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                }

                .upload-subtitle {
                    color: var(--muted);
                    margin-bottom: 2rem;
                }

                /* Details View */
                .details-view {
                    animation: slideUp 0.3s ease-out;
                }

                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid var(--border);
                }

                .page-title {
                    font-size: 1.8rem;
                    font-weight: 800;
                }

                .page-desc {
                    color: var(--muted);
                }

                .step-indicator {
                    display: flex;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                    color: var(--muted);
                }

                .step-done {
                    color: var(--success);
                }

                .active {
                    color: var(--accent);
                    font-weight: 600;
                }

                .details-grid {
                    display: grid;
                    grid-template-columns: 300px 1fr;
                    gap: 2rem;
                }

                @media (max-width: 768px) {
                    .details-grid {
                        grid-template-columns: 1fr;
                    }
                    .page-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }
                }

                /* Cover Section */
                .cover-section {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .section-label {
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: var(--muted);
                }

                .cover-preview {
                    width: 100%;
                    aspect-ratio: 1;
                    background: var(--secondary);
                    border-radius: var(--radius-md);
                    overflow: hidden;
                    position: relative;
                    cursor: pointer;
                    border: 1px solid var(--border);
                }

                .cover-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .placeholder-content {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: var(--muted);
                    gap: 0.5rem;
                }

                .placeholder-icon {
                    font-size: 2rem;
                }

                .hover-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .cover-preview:hover .hover-overlay {
                    opacity: 1;
                }

                .btn-small {
                    padding: 0.5rem 1rem;
                    background: rgba(255,255,255,0.2);
                    border-radius: var(--radius-full);
                    font-size: 0.85rem;
                    color: white;
                    border: 1px solid rgba(255,255,255,0.2);
                }

                .helper-text {
                    font-size: 0.75rem;
                    color: var(--muted);
                    margin-top: 0.25rem;
                }

                /* Form Section */
                .form-section {
                    padding: 2rem;
                }

                .form-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 2rem;
                }

                .section-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                }

                .btn-text {
                    background: none;
                    border: none;
                    color: var(--accent);
                    cursor: pointer;
                    font-size: 0.85rem;
                    text-decoration: underline;
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
                    color: var(--foreground);
                    font-size: 1rem;
                    outline: none;
                    border: 1px solid var(--border);
                }

                .input-field:focus {
                    border-color: var(--accent);
                }

                .textarea {
                    height: 120px;
                    resize: none;
                }

                .file-summary {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem;
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    margin-bottom: 2rem;
                    background: rgba(255,255,255,0.02);
                }

                .file-icon-small {
                    font-size: 1.2rem;
                }

                .filename-small {
                    flex: 1;
                    font-size: 0.9rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .filesize-small {
                    font-size: 0.8rem;
                    color: var(--muted);
                }

                .form-actions {
                    padding-top: 1rem;
                }

                .fluid {
                    width: 100%;
                }

                .form-row {
                    display: flex;
                    gap: 1rem;
                }
                
                .half {
                    flex: 1;
                }

                .checkbox-group {
                    display: flex;
                    align-items: center;
                    padding-top: 1.8rem; /* Align with input */
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    font-size: 0.95rem;
                }

                .checkbox-label input {
                    width: 18px;
                    height: 18px;
                    accent-color: var(--accent);
                }

                select.input-field {
                    appearance: none;
                    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
                    background-repeat: no-repeat;
                    background-position: right 1rem center;
                    background-size: 1em;
                }
            `}</style>
        </div >
    );
}
