const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const { read, write } = require("../utils/db");
const { adminAuth } = require("../middleware/auth");

/* Public: active collections */
router.get("/collections", (req, res) => {
  const all = read("collections") || [];
  const active = all
    .filter((c) => c.active !== false)
    .sort(
      (a, b) =>
        new Date(b.launchDate || b.createdAt) -
        new Date(a.launchDate || a.createdAt)
    );
  res.json(active);
});

/* Admin: all collections */
router.get("/admin/collections", adminAuth, (req, res) => {
  res.json(
    (read("collections") || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )
  );
});

/* Admin: add */
router.post("/admin/collections", adminAuth, (req, res) => {
  const {
    nameAr,
    nameEn,
    descAr,
    descEn,
    photoUrl,
    launchDate,
    active,
    showAnnouncement,
    productIds,
  } = req.body;
  if (!nameAr && !nameEn)
    return res.status(400).json({ error: "Name is required" });

  const collections = read("collections") || [];
  const col = {
    id: uuidv4(),
    nameAr: (nameAr || "").trim(),
    nameEn: (nameEn || "").trim(),
    descAr: (descAr || "").trim(),
    descEn: (descEn || "").trim(),
    photoUrl: (photoUrl || "").trim(),
    launchDate: launchDate || new Date().toISOString().split("T")[0],
    active: active !== false,
    showAnnouncement: showAnnouncement !== false,
    productIds: Array.isArray(productIds) ? productIds : [],
    createdAt: new Date().toISOString(),
  };
  collections.push(col);
  write("collections", collections);
  res.status(201).json(col);
});

/* Admin: update */
router.put("/admin/collections/:id", adminAuth, (req, res) => {
  const collections = read("collections") || [];
  const idx = collections.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const {
    nameAr,
    nameEn,
    descAr,
    descEn,
    photoUrl,
    launchDate,
    active,
    showAnnouncement,
    productIds,
  } = req.body;
  if (nameAr !== undefined) collections[idx].nameAr = nameAr.trim();
  if (nameEn !== undefined) collections[idx].nameEn = nameEn.trim();
  if (descAr !== undefined) collections[idx].descAr = descAr.trim();
  if (descEn !== undefined) collections[idx].descEn = descEn.trim();
  if (photoUrl !== undefined) collections[idx].photoUrl = photoUrl.trim();
  if (launchDate !== undefined) collections[idx].launchDate = launchDate;
  if (active !== undefined) collections[idx].active = !!active;
  if (showAnnouncement !== undefined)
    collections[idx].showAnnouncement = !!showAnnouncement;
  if (productIds !== undefined)
    collections[idx].productIds = Array.isArray(productIds) ? productIds : [];
  collections[idx].updatedAt = new Date().toISOString();

  write("collections", collections);
  res.json(collections[idx]);
});

/* Admin: delete */
router.delete("/admin/collections/:id", adminAuth, (req, res) => {
  const collections = read("collections") || [];
  if (!collections.find((c) => c.id === req.params.id))
    return res.status(404).json({ error: "Not found" });
  write(
    "collections",
    collections.filter((c) => c.id !== req.params.id)
  );
  res.json({ success: true });
});

module.exports = router;
