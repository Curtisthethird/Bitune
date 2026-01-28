import { Metadata, ResolvingMetadata } from 'next';
import ReleaseClient from './ReleaseClient';
import { prisma } from '@/lib/prisma';

type Props = {
    params: Promise<{ trackId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { trackId } = await params;

    const track = await prisma.track.findUnique({
        where: { id: trackId },
        include: {
            artist: {
                select: { name: true }
            }
        }
    });

    if (!track) {
        return {
            title: "Release Not Found",
        };
    }

    const title = `${track.title} by ${track.artist?.name || 'Unknown Artist'}`;
    const description = track.description || `Listen to ${track.title} on BitTune. Support the artist directly with Bitcoin.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: track.coverUrl ? [track.coverUrl] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: track.coverUrl ? [track.coverUrl] : [],
        },
    };
}

export default function Page({ params }: Props) {
    return <ReleaseClient params={params} />;
}
