import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyNip98Event } from '@/lib/nostr/nip98';

export async function GET(request: Request) {
    // This is a bit tricky. We need to know WHO is asking (via header) 
    // and WHO they are checking against (user pubkey). 
    // Actually, usually the client wants to know "Am I following Artist X?".
    // So let's make this endpoint: /api/follow/check?target=X
    // Or stick to /api/users/[pubkey]/is-following which implies "Is current user following [pubkey]?"

    // Let's assume standard NextJS pattern for query params is easiest for simple GET.
    const { searchParams } = new URL(request.url);
    const targetPubkey = searchParams.get('target');

    if (!targetPubkey) {
        return NextResponse.json({ error: 'Missing target pubkey' }, { status: 400 });
    }

    try {
        const authHeader = request.headers.get('authorization');
        // If not logged in, obviously not following
        if (!authHeader) {
            return NextResponse.json({ isFollowing: false });
        }

        const userPubkey = await verifyNip98Event(authHeader, 'GET', request.url);

        const follow = await prisma.follow.findUnique({
            where: {
                followerPubkey_followingPubkey: {
                    followerPubkey: userPubkey,
                    followingPubkey: targetPubkey
                }
            }
        });

        return NextResponse.json({ isFollowing: !!follow });

    } catch (error) {
        // If auth fails, just return false for "isFollowing" instead of 401 error, 
        // because the UI just needs to know state.
        return NextResponse.json({ isFollowing: false });
    }
}
