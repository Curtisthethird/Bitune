import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { sessionId, trackId, listenerPubkey } = await request.json();

        // Verify track exists?
        const track = await prisma.track.findUnique({ where: { id: trackId } });
        if (!track) return NextResponse.json({ error: 'Track not found' }, { status: 404 });

        const session = await prisma.session.create({
            data: {
                id: sessionId,
                trackId,
                listenerPubkey,
            }
        });
        return NextResponse.json({ success: true, session });
    } catch (e) {
        console.error(e);
        // Ignore if already exists (idempotent for UUID)
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
