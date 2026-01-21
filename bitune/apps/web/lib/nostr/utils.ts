export function hexToBytes(hex: string): Uint8Array {
    if (typeof hex !== 'string') {
        throw new TypeError('hexToBytes: expected string, got ' + typeof hex);
    }
    if (hex.length % 2) throw new Error('hexToBytes: invalid hex string length');
    const array = new Uint8Array(hex.length / 2);
    for (let i = 0; i < array.length; i++) {
        const j = i * 2;
        const hexByte = hex.slice(j, j + 2);
        const byte = parseInt(hexByte, 16);
        if (Number.isNaN(byte) || byte < 0) throw new Error('Invalid hex byte');
        array[i] = byte;
    }
    return array;
}

export function bytesToHex(bytes: Uint8Array): string {
    if (!(bytes instanceof Uint8Array)) throw new TypeError('bytesToHex: expected Uint8Array');
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
