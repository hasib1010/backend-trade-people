// src/config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Helper function to upload file from buffer or path
const uploadToCloudinary = async (file, folder) => {
  try {
    // If file is a path (string)
    if (typeof file === 'string') {
      const result = await cloudinary.uploader.upload(file, {
        folder: folder,
        resource_type: 'auto'
      });
      return result;
    } 
    // If file is a buffer or has a buffer property
    else if (file?.buffer || Buffer.isBuffer(file)) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: folder, resource_type: 'auto' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        
        // Create readable stream from buffer
        const bufferStream = new Readable();
        bufferStream.push(file.buffer || file);
        bufferStream.push(null);
        bufferStream.pipe(uploadStream);
      });
    } else {
      throw new Error('Invalid file format for upload');
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary
};