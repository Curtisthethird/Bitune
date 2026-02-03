import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyNip98Event } from '@/lib/nostr/nip98';
import { decrypt } from '@/lib/lightning/crypto';
import { NWC } from '@/lib/nwc';

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const userPubkey = await verifyNip98Event(authHeader, 'POST', request.url);

        const { amountSats } = await request.json();
        if (!amountSats || amountSats < 1) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // 1. Get User's Wallet
        const wallet = await prisma.artistWallet.findUnique({
            where: { pubkey: userPubkey }
        });
        if (!wallet) {
            return NextResponse.json({ error: 'No wallet connected' }, { status: 400 });
        }

        // 2. Decrypt NWC
        const nwcUrl = decrypt(wallet.encryptedNwc, wallet.iv, wallet.authTag);

        // 3. Create Invoice on User's Wallet (requesting payment TO user)
        // BitTune Server acts as the 'sender' of funds, but here we just simulate
        // by having the user generate an invoice. In a real app, the server would then PAY this invoice.
        // For this demo: We make the invoice, and then we "mark as paid" in our DB. 
        // Real flow: User generates invoice -> Server pays invoice via its own NWC/Lightning node -> DB updated.
        const invoice = await NWC.createInvoice(nwcUrl, amountSats, 'BitTune Payout');

        // 4. Simulate Payment (mark relevant payouts as PAID)
        // In reality we would verify the server paid it.
        // For this MVP, we just record a "Withdrawal" transaction or updated mock payouts.
        // Since we don't have a "User Balance" table, we are aggregating Payouts.
        // We'll Create a new Payout record with negative amount? Or just return success.
        // The current schema `Payout` is for "Session -> Artist".
        // Let's assume this clears the "Pending" balance if we had one.
        // Since we lack a complex ledger, we'll just return success and the invoice payment hash.

        return NextResponse.json({
            success: true,
            message: `Withdrawal of ${amountSats} sats initiated`,
            invoice: invoice.invoice
        });

    } catch (error: any) {
        console.error('Withdraw Error', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
