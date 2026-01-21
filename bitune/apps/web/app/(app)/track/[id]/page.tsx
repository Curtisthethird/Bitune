'use client';
import { useEffect, useState } from 'react';
import Player from '@/components/Player';
import { useParams } from 'next/navigation';
import { NostrSigner } from '../../../../lib/nostr/signer';

export default function TrackPage() {
    const { id } = useParams();
    const [track, setTrack] = useState<any>(null);
    const [pubkey, setPubkey] = useState('');

    useEffect(() => {
        NostrSigner.getPublicKey().then(setPubkey).catch(() => { });
        if (id) {
            // Fetch specific track. API GET /api/track returns all.
            // I should implement /api/track/[id] or filter on client (MVP).
            // I'll fetch list and find.
            fetch('/api/track').then(r => r.json()).then(d => {
                const t = d.tracks.find((x: any) => x.id === id);
                setTrack(t);
            });
        }
    }, [id]);

    if (!track) return <div>Loading or Not Found...</div>;

    return (
        <div className="p-4">
            <h1>{track.title}</h1>
            <p>Artist: {track.artistPubkey}</p>
            {pubkey ? (
                <Player track={track} listenerPubkey={pubkey} />
            ) : (
                <p>Please login to play</p>
            )}
        </div>
    );
}
