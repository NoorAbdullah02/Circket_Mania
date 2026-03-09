import { Request, Response } from 'express';
import { uploadImage } from '../services/cloudinary.js';

export async function uploadFile(req: Request, res: Response): Promise<void> {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const folder = (req.query.folder as string) || 'general';

        // Upload exclusively to Cloudinary
        const url = await uploadImage(req.file.buffer, folder);

        if (!url || url.includes('ui-avatars.com')) {
            throw new Error('Failed to upload to Cloudinary');
        }

        res.json({ url, message: 'File uploaded to Cloudinary successfully' });
    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message || 'Upload failed' });
    }
}
