import { uploadLocal } from './local';
import { uploadS3 } from './s3';

export async function uploadAudioFile(params: { trackId: string; buffer: Buffer; contentType: string; filename: string }) {
    const mode = process.env.STORAGE_MODE || 'local';

    if (mode === 's3') {
        return await uploadS3(params);
    } else {
        return await uploadLocal(params);
    }
}
