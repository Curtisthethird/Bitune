import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export async function uploadS3({ trackId, buffer, contentType, filename }: { trackId: string; buffer: Buffer; contentType: string; filename: string }) {
    const region = process.env.S3_REGION || 'auto';
    const endpoint = process.env.S3_ENDPOINT;
    const bucket = process.env.S3_BUCKET;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    const publicUrl = process.env.S3_PUBLIC_BASE_URL;

    if (!bucket || !accessKeyId || !secretAccessKey) {
        throw new Error('Missing S3 configuration');
    }

    const client = new S3Client({
        region,
        endpoint,
        credentials: {
            accessKeyId,
            secretAccessKey
        }
    });

    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const objectKey = `tracks/${trackId}/${Date.now()}-${safeName}`;

    await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: buffer,
        ContentType: contentType,
    }));

    // URL construction
    // If publicUrl provided, use it. Else fall back to standard S3? 
    // Usually R2 is publicUrl/key
    const finalUrl = publicUrl
        ? `${publicUrl}/${objectKey}`
        : endpoint
            ? `${endpoint}/${bucket}/${objectKey}`
            : `https://${bucket}.s3.${region}.amazonaws.com/${objectKey}`;

    return {
        audioUrl: finalUrl,
        objectKey
    };
}
