// middleware/multer.js
import multer from "multer";
import HandleError from "../utils/handleError.js";

const storage = multer.memoryStorage();

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new HandleError("Only JPG, PNG and WEBP images are allowed", 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5,
  },
});

export default upload;