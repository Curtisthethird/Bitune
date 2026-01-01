import fs from 'fs';
import path from 'path';

export async function uploadLocal({ trackId, buffer, filename }: { trackId: string; buffer: Buffer; filename: string }) {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    // Ensure dir exists
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Safe filename
    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const objectKeyShort = `${Date.now()}-${safeName}`;
    const filePath = path.join(uploadDir, objectKeyShort);

    await fs.promises.writeFile(filePath, buffer);

    return {
        audioUrl: `/uploads/${objectKeyShort}`,
        objectKey: objectKeyShort
    };
}
