import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyNip98Event } from '@/lib/nostr/nip98';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const userPubkey = await verifyNip98Event(authHeader, 'POST', request.url);
        const { trackId } = await request.json();

        if (!trackId) {
            return NextResponse.json({ error: 'Missing trackId' }, { status: 400 });
        }

        // Ensure user exists (Listener)
        await prisma.user.upsert({
            where: { pubkey: userPubkey },
            create: { pubkey: userPubkey, isArtist: false },
            update: {}
        });

        // Check if already liked
        const existing = await prisma.like.findUnique({
            where: {
                userPubkey_trackId: {
                    userPubkey,
                    trackId
                }
            }
        });

        if (existing) {
            // Unlike
            await prisma.like.delete({
                where: { id: existing.id }
            });
            return NextResponse.json({ success: true, liked: false });
        } else {
            // Like
            await prisma.like.create({
                data: {
                    userPubkey,
                    trackId
                }
            });
            return NextResponse.json({ success: true, liked: true });
        }

    } catch (error) {
        console.error('Like API Error:', error);
        if (error instanceof Error && (error.message.includes('Authorization') || error.message.includes('Invalid'))) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
