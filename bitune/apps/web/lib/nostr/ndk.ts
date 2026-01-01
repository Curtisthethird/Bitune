import NDK from '@nostr-dev-kit/ndk';

let ndk: NDK | undefined;

export const getNDK = async (): Promise<NDK> => {
    if (ndk) return ndk;

    const explicitRelays = (process.env.NEXT_PUBLIC_DEFAULT_RELAYS || '').split(',').filter(Boolean);

    ndk = new NDK({
        explicitRelayUrls: explicitRelays.length > 0 ? explicitRelays : ['wss://relay.damus.io'],
    });

    await ndk.connect();
    return ndk;
};
