import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyNip98Event } from '@/lib/nostr/nip98';
import { socialLimiter } from '@/lib/ratelimit';

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const reporterPubkey = await verifyNip98Event(authHeader, 'POST', request.url);

        const { trackId, reason } = await request.json();

        if (!trackId) {
            return NextResponse.json({ error: 'Track ID required' }, { status: 400 });
        }

        // Rate limit reports per user
        if (!socialLimiter.check(reporterPubkey)) {
            return NextResponse.json({ error: 'Too many reports. Please wait.' }, { status: 429 });
        }

        // Mark track as flagged
        // In a production app, we might create a 'Report' record first.
        // For launch, we'll mark as flagged and notify (console log for now).
        await prisma.track.update({
            where: { id: trackId },
            data: { isFlagged: true }
        });

        console.log(`[CONTENT MODERATION] Track ${trackId} flagged by ${reporterPubkey}. Reason: ${reason || 'Not provided'}`);

        return NextResponse.json({ success: true, message: 'Report received. Thank you for keeping BitTune safe.' });

    } catch (error) {
        console.error('Report Track Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
