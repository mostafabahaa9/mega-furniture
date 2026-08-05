const path = require("path");
const multer = require("multer");

let storage;

if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  const { CloudinaryStorage } = require("multer-storage-cloudinary");
  const { cloudinary } = require("../utils/cloudinary");
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "mega-furniture-videos",
      resource_type: "video",
      allowed_formats: ["mp4", "webm", "mov", "avi", "mkv", "quicktime"],
    },
  });
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) =>
      cb(null, path.join(__dirname, "../uploads")),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, "video-" + Date.now() + "-" + Math.random().toString(36).slice(2) + ext);
    },
  });
}

const allowedVideoTypes = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
];
const allowedVideoExts = [".mp4", ".webm", ".mov", ".avi", ".mkv"];

const videoFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (!allowedVideoTypes.includes(file.mimetype) && !allowedVideoExts.includes(ext)) {
    return cb(
      new Error("Invalid file type. Only video files (MP4, WebM, MOV, AVI, MKV) are allowed."),
      false,
    );
  }
  cb(null, true);
};

module.exports = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for video files
  fileFilter: videoFileFilter,
});
