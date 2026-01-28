import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { amount } = await request.json();

        // In a real production app, you'd connect to LND, CLN, or a service like Strike/LNBits
        // to generate a real BOLT11 invoice for the specified amount.
        // For demonstration/launch readiness flow, we return a mock BOLT11.

        // This is a truncated dummy BOLT11-like string
        const mockInvoice = `lnbc10u1p3...mock_invoice_for_${amount}_sats`;

        return NextResponse.json({ invoice: mockInvoice });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
    }
}
