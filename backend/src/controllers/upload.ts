import { Request, Response } from 'express';
import { uploadImage } from '../services/cloudinary.js';

export async function uploadFile(req: Request, res: Response): Promise<void> {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        // Check file size (max 10MB)
        const maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
        if (req.file.size > maxFileSize) {
            res.status(413).json({ error: 'File size exceeds 10MB limit. Please upload an image up to 10 MB.' });
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
