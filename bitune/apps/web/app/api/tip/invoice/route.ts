import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyNip98Event } from '@/lib/nostr/nip98';
import { NWC } from '@/lib/nwc';
import { decrypt } from '@/lib/lightning/crypto';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const userPubkey = await verifyNip98Event(authHeader, 'POST', request.url);
        const { artistPubkey, amountSats, message } = await request.json();

        if (!amountSats || amountSats < 1) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

        const artist = await prisma.user.findUnique({
            where: { pubkey: artistPubkey },
            include: { wallet: true }
        });

        if (!artist || !artist.wallet) {
            return NextResponse.json({ error: 'Artist wallet not setup' }, { status: 400 });
        }

        const wallet = artist.wallet;
        const nwcUrl = decrypt(wallet.encryptedNwc, wallet.iv, wallet.authTag);

        const invoice = await NWC.createInvoice(nwcUrl, amountSats / 1000, `Tip from BitTune: ${message || 'Keep it up!'}`);

        return NextResponse.json({
            invoice: invoice.invoice,
            paymentHash: invoice.payment_hash
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
