import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ pubkey: string }> }
) {
    const { pubkey } = await params;

    try {
        const following = await prisma.follow.findMany({
            where: { followerPubkey: pubkey },
            include: {
                following: {
                    select: {
                        pubkey: true,
                        name: true,
                        picture: true,
                        isArtist: true,
                    }
                }
            }
        });

        return NextResponse.json({
            following: following.map((f: any) => f.following),
            count: following.length
        });

    } catch (error) {
        console.error('Get Following Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
