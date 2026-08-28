const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const { read, write } = require("../utils/db");
const { adminAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

function mapShopTheLook(s) {
  return {
    id: s.id,
    image: s.image || "",
    active: s.active !== false,
    sortOrder: s.sortOrder !== undefined ? Number(s.sortOrder) : 0,
    hotspots: Array.isArray(s.hotspots) ? s.hotspots : [],
    createdAt: s.createdAt,
  };
}

/* Public: active shop the look items, sorted */
router.get("/shop-the-look", (req, res) => {
  const all = read("shopTheLook") || [];
  const active = all
    .map(mapShopTheLook)
    .filter((s) => s.active === true);
  active.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  res.json(active);
});

/* Admin: all items */
router.get("/admin/shop-the-look", adminAuth, (req, res) => {
  const all = read("shopTheLook") || [];
  const mapped = all.map(mapShopTheLook);
  mapped.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  res.json(mapped);
});

/* Admin: upload photo */
router.post("/admin/shop-the-look/upload/photo", adminAuth, upload.single("file"), (req, res) => {
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

/* Admin: create item */
router.post("/admin/shop-the-look", adminAuth, (req, res) => {
  const { image, active, sortOrder, hotspots } = req.body;
  if (!image) {
    return res.status(400).json({ error: "Image is required" });
  }

  const items = read("shopTheLook") || [];
  const item = {
    id: uuidv4(),
    image: image.trim(),
    active: active !== false,
    sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
    hotspots: Array.isArray(hotspots) ? hotspots : [],
    createdAt: new Date().toISOString(),
  };

  items.push(item);
  write("shopTheLook", items);
  res.status(201).json(item);
});

/* Admin: update item */
router.put("/admin/shop-the-look/:id", adminAuth, (req, res) => {
  const items = read("shopTheLook") || [];
  const idx = items.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const { image, active, sortOrder, hotspots } = req.body;
  if (image !== undefined) items[idx].image = image.trim();
  if (active !== undefined) items[idx].active = !!active;
  if (sortOrder !== undefined) items[idx].sortOrder = Number(sortOrder) || 0;
  if (hotspots !== undefined) items[idx].hotspots = Array.isArray(hotspots) ? hotspots : [];
  
  items[idx].updatedAt = new Date().toISOString();

  write("shopTheLook", items);
  res.json(mapShopTheLook(items[idx]));
});

/* Admin: delete item */
router.delete("/admin/shop-the-look/:id", adminAuth, (req, res) => {
  const items = read("shopTheLook") || [];
  if (!items.find((s) => s.id === req.params.id))
    return res.status(404).json({ error: "Not found" });

  write(
    "shopTheLook",
    items.filter((s) => s.id !== req.params.id)
  );
  res.json({ success: true });
});

module.exports = router;
