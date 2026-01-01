import { NWCClient } from '@getalby/sdk';
import { decrypt } from './crypto';

export interface NWCError {
    code: string;
    message: string;
}

export async function createNwcClient(encryptedNwc: string, iv: string, authTag: string): Promise<NWCClient> {
    const nwcString = decrypt(encryptedNwc, iv, authTag);
    return new NWCClient({ nostrWalletConnectUrl: nwcString });
}

export async function createTreasuryClient(): Promise<NWCClient> {
    const nwcString = process.env.PLATFORM_TREASURY_NWC;
    if (!nwcString) throw new Error('PLATFORM_TREASURY_NWC not set');
    return new NWCClient({ nostrWalletConnectUrl: nwcString });
}

async function retry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (e) {
            lastError = e;
            // Simple backoff
            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
    }
    throw lastError;
}

export async function generateInvoice(client: NWCClient, amountSats: number, description: string): Promise<string> {
    try {
        const result = await retry(() => client.makeInvoice({
            amount: amountSats * 1000,
            description
        }));
        return result.invoice;
    } catch (error: any) {
        console.error("Generate Invoice Error", error);
        throw classifyError(error);
    }
}

export async function payInvoice(client: NWCClient, invoice: string): Promise<string> {
    try {
        const result = await retry(() => client.payInvoice({ invoice }));
        return result.preimage;
    } catch (error: any) {
        console.error("Pay Invoice Error", error);
        throw classifyError(error);
    }
}

function classifyError(error: any): NWCError {
    const msg = error.message || 'Unknown error';
    if (msg.toLowerCase().includes('quota')) return { code: 'QUOTA_EXCEEDED', message: msg };
    if (msg.toLowerCase().includes('insufficient')) return { code: 'INSUFFICIENT_BALANCE', message: msg };
    if (msg.toLowerCase().includes('timeout')) return { code: 'TIMEOUT', message: msg };
    return { code: 'UNKNOWN', message: msg };
}
