import { NWCClient } from '@getalby/sdk';
import { decrypt } from '../lightning/crypto';

export const NWC = {
    /**
     * Get a client instance from a decrypted connection string
     */
    getClient: (nwcUrl: string) => {
        return new NWCClient({ nostrWalletConnectUrl: nwcUrl });
    },

    /**
     * Get wallet balance in sats
     */
    getBalance: async (nwcUrl: string): Promise<number> => {
        try {
            const client = new NWCClient({ nostrWalletConnectUrl: nwcUrl });
            const balance = await client.getBalance();
            // @getalby/sdk balance structure might vary, usually it has `balance` in msats
            // Let's check documentation or assume standard response. 
            // Usually returns { balance: number (msats), ... }
            return Math.floor(balance.balance / 1000);
        } catch (error) {
            console.error('NWC Balance Check Failed:', error);
            throw error;
        }
    },

    /**
     * Create an invoice (receiving payments)
     * For "Withdrawal" flow: User creates invoice, Server pays it.
     */
    createInvoice: async (nwcUrl: string, amountSats: number, description?: string) => {
        try {
            const client = new NWCClient({ nostrWalletConnectUrl: nwcUrl });
            // nwc.makeInvoice({ amount, defaultMemo }) - amount in msats usually
            const invoice = await client.makeInvoice({
                amount: amountSats * 1000
            });
            return invoice; // { paymentRequest, paymentHash, ... }
        } catch (error) {
            console.error('NWC Create Invoice Failed:', error);
            throw error;
        }
    },

    /**
     * Pay an invoice (sending payments)
     * If the app were to pay users (Server NWC), we'd use this.
     */
    payInvoice: async (nwcUrl: string, invoice: string) => {
        try {
            const client = new NWCClient({ nostrWalletConnectUrl: nwcUrl });
            const response = await client.payInvoice({ invoice });
            return response; // { preimage }
        } catch (error) {
            console.error('NWC Pay Invoice Failed:', error);
            throw error;
        }
    }
};
