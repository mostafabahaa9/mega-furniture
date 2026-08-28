const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const { read, write } = require("../utils/db");
const { adminAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

function cleanProduct(p) {
  const { costPrice, ...rest } = p;
  return {
    ...rest,
    colors: Array.isArray(p.colors) ? p.colors : [],
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    variants: Array.isArray(p.variants) ? p.variants : null,
    sideChoiceEnabled: p.sideChoiceEnabled === true || p.sideChoiceEnabled === "true" || p.detailSide === "left" || p.detailSide === "right",
    sideChoiceType: p.sideChoiceType || (p.sideChoiceEnabled ? "orientation" : "none"),
    sideOptions: Array.isArray(p.sideOptions) ? p.sideOptions : (p.sideChoiceEnabled ? ["left", "right"] : []),
  };
}

function enrich(bundle) {
  const products = read("products") || [];

  const allItems = (bundle.productIds || [])
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean)
    .map(cleanProduct);

  return {
    ...bundle,
    items: allItems,
    image: bundle.mainPhoto || allItems[0]?.mainPhoto || null,
  };
}

/* Public: active bundles (enriched with product data) */
router.get("/bundles", (req, res) => {
  const all = read("bundles") || [];
  const enriched = all
    .filter((b) => b.active !== false)
    .map(enrich)
    .sort((a, b) => (a.order || 999) - (b.order || 999));
  res.json(enriched);
});

/* Admin: all bundles */
router.get("/admin/bundles", adminAuth, (req, res) => {
  res.json(
    (read("bundles") || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    ),
  );
});

/* Admin: upload bundle photo */
router.post("/admin/bundles/upload/photo", adminAuth, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  
  console.log("File object:", req.file);
  
  // For Cloudinary: use secure_url (full HTTPS URL) or path
  // For local disk storage: use just filename
  let photoPath;
  if (req.file.secure_url) {
    photoPath = req.file.secure_url;
  } else if (req.file.path && req.file.path.startsWith("http")) {
    photoPath = req.file.path;
  } else {
    // Local storage - just use filename
    photoPath = req.file.filename;
  }
  
  res.json({ filename: photoPath });
});

/* Admin: create */
router.post("/admin/bundles", adminAuth, (req, res) => {
  const {
    nameAr,
    nameEn,
    productIds,
    discountPct,
    originalTotal,
    bundlePrice,
    active,
    mainPhoto,
    tier,
    badgeAr,
    badgeEn,
    badgeIcon,
    roomCount,
    rooms,
    galleryImages,
    featured,
    order,
  } = req.body;
  if (!nameAr && !nameEn)
    return res.status(400).json({ error: "Bundle name is required" });

  const hasRooms = Array.isArray(rooms) && rooms.length > 0;
  const hasFlat = Array.isArray(productIds) && productIds.length >= 2;
  if (!hasRooms && !hasFlat)
    return res.status(400).json({ error: "At least 2 products required (via rooms or productIds)" });

  const bundles = read("bundles") || [];
  const bundle = {
    id: uuidv4(),
    nameAr: (nameAr || "").trim(),
    nameEn: (nameEn || "").trim(),
    productIds: productIds || [],
    discountPct: Number(discountPct) || 0,
    originalTotal: Number(originalTotal) || 0,
    bundlePrice: Number(bundlePrice) || 0,
    mainPhoto: mainPhoto || null,
            active: active !== false,
    tier: tier || "starter",
    badgeAr: (badgeAr || "").trim(),
    badgeEn: (badgeEn || "").trim(),
    badgeIcon: badgeIcon || "gift",
    roomCount: Number(roomCount) || 0,
    rooms: Array.isArray(rooms) ? rooms : [],
    galleryImages: Array.isArray(galleryImages) ? galleryImages : [],
    featured: featured !== false,
    order: Number(order) || 0,
    createdAt: new Date().toISOString(),
  };
  bundles.push(bundle);
  write("bundles", bundles);
  res.status(201).json(bundle);
});

/* Admin: update */
router.put("/admin/bundles/:id", adminAuth, (req, res) => {
  const bundles = read("bundles") || [];
  const idx = bundles.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const {
    nameAr,
    nameEn,
    productIds,
    discountPct,
    originalTotal,
    bundlePrice,
    active,
    mainPhoto,
    tier,
    badgeAr,
    badgeEn,
    badgeIcon,
    roomCount,
    rooms,
    galleryImages,
    featured,
    order,
  } = req.body;
  
  if (nameAr !== undefined) bundles[idx].nameAr = nameAr.trim();
  if (nameEn !== undefined) bundles[idx].nameEn = nameEn.trim();
  if (productIds !== undefined) bundles[idx].productIds = productIds;
  if (discountPct !== undefined) bundles[idx].discountPct = Number(discountPct) || 0;
  if (originalTotal !== undefined) bundles[idx].originalTotal = Number(originalTotal) || 0;
  if (bundlePrice !== undefined) bundles[idx].bundlePrice = Number(bundlePrice) || 0;
  if (mainPhoto !== undefined) bundles[idx].mainPhoto = mainPhoto;
  if (active !== undefined) bundles[idx].active = !!active;
  
  // New fields
  if (tier !== undefined) bundles[idx].tier = tier;
  if (badgeAr !== undefined) bundles[idx].badgeAr = (badgeAr || "").trim();
  if (badgeEn !== undefined) bundles[idx].badgeEn = (badgeEn || "").trim();
  if (badgeIcon !== undefined) bundles[idx].badgeIcon = badgeIcon;
  if (roomCount !== undefined) bundles[idx].roomCount = Number(roomCount) || 0;
  if (rooms !== undefined) bundles[idx].rooms = Array.isArray(rooms) ? rooms : [];
    if (req.body.materialsImages !== undefined) bundles[idx].materialsImages = Array.isArray(req.body.materialsImages) ? req.body.materialsImages : [];
  if (galleryImages !== undefined) bundles[idx].galleryImages = Array.isArray(galleryImages) ? galleryImages : [];
  if (featured !== undefined) bundles[idx].featured = !!featured;
  if (order !== undefined) bundles[idx].order = Number(order) || 0;
  
  bundles[idx].updatedAt = new Date().toISOString();

  write("bundles", bundles);
  res.json(bundles[idx]);
});

/* Admin: delete */
router.delete("/admin/bundles/:id", adminAuth, (req, res) => {
  const bundles = read("bundles") || [];
  if (!bundles.find((b) => b.id === req.params.id))
    return res.status(404).json({ error: "Not found" });
  write(
    "bundles",
    bundles.filter((b) => b.id !== req.params.id),
  );
  res.json({ success: true });
});

module.exports = router;
