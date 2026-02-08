export interface User {
    pubkey: string;
    name?: string;
    picture?: string;
    about?: string;
    isArtist: boolean;
    createdAt: Date;
}

export interface Track {
    id: string;
    title: string;
    artistPubkey: string;
    audioUrl?: string; // For MVP locally
    nostrEventId?: string; // Made optional if creating locally before publishing
    coverUrl?: string;
    description?: string;
    durationMs?: number;
    genre?: string;
    explicit?: boolean;
    createdAt: Date;
    // UI/Computed fields
    plays?: number;
    likes?: number;
    artist?: {
        name?: string;
        picture?: string;
    };
    price?: number;
    hasPurchased?: boolean;
}

export interface Session {
    id: string;
    trackId: string;
    listenerPubkey: string;
    startTime: Date;
    creditedSeconds: number;
    eligibleAt?: Date;
    lastHeartbeat?: Date;
}

export interface ArtistSettings {
    pubkey: string;
    encryptedNwc: string;
}

export interface Payout {
    id: string;
    sessionId: string;
    amountSats: number;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    paymentPreimage?: string;
    createdAt: Date;
}
