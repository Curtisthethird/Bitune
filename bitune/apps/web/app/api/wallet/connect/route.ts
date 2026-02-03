import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/lightning/crypto';

export async function POST(request: Request) {
    try {
        const { nwcUrl, pubkey } = await request.json();
        if (!nwcUrl || !pubkey) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

        const { encrypted, iv, authTag } = encrypt(nwcUrl);

        await prisma.artistWallet.upsert({
            where: { pubkey },
            update: {
                encryptedNwc: encrypted,
                iv,
                authTag,
            },
            create: {
                pubkey,
                encryptedNwc: encrypted,
                iv,
                authTag,
            },
        });

        await prisma.user.update({
            where: { pubkey },
            data: { isArtist: true }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
