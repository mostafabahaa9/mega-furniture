const path = require("path");
const multer = require("multer");

let storage;
let storageNoSvg;

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
      folder: "mega-furniture",
      allowed_formats: ["jpg", "jpeg", "png", "webp", "avif", "svg"],
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    },
  });
  storageNoSvg = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "mega-furniture",
      allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    },
  });
} else {
  const diskDest = (req, file, cb) => cb(null, path.join(__dirname, "../uploads"));
  const diskFilename = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + "-" + Math.random().toString(36).slice(2) + ext);
  };
  storage = multer.diskStorage({
    destination: diskDest,
    filename: diskFilename,
  });
  storageNoSvg = storage; // diskStorage itself doesn't check formats, fileFilter does
}

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
];
const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg"];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (!allowedTypes.includes(file.mimetype) || !allowedExts.includes(ext)) {
    return cb(
      new Error("Invalid file type. Only image files (JPEG, PNG, WebP, AVIF, SVG) are allowed."),
      false,
    );
  }
  cb(null, true);
};

const allowedTypesNoSvg = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];
const allowedExtsNoSvg = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

const fileFilterNoSvg = (req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (!allowedTypesNoSvg.includes(file.mimetype) || !allowedExtsNoSvg.includes(ext)) {
    return cb(
      new Error("Invalid file type. Only image files (JPEG, PNG, WebP, AVIF) are allowed."),
      false,
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter,
});

const uploadNoSvg = multer({
  storage: storageNoSvg,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: fileFilterNoSvg,
});

module.exports = upload;
module.exports.uploadNoSvg = uploadNoSvg;
