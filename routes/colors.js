const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const { read, write } = require("../utils/db");
const { adminAuth } = require("../middleware/auth");

// Public list all
router.get("/colors", (req, res) => {
  const all = read("colors") || [];
  res.json(all);
});

// Admin list all
router.get("/admin/colors", adminAuth, (req, res) => {
  const all = read("colors") || [];
  res.json(all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// Admin create
router.post("/admin/colors", adminAuth, (req, res) => {
  const {
    nameAr,
    nameEn,
    colorHex,
    colorHex2,
    fabricCode,
    fabricStatsAr,
    fabricStatsEn,
    image,
    icon,
    showInCustomWork,
    paletteNameAr,
    paletteNameEn,
  } = req.body;

  if (!nameAr && !nameEn) {
    return res.status(400).json({ error: "Fabric/Color name is required" });
  }

  const colors = read("colors") || [];
  const colorItem = {
    id: uuidv4(),
    nameAr: (nameAr || "").trim(),
    nameEn: (nameEn || "").trim(),
    colorHex: (colorHex || "#cccccc").trim(),
    colorHex2: colorHex2 ? colorHex2.trim() : null,
    fabricCode: (fabricCode || "").trim(),
    fabricStatsAr: (fabricStatsAr || "").trim(),
    fabricStatsEn: (fabricStatsEn || "").trim(),
    image: image || null,
    icon: icon || null,
    showInCustomWork: showInCustomWork === true || showInCustomWork === "true",
    paletteNameAr: (paletteNameAr || "").trim(),
    paletteNameEn: (paletteNameEn || "").trim(),
    createdAt: new Date().toISOString(),
  };

  colors.push(colorItem);
  write("colors", colors);
  res.status(201).json(colorItem);
});

// Admin update
router.put("/admin/colors/:id", adminAuth, (req, res) => {
  const { id } = req.params;
  const {
    nameAr,
    nameEn,
    colorHex,
    colorHex2,
    fabricCode,
    fabricStatsAr,
    fabricStatsEn,
    image,
    icon,
    showInCustomWork,
    paletteNameAr,
    paletteNameEn,
  } = req.body;

  const colors = read("colors") || [];
  const idx = colors.findIndex((c) => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Fabric/Color not found" });
  }

  colors[idx] = {
    ...colors[idx],
    nameAr: nameAr !== undefined ? (nameAr || "").trim() : colors[idx].nameAr,
    nameEn: nameEn !== undefined ? (nameEn || "").trim() : colors[idx].nameEn,
    colorHex: colorHex !== undefined ? (colorHex || "#cccccc").trim() : colors[idx].colorHex,
    colorHex2: colorHex2 !== undefined ? (colorHex2 ? colorHex2.trim() : null) : colors[idx].colorHex2,
    fabricCode: fabricCode !== undefined ? (fabricCode || "").trim() : colors[idx].fabricCode,
    fabricStatsAr: fabricStatsAr !== undefined ? (fabricStatsAr || "").trim() : colors[idx].fabricStatsAr,
    fabricStatsEn: fabricStatsEn !== undefined ? (fabricStatsEn || "").trim() : colors[idx].fabricStatsEn,
    image: image !== undefined ? image : colors[idx].image,
    icon: icon !== undefined ? icon : colors[idx].icon,
    showInCustomWork: showInCustomWork !== undefined ? (showInCustomWork === true || showInCustomWork === "true") : colors[idx].showInCustomWork,
    paletteNameAr: paletteNameAr !== undefined ? (paletteNameAr || "").trim() : colors[idx].paletteNameAr,
    paletteNameEn: paletteNameEn !== undefined ? (paletteNameEn || "").trim() : colors[idx].paletteNameEn,
    updatedAt: new Date().toISOString(),
  };

  write("colors", colors);
  res.json(colors[idx]);
});

// Admin delete
router.delete("/admin/colors/:id", adminAuth, (req, res) => {
  const { id } = req.params;
  let colors = read("colors") || [];
  const exists = colors.some((c) => c.id === id);
  if (!exists) {
    return res.status(404).json({ error: "Fabric/Color not found" });
  }

  colors = colors.filter((c) => c.id !== id);
  write("colors", colors);
  res.json({ success: true });
});

module.exports = router;
