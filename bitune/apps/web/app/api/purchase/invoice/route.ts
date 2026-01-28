import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyNip98Event } from '@/lib/nostr/nip98';
import { NWC } from '@/lib/nwc';
import { decrypt } from '@/lib/lightning/crypto';

// In a real app, this would use the ARTIST'S node to generate an invoice.
// For this MVP, we might simulate it or use the platform node if we act as custodian (not ideal for decentralized app).
// BETTER MVP APPROACH: 
// 1. User wants to buy Track X (1000 sats).
// 2. Server looks up Artist of Track X.
// 3. Server gets Artist's stored NWC string (encrypted).
// 4. Server uses Artist's NWC to generate an invoice for 1000 sats.
// 5. Server returns this invoice to the User.
// 6. User pays invoice (using their own wallet/extension).
// 7. Server (or Client) polls for status. Once paid, grant download access.

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const userPubkey = await verifyNip98Event(authHeader, 'POST', request.url);
        const { trackId } = await request.json();

        // 1. Get Track & Artist
        const track = await prisma.track.findUnique({
            where: { id: trackId },
            include: { artist: { include: { wallet: true } } }
        });

        if (!track || !track.artist) {
            return NextResponse.json({ error: 'Track not found' }, { status: 404 });
        }

        // 2. Check if Artist has Wallet
        const wallet = track.artist.wallet;
        if (!wallet) {
            return NextResponse.json({ error: 'Artist cannot receive payments yet' }, { status: 400 });
        }

        // 3. Decrypt Artist NWC
        const nwcUrl = decrypt(wallet.encryptedNwc, wallet.iv, wallet.authTag);

        // 4. Generate Invoice via Artist's NWC
        // Note: NWC usually lets you PAY. Does it let you MAKE_INVOICE? 
        // Yes, Alby NWC supports make_invoice.
        const invoice = await NWC.createInvoice(nwcUrl, track.price / 1000, `Purchase: ${track.title}`);

        if (!invoice.paymentRequest) {
            throw new Error('Failed to generate invoice');
        }

        // 5. Record Pending Purchase
        // We'll trust the invoice ID/PaymentHash to verify later.
        // For now, we return it.

        return NextResponse.json({
            invoice: invoice.invoice,
            paymentHash: invoice.payment_hash,
            amount: track.price
        });

    } catch (error: any) {
        console.error("Purchase Error:", error);
        return NextResponse.json({ error: error.message || 'Error generating invoice' }, { status: 500 });
    }
}
