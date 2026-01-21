import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: { pubkey: string } }
) {
    const { pubkey } = params;

    try {
        const followers = await prisma.follow.findMany({
            where: { followingPubkey: pubkey },
            include: {
                follower: {
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
            followers: followers.map((f: any) => f.follower),
            count: followers.length
        });

    } catch (error) {
        console.error('Get Followers Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
