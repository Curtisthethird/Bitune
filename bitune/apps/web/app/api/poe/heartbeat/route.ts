import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
    validateEventStructure,
    validateContent,
    validateTiming,
    validatePosition,
    PoEContent,
    POE_HEARTBEAT_SECONDS,
    POE_ELIGIBLE_SECONDS
} from '@/lib/poe/rules';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const event = await request.json();

        // 1. Structure Check
        const structureRule = validateEventStructure(event);
        if (!structureRule.valid) return NextResponse.json({ error: structureRule.error }, { status: 400 });

        let content: PoEContent;
        try {
            content = JSON.parse(event.content);
        } catch {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        // 2. Content Logic Check
        const contentRule = validateContent(content);
        if (!contentRule.valid) return NextResponse.json({ error: contentRule.error }, { status: 400 });

        const serverNow = Date.now();

        // 3. Timing Check (Clock Skew)
        const timeRule = validateTiming(serverNow, content.clientTs);
        if (!timeRule.valid) return NextResponse.json({ error: timeRule.error }, { status: 400 });

        // 4. Load Session
        const sessionId = content.sessionId;

        // Anti-replay: ID check
        const existingEvent = await prisma.poEEvent.findUnique({ where: { nostrEventId: event.id } });
        if (existingEvent) {
            // Idempotent success? Or error?
            // Spec says "ignore duplicates safely".
            return NextResponse.json({ success: true, duplicated: true });
        }

        const session = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        if (session.status === 'COMPLETED') return NextResponse.json({ error: 'Session completed' }, { status: 400 });
        if (session.listenerPubkey !== event.pubkey) return NextResponse.json({ error: 'Pubkey mismatch' }, { status: 403 });

        // 5. Position & Interval Check
        const posRule = validatePosition(content.positionMs, session.lastPositionMs);
        if (!posRule.valid) return NextResponse.json({ error: posRule.error }, { status: 400 });

        // Interval sanity check
        // "reject bursts (e.g., > 3 heartbeats in 10 seconds)"
        // We can check lastHeartbeat time.
        const sinceLastHeartbeat = serverNow - session.lastHeartbeat.getTime();
        if (sinceLastHeartbeat < 1000) {
            // Too fast (<1s).
            // Allow simple debounce? Or strictly reject.
            return NextResponse.json({ error: 'Rate limit (fast)' }, { status: 429 });
        }

        // 6. Credit Time
        // Spec: "credit max 5 seconds per heartbeat"
        // We assume heartbeat interval is 5s.
        // If strict, we credit POE_HEARTBEAT_SECONDS.

        const newCredited = session.creditedSeconds + POE_HEARTBEAT_SECONDS;
        const isEligible = newCredited >= POE_ELIGIBLE_SECONDS;

        // Transaction to ensure atomicity
        await prisma.$transaction([
            prisma.poEEvent.create({
                data: {
                    nostrEventId: event.id,
                    sessionId,
                    receivedAt: new Date(),
                }
            }),
            prisma.session.update({
                where: { id: sessionId },
                data: {
                    creditedSeconds: newCredited,
                    lastHeartbeat: new Date(),
                    lastPositionMs: content.positionMs,
                    lastClientTs: content.clientTs, // Prisma handles BigInt
                    eligibleAt: (isEligible && !session.eligibleAt) ? new Date() : undefined
                }
            })
        ]);

        return NextResponse.json({
            success: true,
            credited: newCredited,
            eligible: isEligible || !!session.eligibleAt
        });

    } catch (e: any) {
        console.error('Heartbeat Error', e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
