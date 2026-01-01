export interface User {
  pubkey: string;
  isArtist: boolean;
  createdAt: Date;
}

export interface Track {
  id: string;
  title: string;
  artistPubkey: string;
  audioUrl?: string; // For MVP locally
  nostrEventId: string;
  createdAt: Date;
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
