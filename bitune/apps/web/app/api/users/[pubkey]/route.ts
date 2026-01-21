import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Now valid since we created it

export async function GET(
    request: Request,
    { params }: { params: Promise<{ pubkey: string }> }
) {
    const { pubkey } = await params;

    try {
        const user = await prisma.user.findUnique({
            where: { pubkey },
            include: {
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        tracks: true,
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);

    } catch (error) {
        console.error('Get User Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
