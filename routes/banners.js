const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const { read, write } = require("../utils/db");
const { adminAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

function mapBanner(b) {
  return {
    id: b.id,
    image: b.image || b.photoUrl || "",
    link: b.link || (b.linkType === "product" ? `pages/product.html?id=${b.linkId}` : b.linkType === "bundle" ? `pages/shop.html#bundles` : ""),
    order: b.order !== undefined ? Number(b.order) : 0,
    active: b.active !== false,
    createdAt: b.createdAt
  };
}

/* Public: active banners */
router.get("/banners", (req, res) => {
  const all = read("banners") || [];
  const active = all
    .map(mapBanner)
    .filter((b) => b.active === true);
  active.sort((a, b) => (a.order || 0) - (b.order || 0));
  res.json(active);
});

/* Admin: all banners */
router.get("/admin/banners", adminAuth, (req, res) => {
  const all = read("banners") || [];
  const mapped = all.map(mapBanner);
  mapped.sort((a, b) => (a.order || 0) - (b.order || 0));
  res.json(mapped);
});

/* Admin: upload banner photo */
router.post("/admin/banners/upload/photo", adminAuth, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  let photoPath;
  if (req.file.secure_url) {
    photoPath = req.file.secure_url;
  } else if (req.file.path && req.file.path.startsWith("http")) {
    photoPath = req.file.path;
  } else {
    photoPath = req.file.filename;
  }

  res.json({ filename: photoPath });
});

/* Admin: create banner */
router.post("/admin/banners", adminAuth, (req, res) => {
  const { image, link, order, active } = req.body;
  const imgVal = image || req.body.photoUrl; // backward compatibility fallback
  if (!imgVal) {
    return res.status(400).json({ error: "Image is required" });
  }

  const banners = read("banners") || [];
  const banner = {
    id: uuidv4(),
    image: imgVal.trim(),
    link: (link || "").trim(),
    order: order !== undefined ? Number(order) : 0,
    active: active !== false,
    createdAt: new Date().toISOString(),
  };

  banners.push(banner);
  write("banners", banners);
  res.status(201).json(banner);
});

/* Admin: update banner */
router.put("/admin/banners/:id", adminAuth, (req, res) => {
  const banners = read("banners") || [];
  const idx = banners.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const { image, photoUrl, link, order, active } = req.body;
  const imgVal = image !== undefined ? image : photoUrl;
  if (imgVal !== undefined) {
    banners[idx].image = imgVal.trim();
    if (banners[idx].photoUrl !== undefined) delete banners[idx].photoUrl;
  }
  if (link !== undefined) {
    banners[idx].link = link.trim();
    if (banners[idx].linkType !== undefined) delete banners[idx].linkType;
    if (banners[idx].linkId !== undefined) delete banners[idx].linkId;
  }
  if (order !== undefined) banners[idx].order = Number(order) || 0;
  if (active !== undefined) banners[idx].active = !!active;
  banners[idx].updatedAt = new Date().toISOString();

  write("banners", banners);
  res.json(mapBanner(banners[idx]));
});

/* Admin: delete banner */
router.delete("/admin/banners/:id", adminAuth, (req, res) => {
  const banners = read("banners") || [];
  if (!banners.find((b) => b.id === req.params.id))
    return res.status(404).json({ error: "Not found" });

  write(
    "banners",
    banners.filter((b) => b.id !== req.params.id)
  );
  res.json({ success: true });
});

module.exports = router;
