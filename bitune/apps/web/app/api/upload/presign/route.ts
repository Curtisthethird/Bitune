import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { verifyNip98Event } from '@/lib/nostr/nip98';
import { uploadLimiter } from '@/lib/ratelimit';

export async function POST(request: Request) {
    try {
        // 1. Auth check
        const authHeader = request.headers.get('Authorization');
        const url = request.url;
        const artistPubkey = await verifyNip98Event(authHeader, 'POST', url);

        // 2. Rate limit check (optional)
        if (!uploadLimiter.check(artistPubkey)) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }

        const body = await request.json();
        const { filename, contentType, type } = body; // type is 'audio' or 'cover'

        if (!filename || !contentType) {
            return NextResponse.json({ error: 'Filename and content type required' }, { status: 400 });
        }

        const mode = process.env.STORAGE_MODE || 'local';

        if (mode !== 's3') {
            return NextResponse.json({ error: 'S3 not configured on server' }, { status: 501 });
        }

        const region = process.env.S3_REGION || 'auto';
        const endpoint = process.env.S3_ENDPOINT;
        const bucket = process.env.S3_BUCKET;
        const accessKeyId = process.env.S3_ACCESS_KEY_ID;
        const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
        const publicUrl = process.env.S3_PUBLIC_BASE_URL;

        if (!bucket || !accessKeyId || !secretAccessKey) {
            return NextResponse.json({ error: 'S3 improperly configured' }, { status: 500 });
        }

        const client = new S3Client({
            region,
            endpoint,
            credentials: { accessKeyId, secretAccessKey }
        });

        const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const tempId = crypto.randomUUID();
        const objectKey = `tracks/${tempId}-${type}/${Date.now()}-${safeName}`;

        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: objectKey,
            ContentType: contentType,
        });

        // URL expires in 15 minutes
        const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });

        const finalUrl = publicUrl
            ? `${publicUrl}/${objectKey}`
            : endpoint
                ? `${endpoint}/${bucket}/${objectKey}`
                : `https://${bucket}.s3.${region}.amazonaws.com/${objectKey}`;

        return NextResponse.json({ uploadUrl, finalUrl, objectKey });
    } catch (e: any) {
        console.error('Presign error:', e);
        return NextResponse.json({ error: e.message || 'Error generating upload URL' }, { status: 500 });
    }
}
