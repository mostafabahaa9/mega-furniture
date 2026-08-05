const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function destroyByUrl(url) {
  if (!url || !url.includes("cloudinary.com")) return;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  if (match) await cloudinary.uploader.destroy(match[1]);
}

module.exports = { cloudinary, destroyByUrl };
