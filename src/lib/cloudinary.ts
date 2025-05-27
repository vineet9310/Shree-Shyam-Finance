// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Use HTTPS
});

export async function uploadImageToCloudinary(fileUri: string, folder: string) {
  try {
    const result = await cloudinary.uploader.upload(fileUri, {
      folder: `shree-shyam-finance/${folder}`, // Organize uploads in a specific folder
      resource_type: 'auto', // Automatically detect file type (image, video, raw)
    });
    return result; // Contains secure_url, public_id, etc.
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload document to Cloudinary');
  }
}