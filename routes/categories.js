const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const { read, write } = require("../utils/db");
const { adminAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

const BUILT_IN_ICONS = new Set([
  "sofa",
  "bed",
  "dining",
  "tv-unit",
  "kids",
  "office",
  "mattress",
  "wardrobe",
  "chair",
  "corner-sofa",
  "custom-collection",
  "default",
]);

function fileUrl(f) {
  if (!f) return null;
  if (f.path && f.path.startsWith("http")) return f.path;
  return f.filename || f.path;
}

function normalizeCategory(c) {
  return {
    ...c,
    parentId: c.parentId || null,
    iconType: c.iconType === "upload" ? "upload" : "library",
    iconKey: c.iconKey || null,
    iconUrl: c.iconUrl || null,
    shippingDurationAr: c.shippingDurationAr || "",
    shippingDurationEn: c.shippingDurationEn || "",
    defaultDescAr: c.defaultDescAr || "",
    defaultDescEn: c.defaultDescEn || "",
    defaultSpecStructureAr: c.defaultSpecStructureAr || "",
    defaultSpecStructureEn: c.defaultSpecStructureEn || "",
    defaultSpecFabricAr: c.defaultSpecFabricAr || "",
    defaultSpecFabricEn: c.defaultSpecFabricEn || "",
    defaultSpecFillingAr: c.defaultSpecFillingAr || "",
    defaultSpecFillingEn: c.defaultSpecFillingEn || "",
    defaultSpecDimensionsNoteAr: c.defaultSpecDimensionsNoteAr || "",
    defaultSpecDimensionsNoteEn: c.defaultSpecDimensionsNoteEn || "",
    defaultProductCareAr: c.defaultProductCareAr || "",
    defaultProductCareEn: c.defaultProductCareEn || "",
    defaultFeatureBanner: c.defaultFeatureBanner || null,
    showInDreamRoom: c.showInDreamRoom !== false,
    order: c.order !== undefined ? Number(c.order) : 0,
  };
}

function normalizeParentId(parentId, categories, currentId = null) {
  if (!parentId) return null;
  const parent = categories
    .map(normalizeCategory)
    .find((c) => c.id === parentId || c.slug === parentId);
  if (!parent) return null;
  if (parent.id === currentId || parent.parentId) return null;
  return parent.id;
}

function normalizeIcon({ iconType, iconKey, iconUrl }, existing = {}) {
  const type = iconType === "upload" ? "upload" : "library";
  const key =
    type === "library" && iconKey && BUILT_IN_ICONS.has(iconKey)
      ? iconKey
      : type === "library"
        ? existing.iconKey || "default"
        : null;
  const url = type === "upload" ? iconUrl || existing.iconUrl || null : null;
  return { iconType: type, iconKey: key, iconUrl: url };
}

router.get("/categories", (req, res) => {
  res.json(read("categories").map(normalizeCategory).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0)));
});

router.get("/categories/:parentId/subcategories", (req, res) => {
  res.json(read("categories").map(normalizeCategory).filter((c) => c.parentId === req.params.parentId).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0)));
});

router.post("/admin/categories", adminAuth, (req, res) => {
  const categories = read("categories");
  const {
    nameAr,
    nameEn,
    slug,
    image,
    warrantyYears,
    parentId,
    iconType,
    iconKey,
    iconUrl,
    shippingDurationAr,
    shippingDurationEn,
    defaultDescAr,
    defaultDescEn,
    defaultSpecStructureAr,
    defaultSpecStructureEn,
    defaultSpecFabricAr,
    defaultSpecFabricEn,
    defaultSpecFillingAr,
    defaultSpecFillingEn,
    defaultSpecDimensionsNoteAr,
    defaultSpecDimensionsNoteEn,
    defaultProductCareAr,
    defaultProductCareEn,
    defaultFeatureBanner,
    showInDreamRoom, order } = req.body;
  if (!nameAr || !nameEn || !slug)
    return res
      .status(400)
      .json({ error: "nameAr, nameEn and slug are required" });
  if (categories.find((c) => c.slug === slug))
    return res.status(400).json({ error: "Slug already exists" });

  const category = normalizeCategory({
    id: uuidv4(),
    nameAr,
    nameEn,
    slug,
    image: image || "",
    warrantyYears: warrantyYears !== undefined && warrantyYears !== "" && warrantyYears !== null ? Number(warrantyYears) : null,
    parentId: normalizeParentId(parentId, categories),
    ...normalizeIcon({ iconType, iconKey, iconUrl }),
    shippingDurationAr: shippingDurationAr || "",
    shippingDurationEn: shippingDurationEn || "",
    defaultDescAr: defaultDescAr || "",
    defaultDescEn: defaultDescEn || "",
    defaultSpecStructureAr: defaultSpecStructureAr || "",
    defaultSpecStructureEn: defaultSpecStructureEn || "",
    defaultSpecFabricAr: defaultSpecFabricAr || "",
    defaultSpecFabricEn: defaultSpecFabricEn || "",
    defaultSpecFillingAr: defaultSpecFillingAr || "",
    defaultSpecFillingEn: defaultSpecFillingEn || "",
    defaultSpecDimensionsNoteAr: defaultSpecDimensionsNoteAr || "",
    defaultSpecDimensionsNoteEn: defaultSpecDimensionsNoteEn || "",
    defaultProductCareAr: defaultProductCareAr || "",
    defaultProductCareEn: defaultProductCareEn || "",
    defaultFeatureBanner: defaultFeatureBanner || null,
    showInDreamRoom: showInDreamRoom !== undefined ? showInDreamRoom : true,
    order: order !== undefined ? Number(order) : 0,
    createdAt: new Date().toISOString(),
  });
  categories.push(category);
  write("categories", categories);
  res.status(201).json(category);
});

