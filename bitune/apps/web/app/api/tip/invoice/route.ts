import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyNip98Event } from '@/lib/nostr/nip98';
import { NWC } from '@/lib/nwc';
import { decrypt } from '@/lib/lightning/crypto';

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

        // Create Pending Tip in DB
        const tip = await prisma.tip.create({
            data: {
                senderPubkey: userPubkey,
                artistPubkey: artistPubkey,
                amountSats: amountSats,
                message: message ? message : null,
                status: 'PENDING'
            }
        });

        const invoice = await NWC.createInvoice(nwcUrl, amountSats / 1000, `Tip from BitTune: ${message || 'Keep it up!'}`);

        // Update Record with Invoice Hash
        await prisma.tip.update({
            where: { id: tip.id },
            data: { paymentHash: invoice.payment_hash }
        });

        return NextResponse.json({
            invoice: invoice.invoice,
            paymentHash: invoice.payment_hash
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
