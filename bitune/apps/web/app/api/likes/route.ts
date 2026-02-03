import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyNip98Event } from '@/lib/nostr/nip98';

// GET /api/likes/check?trackId=...
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const trackId = searchParams.get('trackId');
        const authHeader = request.headers.get('Authorization');

        if (!trackId || !authHeader) {
            return NextResponse.json({ liked: false });
        }

        const userPubkey = await verifyNip98Event(authHeader, 'GET', request.url);

        const like = await prisma.like.findUnique({
            where: {
                userPubkey_trackId: {
                    userPubkey,
                    trackId
                }
            }
        });

        return NextResponse.json({ liked: !!like });
    } catch (error) {
        return NextResponse.json({ liked: false });
    }
}

// POST /api/likes: Toggle like
export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const userPubkey = await verifyNip98Event(authHeader, 'POST', request.url);
        const { trackId } = await request.json();

        if (!trackId) return NextResponse.json({ error: 'Track ID required' }, { status: 400 });

        // Check if exists
        const existing = await prisma.like.findUnique({
            where: {
                userPubkey_trackId: {
                    userPubkey,
                    trackId
                }
            }
        });

        if (existing) {
            // Un-like
            await prisma.like.delete({
                where: { id: existing.id }
            });
            return NextResponse.json({ liked: false });
        } else {
            // Like
            // Ensure user exists
            await prisma.user.upsert({
                where: { pubkey: userPubkey },
                create: { pubkey: userPubkey },
                update: {}
            });

            await prisma.like.create({
                data: {
                    userPubkey,
                    trackId
                }
            });
            return NextResponse.json({ liked: true });
        }

    } catch (error: any) {
        console.error('Like API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
