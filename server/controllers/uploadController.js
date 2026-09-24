// controllers/uploadController.js
import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js"; // ← was ../utils/cloudinary.js
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";

const CLOUDINARY_FOLDER = "returns";

const uploadBufferToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: CLOUDINARY_FOLDER, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

export const uploadReturnImages = handleAsyncError(async (req, res, next) => {
  console.log('Upload return images called')
  console.log('Files received:', req.files?.length || 0)
  
  if (!req.files || req.files.length === 0) {
    console.log('No files provided')
    return next(new HandleError("At least one image file is required", 400));
  }

  try {
    console.log('Starting cloudinary uploads...')
    const uploads = await Promise.all(
      req.files.map((file, index) => {
        console.log(`Uploading file ${index}: ${file.originalname}, size: ${file.size}`)
        return uploadBufferToCloudinary(file.buffer)
      })
    );

    const images = uploads.map((result) => ({
      url: result.secure_url,
      public_id: result.public_id,
    }));

    console.log('All uploads successful:', images.length, 'images')
    return res.status(200).json({ success: true, images });
  } catch (err) {
    console.error("Cloudinary upload failed:", err?.message || err);
    return next(new HandleError("Image upload failed. Please try again.", 500));
  }
});