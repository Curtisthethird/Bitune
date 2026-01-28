
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding analytics data...');

    // 1. Get Artists
    const artist = await prisma.user.findFirst({ where: { isArtist: true } });
    if (!artist) {
        console.error('No artist found. Run normal seed first.');
        return;
    }
    console.log(`Seeding data for Artist: ${artist.name} (${artist.pubkey})`);

    // 2. Get Tracks
    const tracks = await prisma.track.findMany({ where: { artistPubkey: artist.pubkey } });
    if (tracks.length === 0) {
        console.log('No tracks found. Creating a dummy track.');
        const t = await prisma.track.create({
            data: {
                title: 'Neon Nights',
                artistPubkey: artist.pubkey,
                durationMs: 180000,
                genre: 'Synthwave'
            }
        });
        tracks.push(t);
    }

    // 3. Generate Sessions & Payouts (Last 30 Days)
    const listeners = [
        'npub1listenerA', 'npub1listenerB', 'npub1listenerC', 'npub1listenerD', 'npub1listenerE',
        'npub1listenerF', 'npub1listenerG', 'npub1listenerH', 'npub1listenerI', 'npub1listenerJ'
    ];

    // Ensure mock listeners exist in DB
    console.log('Ensuring mock listeners exist...');
    for (const pubkey of listeners) {
        await prisma.user.upsert({
            where: { pubkey },
            update: {},
            create: {
                pubkey,
                name: `Listener ${pubkey.slice(-1)}`,
                isArtist: false
            }
        });
    }

    const today = new Date();
    let totalSats = 0;
    let totalPlays = 0;

    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Random number of plays per day (5-20)
        const dailyPlays = Math.floor(Math.random() * 15) + 5;

        for (let j = 0; j < dailyPlays; j++) {
            const track = tracks[Math.floor(Math.random() * tracks.length)];
            const listener = listeners[Math.floor(Math.random() * listeners.length)];

            // Create Session
            const session = await prisma.session.create({
                data: {
                    trackId: track.id,
                    listenerPubkey: listener,
                    startTime: date,
                    creditedSeconds: 60, // 1 minute
                }
            });

            // Create Payout (Mock 10-50 sats)
            const amount = Math.floor(Math.random() * 40) + 10;
            await prisma.payout.create({
                data: {
                    sessionId: session.id,
                    amountSats: amount,
                    status: 'COMPLETED',
                    createdAt: date
                }
            });

            totalSats += amount;
            totalPlays++;
        }
    }

    console.log(`Seeding complete! Added ${totalPlays} plays and ${totalSats} sats over the last 30 days.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
