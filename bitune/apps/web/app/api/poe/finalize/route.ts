import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const { sessionId, pubkey } = await request.json();
        if (!sessionId || !pubkey) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

        const session = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        if (session.listenerPubkey !== pubkey) return NextResponse.json({ error: 'Mismatch' }, { status: 403 });

        // Mark completed
        // We do NOT credit extra time here to prevent abuse (only signed heartbeats credit time).

        await prisma.session.update({
            where: { id: sessionId },
            data: { status: 'COMPLETED' }
        });

        return NextResponse.json({
            success: true,
            creditedSeconds: session.creditedSeconds,
            eligible: !!session.eligibleAt
        });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}
