import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyNip98Event } from '@/lib/nostr/nip98';

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        // Verify user via NIP-98
        const userPubkey = await verifyNip98Event(authHeader, 'POST', request.url);

        const body = await request.json();
        const { targetPubkey } = body;

        if (!targetPubkey) {
            return NextResponse.json({ error: 'Missing targetPubkey' }, { status: 400 });
        }

        if (userPubkey === targetPubkey) {
            return NextResponse.json({ error: 'Cannot follow self' }, { status: 400 });
        }

        // Ensure both users exist
        await prisma.user.upsert({
            where: { pubkey: userPubkey },
            create: { pubkey: userPubkey, isArtist: false },
            update: {}
        });

        await prisma.user.upsert({
            where: { pubkey: targetPubkey },
            create: { pubkey: targetPubkey },
            update: {}
        });

        // Check if already following
        const existing = await prisma.follow.findUnique({
            where: {
                followerPubkey_followingPubkey: {
                    followerPubkey: userPubkey,
                    followingPubkey: targetPubkey,
                },
            },
        });

        if (existing) {
            // Unfollow
            await prisma.follow.delete({
                where: {
                    followerPubkey_followingPubkey: {
                        followerPubkey: userPubkey,
                        followingPubkey: targetPubkey,
                    },
                },
            });
            return NextResponse.json({ following: false });
        } else {
            // Follow
            await prisma.follow.create({
                data: {
                    followerPubkey: userPubkey,
                    followingPubkey: targetPubkey,
                },
            });
            return NextResponse.json({ following: true });
        }

    } catch (error) {
        if (error instanceof Error && (error.message.includes('Authorization') || error.message.includes('Invalid'))) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        console.error('Follow error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
