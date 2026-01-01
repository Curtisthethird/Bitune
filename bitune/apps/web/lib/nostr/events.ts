import { verifyEvent, Event } from 'nostr-tools';

export function verifyNostrEvent(event: any): boolean {
    // Simple wrapper, casting any to fit nostr-tools Event if structure matches
    // In v2, verifyEvent takes an Event interface
    return verifyEvent(event);
}
