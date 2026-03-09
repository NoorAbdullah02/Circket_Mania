import { Request, Response } from 'express';
import { uploadImage } from '../services/cloudinary.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function uploadFile(req: Request, res: Response): Promise<void> {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const folder = (req.query.folder as string) || 'general';
        const filename = `${Date.now()}-${req.file.originalname}`;
        const uploadDir = path.join(__dirname, '..', '..', 'uploads', folder);

        // Ensure folder exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, req.file.buffer);

        // Try Cloudinary but don't fail if it doesn't work
        let url = `${req.protocol}://${req.get('host')}/uploads/${folder}/${filename}`;

        try {
            const cloudinaryUrl = await uploadImage(req.file.buffer, folder);
            if (cloudinaryUrl && !cloudinaryUrl.includes('ui-avatars.com')) {
                url = cloudinaryUrl;
            }
        } catch (clError) {
            console.error('Cloudinary upload attempted and failed, using local:', clError);
        }

        res.json({ url, message: 'File uploaded successfully' });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
}
