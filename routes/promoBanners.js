const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const { read, write } = require("../utils/db");
const { adminAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

function mapPromoBanner(b) {
  return {
    id: b.id,
    image: b.image || "",
    titleAr: b.titleAr || "",
    titleEn: b.titleEn || "",
    link: b.link || "",
    sortOrder: b.sortOrder !== undefined ? Number(b.sortOrder) : 0,
    active: b.active !== false,
    createdAt: b.createdAt,
  };
}

/* Public: active promo banners, sorted */
router.get("/promo-banners", (req, res) => {
  const all = read("promoBanners") || [];
  const active = all
    .map(mapPromoBanner)
    .filter((b) => b.active === true);
  active.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  res.json(active);
});

/* Admin: all promo banners */
router.get("/admin/promo-banners", adminAuth, (req, res) => {
  const all = read("promoBanners") || [];
  const mapped = all.map(mapPromoBanner);
  mapped.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  res.json(mapped);
});

/* Admin: upload promo banner photo */
router.post("/admin/promo-banners/upload/photo", adminAuth, upload.single("file"), (req, res) => {
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

/* Admin: create promo banner */
router.post("/admin/promo-banners", adminAuth, (req, res) => {
  const { image, titleAr, titleEn, link, sortOrder, active } = req.body;
  if (!image) {
    return res.status(400).json({ error: "Image is required" });
  }

  const promoBanners = read("promoBanners") || [];
  const banner = {
    id: uuidv4(),
    image: image.trim(),
    titleAr: (titleAr || "").trim(),
    titleEn: (titleEn || "").trim(),
    link: (link || "").trim(),
    sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
    active: active !== false,
    createdAt: new Date().toISOString(),
  };

  promoBanners.push(banner);
  write("promoBanners", promoBanners);
  res.status(201).json(banner);
});

/* Admin: update promo banner */
router.put("/admin/promo-banners/:id", adminAuth, (req, res) => {
  const promoBanners = read("promoBanners") || [];
  const idx = promoBanners.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const { image, titleAr, titleEn, link, sortOrder, active } = req.body;
  if (image !== undefined) promoBanners[idx].image = image.trim();
  if (titleAr !== undefined) promoBanners[idx].titleAr = titleAr.trim();
  if (titleEn !== undefined) promoBanners[idx].titleEn = titleEn.trim();
  if (link !== undefined) promoBanners[idx].link = link.trim();
  if (sortOrder !== undefined) promoBanners[idx].sortOrder = Number(sortOrder) || 0;
  if (active !== undefined) promoBanners[idx].active = !!active;
  promoBanners[idx].updatedAt = new Date().toISOString();

  write("promoBanners", promoBanners);
  res.json(mapPromoBanner(promoBanners[idx]));
});

/* Admin: delete promo banner */
router.delete("/admin/promo-banners/:id", adminAuth, (req, res) => {
  const promoBanners = read("promoBanners") || [];
  if (!promoBanners.find((b) => b.id === req.params.id))
    return res.status(404).json({ error: "Not found" });

  write(
    "promoBanners",
    promoBanners.filter((b) => b.id !== req.params.id)
  );
  res.json({ success: true });
});

module.exports = router;
