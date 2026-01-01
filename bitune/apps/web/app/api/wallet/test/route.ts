import { NextResponse } from 'next/server';
import { NWCClient } from '@getalby/sdk';

export async function POST(request: Request) {
    try {
        const { nwcUrl } = await request.json();
        if (!nwcUrl) return NextResponse.json({ error: 'Missing Connection String' }, { status: 400 });

        const client = new NWCClient({ nostrWalletConnectUrl: nwcUrl });
        const info = await client.getInfo();

        return NextResponse.json({ success: true, info });
    } catch (error: any) {
        console.error('Wallet Test Error', error);
        return NextResponse.json({ error: error.message || 'Connection failed' }, { status: 400 });
    }
}
