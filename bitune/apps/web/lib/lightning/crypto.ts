import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
    const keyStr = process.env.NWC_ENCRYPTION_KEY;
    if (!keyStr) {
        throw new Error('NWC_ENCRYPTION_KEY is not set');
    }
    // If key is base64, decode it
    return Buffer.from(keyStr, 'base64');
}

export function encrypt(text: string): { encrypted: string, iv: string, authTag: string } {
    const key = getKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return {
        encrypted,
        iv: iv.toString('hex'),
        authTag
    };
}

export function decrypt(encrypted: string, ivHex: string, authTagHex: string): string {
    const key = getKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
