import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const track = await prisma.track.findUnique({
            where: { id },
            include: {
                artist: {
                    select: {
                        name: true,
                        picture: true,
                        pubkey: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        purchases: true
                    }
                }
            }
        });

        if (!track) {
            return NextResponse.json({ error: 'Track not found' }, { status: 404 });
        }

        return NextResponse.json(track);

    } catch (error) {
        console.error('Get Track Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
