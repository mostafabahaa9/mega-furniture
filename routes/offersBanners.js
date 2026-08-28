const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const { read, write } = require("../utils/db");
const { adminAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

function mapOffersBanner(b) {
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
router.get("/offers-banners", (req, res) => {
  const all = read("offersBanners") || [];
  const active = all
    .map(mapOffersBanner)
    .filter((b) => b.active === true);
  active.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  res.json(active);
});

/* Admin: all promo banners */
router.get("/admin/offers-banners", adminAuth, (req, res) => {
  const all = read("offersBanners") || [];
  const mapped = all.map(mapOffersBanner);
  mapped.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  res.json(mapped);
});

/* Admin: upload promo banner photo */
router.post("/admin/offers-banners/upload/photo", adminAuth, upload.single("file"), (req, res) => {
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
router.post("/admin/offers-banners", adminAuth, (req, res) => {
  const { image, titleAr, titleEn, link, sortOrder, active } = req.body;
  if (!image) {
    return res.status(400).json({ error: "Image is required" });
  }

  const offersBanners = read("offersBanners") || [];
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

  offersBanners.push(banner);
  write("offersBanners", offersBanners);
  res.status(201).json(banner);
});

/* Admin: update promo banner */
router.put("/admin/offers-banners/:id", adminAuth, (req, res) => {
  const offersBanners = read("offersBanners") || [];
  const idx = offersBanners.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const { image, titleAr, titleEn, link, sortOrder, active } = req.body;
  if (image !== undefined) offersBanners[idx].image = image.trim();
  if (titleAr !== undefined) offersBanners[idx].titleAr = titleAr.trim();
  if (titleEn !== undefined) offersBanners[idx].titleEn = titleEn.trim();
  if (link !== undefined) offersBanners[idx].link = link.trim();
  if (sortOrder !== undefined) offersBanners[idx].sortOrder = Number(sortOrder) || 0;
  if (active !== undefined) offersBanners[idx].active = !!active;
  offersBanners[idx].updatedAt = new Date().toISOString();

  write("offersBanners", offersBanners);
  res.json(mapOffersBanner(offersBanners[idx]));
});

/* Admin: delete promo banner */
router.delete("/admin/offers-banners/:id", adminAuth, (req, res) => {
  const offersBanners = read("offersBanners") || [];
  if (!offersBanners.find((b) => b.id === req.params.id))
    return res.status(404).json({ error: "Not found" });

  write(
    "offersBanners",
    offersBanners.filter((b) => b.id !== req.params.id)
  );
  res.json({ success: true });
});

module.exports = router;
