'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';

export default function UploadPage() {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const { showToast } = useToast();
    const router = useRouter();

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !file) {
            showToast('Please select a file and title', 'error');
            return;
        }

        showToast('Signing event...', 'info');
        try {
            if (!window.nostr) throw new Error('Login first');

            // 1. Sign NIP-98 Event
            const pubkey = await window.nostr.getPublicKey();
            const apiUrl = window.location.origin + '/api/upload/audio';
            const event = {
                kind: 27235,
                created_at: Math.floor(Date.now() / 1000),
                tags: [
                    ['u', apiUrl],
                    ['method', 'POST']
                ],
                content: '',
                pubkey
            };
            const signedEvent = await window.nostr.signEvent(event);
            const token = btoa(JSON.stringify(signedEvent));

            showToast('Uploading audio...', 'info');

            // 2. Upload File
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', title);
            // formData.append('artistId', pubkey); // Removed, derived from header

            const uploadRes = await fetch('/api/upload/audio', {
                method: 'POST',
                headers: {
                    'Authorization': `Nostr ${token}`
                },
                body: formData,
            });

            if (!uploadRes.ok) {
                const err = await uploadRes.json();
                throw new Error(err.error || 'Upload failed');
            }

            const { trackId } = await uploadRes.json();

            showToast('Upload Successful!', 'success');
            setTimeout(() => {
                router.push(`/track/${trackId}`);
            }, 1000);

        } catch (e: any) {
            console.error(e);
            showToast(e.message, 'error');
        }
    };

    return (
        <div className="p-4 max-w-lg mx-auto">
            <h1 className="text-2xl mb-4">Upload Track</h1>
            <form onSubmit={handleUpload} className="space-y-4">
                <div>
                    <label className="block mb-1 font-bold">Title</label>
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Track Title"
                        className="w-full p-2 border rounded text-black"
                        required
                    />
                </div>
                <div>
                    <label className="block mb-1 font-bold">Audio File</label>
                    <input
                        type="file"
                        accept="audio/*"
                        onChange={e => setFile(e.target.files?.[0] || null)}
                        className="w-full"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Upload & Publish
                </button>
            </form>
        </div>
    );
}
