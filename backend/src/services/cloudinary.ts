import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

export async function uploadImage(fileBuffer: Buffer, folder: string = 'cricket-mania'): Promise<string> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
                transformation: [{ width: 500, height: 500, crop: 'limit', quality: 'auto' }],
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    resolve(`https://ui-avatars.com/api/?name=Player&background=random&color=fff`);
                } else {
                    resolve(result!.secure_url);
                }
            }
        );

        const readable = new Readable();
        readable.push(fileBuffer);
        readable.push(null);
        readable.pipe(uploadStream);
    });
}

export async function uploadBase64Image(base64Data: string, folder: string = 'cricket-mania'): Promise<string> {
    try {
        const result = await cloudinary.uploader.upload(base64Data, {
            folder,
            resource_type: 'image',
            transformation: [{ width: 500, height: 500, crop: 'limit', quality: 'auto' }],
        });
        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary base64 upload error:', error);
        return '';
    }
}

export async function deleteImage(publicId: string): Promise<void> {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Cloudinary delete error:', error);
    }
}

export { cloudinary };
