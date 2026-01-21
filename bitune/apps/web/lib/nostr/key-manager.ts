import { generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';
import { bytesToHex } from './utils';

const SESSION_KEY = 'bitune_session_nsec';

export interface AuthSession {
    method: 'extension' | 'local';
    pubkey: string;
    nsec?: string;
}

export const KeyManager = {
    /**
     * Generate a new random keypair
     */
    generate: () => {
        const secret = generateSecretKey();
        const pubkey = getPublicKey(secret);
        return {
            secret: bytesToHex(secret),
            nsec: nip19.nsecEncode(secret),
            pubkey,
            npub: nip19.npubEncode(pubkey),
        };
    },

    /**
     * Validate and parse an nsec string
     */
    parseNsec: (nsec: string) => {
        try {
            const { type, data } = nip19.decode(nsec);
            if (type !== 'nsec') throw new Error('Invalid key type');
            const secret = data as Uint8Array;
            const pubkey = getPublicKey(secret);
            return {
                secret: bytesToHex(secret),
                pubkey,
            };
        } catch (e) {
            console.error('Failed to parse nsec', e);
            return null;
        }
    },

    /**
     * Save session to local storage
     */
    saveSession: (nsec: string) => {
        if (typeof window === 'undefined') return;
        // In a real app, we should encrypt this. For now, we store raw nsec (simulating "hot wallet" behavior)
        localStorage.setItem(SESSION_KEY, nsec);
    },

    /**
     * Get current session
     */
    getSession: (): AuthSession | null => {
        if (typeof window === 'undefined') return null;
        const nsec = localStorage.getItem(SESSION_KEY);
        if (nsec) {
            const parsed = KeyManager.parseNsec(nsec);
            if (parsed) {
                return {
                    method: 'local',
                    pubkey: parsed.pubkey,
                    nsec,
                };
            }
        }
        return null;
    },

    /**
     * Clear session
     */
    logout: () => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(SESSION_KEY);
    }
};