router.put("/admin/categories/:id", adminAuth, (req, res) => {
  const categories = read("categories");
  const idx = categories.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const {
    nameAr,
    nameEn,
    slug,
    image,
    warrantyYears,
    parentId,
    iconType,
    iconKey,
    iconUrl,
    shippingDurationAr,
    shippingDurationEn,
    defaultDescAr,
    defaultDescEn,
    defaultSpecStructureAr,
    defaultSpecStructureEn,
    defaultSpecFabricAr,
    defaultSpecFabricEn,
    defaultSpecFillingAr,
    defaultSpecFillingEn,
    defaultSpecDimensionsNoteAr,
    defaultSpecDimensionsNoteEn,
    defaultProductCareAr,
    defaultProductCareEn,
    defaultFeatureBanner,
    showInDreamRoom, order } = req.body;
  if (
    slug &&
    categories.some((c) => c.id !== req.params.id && c.slug === slug)
  ) {
    return res.status(400).json({ error: "Slug already exists" });
  }
  const icon = normalizeIcon(
    { iconType, iconKey, iconUrl },
    normalizeCategory(categories[idx]),
  );
  categories[idx] = normalizeCategory({
    ...normalizeCategory(categories[idx]),
    nameAr: nameAr || categories[idx].nameAr,
    nameEn: nameEn || categories[idx].nameEn,
    slug: slug || categories[idx].slug,
    image: image !== undefined ? image : categories[idx].image,
    warrantyYears: warrantyYears !== undefined ? (warrantyYears === "" || warrantyYears === null ? null : Number(warrantyYears)) : categories[idx].warrantyYears,
    parentId:
      parentId !== undefined
        ? normalizeParentId(parentId, categories, categories[idx].id)
        : normalizeCategory(categories[idx]).parentId,
    shippingDurationAr: shippingDurationAr !== undefined ? shippingDurationAr : categories[idx].shippingDurationAr,
    shippingDurationEn: shippingDurationEn !== undefined ? shippingDurationEn : categories[idx].shippingDurationEn,
    defaultDescAr: defaultDescAr !== undefined ? defaultDescAr : categories[idx].defaultDescAr,
    defaultDescEn: defaultDescEn !== undefined ? defaultDescEn : categories[idx].defaultDescEn,
    defaultSpecStructureAr: defaultSpecStructureAr !== undefined ? defaultSpecStructureAr : categories[idx].defaultSpecStructureAr,
    defaultSpecStructureEn: defaultSpecStructureEn !== undefined ? defaultSpecStructureEn : categories[idx].defaultSpecStructureEn,
    defaultSpecFabricAr: defaultSpecFabricAr !== undefined ? defaultSpecFabricAr : categories[idx].defaultSpecFabricAr,
    defaultSpecFabricEn: defaultSpecFabricEn !== undefined ? defaultSpecFabricEn : categories[idx].defaultSpecFabricEn,
    defaultSpecFillingAr: defaultSpecFillingAr !== undefined ? defaultSpecFillingAr : categories[idx].defaultSpecFillingAr,
    defaultSpecFillingEn: defaultSpecFillingEn !== undefined ? defaultSpecFillingEn : categories[idx].defaultSpecFillingEn,
    defaultSpecDimensionsNoteAr: defaultSpecDimensionsNoteAr !== undefined ? defaultSpecDimensionsNoteAr : categories[idx].defaultSpecDimensionsNoteAr,
    defaultSpecDimensionsNoteEn: defaultSpecDimensionsNoteEn !== undefined ? defaultSpecDimensionsNoteEn : categories[idx].defaultSpecDimensionsNoteEn,
    defaultProductCareAr: defaultProductCareAr !== undefined ? defaultProductCareAr : categories[idx].defaultProductCareAr,
    defaultProductCareEn: defaultProductCareEn !== undefined ? defaultProductCareEn : categories[idx].defaultProductCareEn,
    defaultFeatureBanner: defaultFeatureBanner !== undefined ? defaultFeatureBanner : categories[idx].defaultFeatureBanner,
    showInDreamRoom: showInDreamRoom !== undefined ? showInDreamRoom : categories[idx].showInDreamRoom,
    order: order !== undefined ? Number(order) : (categories[idx].order || 0),
    ...icon,
  });
  write("categories", categories);
  res.json(categories[idx]);
});

router.post(
  "/admin/categories/upload-icon",
  adminAuth,
  upload.single("icon"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const ok = /(\.svg|\.png|\.jpe?g|\.webp|\.avif)$/i.test(req.file.originalname || req.file.filename || "");
    if (!ok) return res.status(400).json({ error: "Only SVG, PNG, JPG, WEBP and AVIF icons are allowed" });
    res.json({ url: fileUrl(req.file) });
  },
);

router.delete("/admin/categories/:id", adminAuth, (req, res) => {
  let categories = read("categories");
  if (!categories.find((c) => c.id === req.params.id))
    return res.status(404).json({ error: "Not found" });
  categories = categories.map((c) =>
    c.parentId === req.params.id ? { ...c, parentId: null } : c,
  );
  write(
    "categories",
    categories.filter((c) => c.id !== req.params.id),
  );
  res.json({ success: true });
});

module.exports = router;
