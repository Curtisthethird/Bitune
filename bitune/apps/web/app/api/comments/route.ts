import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyNip98Event } from '@/lib/nostr/nip98';

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        // Verify user via NIP-98
        const userPubkey = await verifyNip98Event(authHeader, 'POST', request.url);

        const body = await request.json();
        const { trackId, content, timestampMs } = body;

        if (!trackId || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Ensure user exists
        await prisma.user.upsert({
            where: { pubkey: userPubkey },
            create: { pubkey: userPubkey },
            update: {}
        });

        // Create comment
        const comment = await prisma.comment.create({
            data: {
                trackId,
                userPubkey,
                content,
                timestampMs: timestampMs || 0 // Default to 0 if not provided
            }
        });

        return NextResponse.json(comment);

    } catch (error) {
        if (error instanceof Error && (error.message.includes('Authorization') || error.message.includes('Invalid'))) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        console.error('Comment creation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get('trackId');

    if (!trackId) {
        return NextResponse.json({ error: 'Missing trackId' }, { status: 400 });
    }

    try {
        // Get track and artist first to check for tips
        const track = await prisma.track.findUnique({
            where: { id: trackId },
            select: { artistPubkey: true }
        });

        const comments = await prisma.comment.findMany({
            where: { trackId },
            include: {
                user: {
                    select: {
                        pubkey: true,
                        name: true,
                        picture: true,
                        isArtist: true,
                        purchases: {
                            where: { trackId },
                            select: { id: true }
                        },
                        tipsSent: {
                            where: {
                                artistPubkey: track?.artistPubkey,
                                status: 'COMPLETED'
                            },
                            select: { id: true }
                        }
                    }
                }
            },
            orderBy: {
                timestampMs: 'asc'
            }
        });

        // Map comments to include supporter status
        const commentsWithBadges = comments.map(c => {
            let supporterLevel: 'fan' | 'superfan' | null = null;
            if (c.user.purchases.length > 0) supporterLevel = 'superfan';
            else if (c.user.tipsSent.length > 0) supporterLevel = 'fan';

            return {
                ...c,
                supporterLevel
            };
        });

        return NextResponse.json(commentsWithBadges);

    } catch (error) {
        console.error('Fetch comments error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
