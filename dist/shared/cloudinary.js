"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImages = exports.deleteImage = exports.uploadImages = exports.uploadImage = void 0;
const cloudinary_1 = require("cloudinary");
// Configure Cloudinary
console.log('🔧 Configuring Cloudinary...');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? '***' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'NOT SET');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '***' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'NOT SET');
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log('✅ Cloudinary configured successfully');
/**
 * Upload single image to Cloudinary
 */
const uploadImage = async (file, folder = 'items', mimetype) => {
    try {
        console.log('📤 Uploading image to Cloudinary...');
        console.log('File type:', typeof file);
        console.log('File size:', typeof file === 'string' ? file.length : file.length);
        console.log('Mimetype:', mimetype);
        console.log('Folder:', folder);
        // Check if Cloudinary is configured
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            throw new Error('Cloudinary credentials not configured');
        }
        let uploadOptions = {
            folder: folder,
            // Very basic options to avoid transformation errors
        };
        console.log('Upload options:', JSON.stringify(uploadOptions, null, 2));
        let result;
        if (typeof file === 'string') {
            // If file is a base64 string or URL
            console.log('Uploading as string/base64...');
            result = await cloudinary_1.v2.uploader.upload(file, uploadOptions);
        }
        else {
            // If file is a buffer
            console.log('Converting buffer to base64...');
            const base64 = `data:${mimetype || 'image/jpeg'};base64,${file.toString('base64')}`;
            console.log('Base64 data sample:', base64.substring(0, 50) + '...');
            console.log('Base64 data length:', base64.length);
            result = await cloudinary_1.v2.uploader.upload(base64, uploadOptions);
        }
        console.log('✅ Image uploaded successfully:', result.secure_url);
        return {
            public_id: result.public_id,
            secure_url: result.secure_url,
            url: result.url,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
        };
    }
    catch (error) {
        console.error('❌ Cloudinary upload failed:', error);
        console.error('Error details:', error.message);
        console.error('Error code:', error.http_code);
        console.error('Error name:', error.name);
        throw new Error(`Failed to upload image: ${error.message}`);
    }
};
exports.uploadImage = uploadImage;
/**
 * Upload multiple images to Cloudinary
 */
const uploadImages = async (files, folder = 'items') => {
    try {
        console.log(`📤 Uploading ${files.length} images to Cloudinary...`);
        const uploadPromises = files.map(file => {
            if (typeof file === 'string') {
                return (0, exports.uploadImage)(file, folder);
            }
            else {
                return (0, exports.uploadImage)(file.buffer, folder, file.mimetype);
            }
        });
        const results = await Promise.all(uploadPromises);
        console.log(`✅ ${results.length} images uploaded successfully`);
        return results;
    }
    catch (error) {
        console.error('❌ Multiple image upload failed:', error);
        throw new Error('Failed to upload images');
    }
};
exports.uploadImages = uploadImages;
/**
 * Delete image from Cloudinary
 */
const deleteImage = async (publicId) => {
    try {
        console.log('🗑️ Deleting image from Cloudinary:', publicId);
        await cloudinary_1.v2.uploader.destroy(publicId);
        console.log('✅ Image deleted successfully');
    }
    catch (error) {
        console.error('❌ Cloudinary delete failed:', error);
        throw new Error('Failed to delete image');
    }
};
exports.deleteImage = deleteImage;
/**
 * Delete multiple images from Cloudinary
 */
const deleteImages = async (publicIds) => {
    try {
        console.log(`🗑️ Deleting ${publicIds.length} images from Cloudinary...`);
        const deletePromises = publicIds.map(publicId => (0, exports.deleteImage)(publicId));
        await Promise.all(deletePromises);
        console.log(`✅ ${publicIds.length} images deleted successfully`);
    }
    catch (error) {
        console.error('❌ Multiple image delete failed:', error);
        throw new Error('Failed to delete images');
    }
};
exports.deleteImages = deleteImages;
exports.default = cloudinary_1.v2;
