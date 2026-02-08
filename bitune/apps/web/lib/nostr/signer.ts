import { NostrEvent } from '@nostr-dev-kit/ndk';
import { KeyManager } from './key-manager';
import { finalizeEvent } from 'nostr-tools';
import { hexToBytes } from './utils';

export const NostrSigner = {
    /**
     * sign an event object
     * @param event - NDKEvent or raw event object (partial)
     */
    sign: async (event: any) => {
        const session = KeyManager.getSession();

        // 1. If no session, can't sign
        if (!session) {
            throw new Error('No active session found');
        }

        // 2. Extension
        if (session.method === 'extension') {
            if (!window.nostr) throw new Error('Nostr extension not found');
            return await window.nostr.signEvent(event);
        }

        // 3. Local Key
        if (session.method === 'local' && session.nsec) {
            const secret = KeyManager.parseNsec(session.nsec)?.secret;
            if (!secret) throw new Error('Invalid local key');

            // Encode secret back to Uint8Array if needed, or parseNsec should return Uint8Array? 
            // KeyManager.parseNsec returns hex string. We need Uint8Array for finalizeEvent.
            // Let's fix parseNsec in KeyManager or convert here.
            // Actually KeyManager.parseNsec returns { secret: hex }. 
            // We need to decode hex to bytes.
            const secretBytes = hexToBytes(secret);

            // Ensure event has pubkey
            if (!event.pubkey) event.pubkey = session.pubkey;
            if (!event.created_at) event.created_at = Math.floor(Date.now() / 1000);
            if (!event.tags) event.tags = [];
            if (!event.content) event.content = '';

            // Sign using finalizeEvent
            return finalizeEvent(event, secretBytes);
        }

        throw new Error('Unsupported sign method');
    },

    getPublicKey: async (): Promise<string> => {
        const session = KeyManager.getSession();
        if (session) return session.pubkey;

        // Fallback to extension if no session but extension exists (legacy behavior)
        if (window.nostr) return await window.nostr.getPublicKey();

        throw new Error('No user connected');
    },

    /**
     * Generates a NIP-98 Authorization header
     */
    generateAuthHeader: async (method: string, url: string): Promise<string> => {
        const event = {
            kind: 27235,
            created_at: Math.floor(Date.now() / 1000),
            tags: [
                ['u', url],
                ['method', method.toUpperCase()]
            ],
            content: ''
        };

        const signedEvent = await NostrSigner.sign(event);
        const token = btoa(JSON.stringify(signedEvent));
        return `Nostr ${token}`;
    }
};
