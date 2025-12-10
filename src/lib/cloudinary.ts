// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

// Check for required environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn('⚠️ Cloudinary credentials not configured. File uploads will fail.');
  console.warn('Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file');
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export async function uploadImageToCloudinary(fileUri: string, folder: string) {
  // Check credentials before attempting upload
  if (!cloudName || !apiKey || !apiSecret) {
    console.error('Cloudinary credentials missing. Cannot upload file.');
    throw new Error('Cloudinary is not configured. Please check your environment variables.');
  }

  try {
    const result = await cloudinary.uploader.upload(fileUri, {
      folder: `shree-shyam-finance/${folder}`,
      resource_type: 'auto',
    });
    return result;
  } catch (error: any) {
    console.error('Cloudinary upload error:', error.message || error);

    if (error.message?.includes('api_key')) {
      throw new Error('Invalid Cloudinary API key. Please check your credentials.');
    }
    if (error.message?.includes('api_secret')) {
      throw new Error('Invalid Cloudinary API secret. Please check your credentials.');
    }

    throw new Error('Failed to upload document to Cloudinary: ' + (error.message || 'Unknown error'));
  }
}