import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');
    await prisma.user.upsert({
        where: { pubkey: 'npub1artist' },
        update: {},
        create: {
            pubkey: 'npub1artist',
            name: 'Neon Artist',
            isArtist: true,
            about: 'Electronic music producer from the future.'
        }
    });
    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
