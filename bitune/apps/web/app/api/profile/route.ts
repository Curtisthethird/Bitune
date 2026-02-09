import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyNip98Event } from '@/lib/nostr/nip98';
import { profileLimiter } from '@/lib/ratelimit';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const pubkey = searchParams.get('pubkey');

    if (!pubkey) {
        return NextResponse.json({ error: 'Missing pubkey' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: { pubkey },
        select: { pubkey: true, name: true, about: true, picture: true, isArtist: true, isVerified: true }
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
}

export async function PUT(request: Request) {
    try {
        // 1. Authenticate with NIP-98
        const authHeader = request.headers.get('Authorization');
        const url = request.url;
        const pubkey = await verifyNip98Event(authHeader, 'PUT', url);

        // 2. Rate Limit Check
        if (!profileLimiter.check(pubkey)) {
            return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 });
        }

        // 2. Parse Body
        const body = await request.json();
        const { name, about, picture } = body;

        // 3. Update DB
        const user = await prisma.user.upsert({
            where: { pubkey },
            create: {
                pubkey,
                name,
                about,
                picture
            },
            update: {
                name,
                about,
                picture
            }
        });

        return NextResponse.json({ success: true, user });

    } catch (e: any) {
        console.error('Profile Update Error', e);
        return NextResponse.json({ error: e.message || 'Unauthorized' }, { status: 401 });
    }
}
