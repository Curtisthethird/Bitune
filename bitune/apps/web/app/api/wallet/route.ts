import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyNip98Event } from '@/lib/nostr/nip98';
import { decrypt } from '@/lib/lightning/crypto';
import { NWC } from '@/lib/nwc';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        // 1. Auth Check (NIP-98)
        const authHeader = request.headers.get('Authorization');
        const userPubkey = await verifyNip98Event(authHeader, 'GET', request.url);

        // 2. Fetch Wallet Config
        const wallet = await prisma.artistWallet.findUnique({
            where: { pubkey: userPubkey }
        });

        if (!wallet) {
            return NextResponse.json({ connected: false });
        }

        // 3. Decrypt & Fetch Balance
        try {
            const nwcUrl = decrypt(wallet.encryptedNwc, wallet.iv, wallet.authTag);
            const balance = await NWC.getBalance(nwcUrl);

            return NextResponse.json({
                connected: true,
                balance,
                updatedAt: wallet.updatedAt
            });
        } catch (e) {
            console.error("NWC Decrypt/Fetch Failed", e);
            return NextResponse.json({
                connected: true,
                error: 'Failed to connect to wallet',
                balance: 0
            });
        }

    } catch (error: any) {
        console.error('Wallet Get Error', error);
        return NextResponse.json({ error: error.message }, { status: 401 });
    } finally {
        await prisma.$disconnect();
    }
}
