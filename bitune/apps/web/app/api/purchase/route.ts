import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyNip98Event } from '@/lib/nostr/nip98';

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        // Verify user via NIP-98
        const userPubkey = await verifyNip98Event(authHeader, 'POST', request.url);

        const body = await request.json();
        const { trackId, amount } = body;

        if (!trackId || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate track exists and amount meets minimum price
        const track = await prisma.track.findUnique({ where: { id: trackId } });
        if (!track) {
            return NextResponse.json({ error: 'Track not found' }, { status: 404 });
        }

        if (amount < track.price) {
            return NextResponse.json({ error: `Amount below minimum price of ${track.price}` }, { status: 400 });
        }

        // Create purchase record
        // In a real app, we would verify the payment via LNC or similar before recording.
        // For MVP, we trust the client to have paid (or we integrate payment link generation here).
        // Let's assume this endpoint is called AFTER successful payment or triggers the flow.
        // For simplicity/demo: "Record Purchase"
        const purchase = await prisma.purchase.create({
            data: {
                userPubkey,
                trackId,
                amount: parseFloat(amount),
                currency: 'SATS'
            }
        });

        return NextResponse.json(purchase);

    } catch (error) {
        if (error instanceof Error && (error.message.includes('Authorization') || error.message.includes('Invalid'))) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        console.error('Purchase error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
