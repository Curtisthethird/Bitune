import { NextResponse } from 'next/server';
import { NWC } from '@/lib/nwc';

export async function POST(request: Request) {
    try {
        const { nwcUrl } = await request.json();
        if (!nwcUrl) return NextResponse.json({ error: 'Missing Connection String' }, { status: 400 });

        const client = NWC.getClient(nwcUrl);
        const info = await client.getInfo();
        const balance = await NWC.getBalance(nwcUrl);

        return NextResponse.json({ success: true, info, balance });
    } catch (error: any) {
        console.error('Wallet Test Error', error);
        return NextResponse.json({ error: error.message || 'Connection failed' }, { status: 400 });
    }
}
