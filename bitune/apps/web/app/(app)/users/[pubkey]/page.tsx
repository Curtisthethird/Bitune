import { Metadata, ResolvingMetadata } from 'next';
import UserProfileClient from './UserProfileClient';
import { prisma } from '@/lib/prisma';

type Props = {
    params: Promise<{ pubkey: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { pubkey } = await params;

    const user = await prisma.user.findUnique({
        where: { pubkey },
    });

    if (!user) {
        return {
            title: "User Not Found",
        };
    }

    const title = `${user.name || 'Anonymous User'} (@${pubkey.substring(0, 8)}...)`;
    const description = user.about || `View ${user.name || 'this user'}'s profile on BitTune. Discover and support independent artists.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: user.picture ? [user.picture] : [],
        },
        twitter: {
            card: 'summary',
            title,
            description,
            images: user.picture ? [user.picture] : [],
        },
    };
}

export default function Page({ params }: Props) {
    return <UserProfileClient params={params} />;
}
