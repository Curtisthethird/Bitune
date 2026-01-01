import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const { pubkey } = await request.json();
        if (!pubkey) return NextResponse.json({ error: 'Missing pubkey' }, { status: 400 });

        const user = await prisma.user.upsert({
            where: { pubkey },
            update: {},
            create: { pubkey },
        });

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
