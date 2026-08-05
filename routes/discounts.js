const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const { read, write } = require("../utils/db");
const { adminAuth } = require("../middleware/auth");

function activeNow(d) {
  return d.active && (!d.expiresAt || new Date(d.expiresAt) >= new Date());
}

router.get("/discounts", (req, res) => {
  res.json((read("discounts") || []).filter(activeNow));
});

router.get("/admin/discounts", adminAuth, (req, res) => {
  res.json(read("discounts") || []);
});

router.post("/admin/discounts", adminAuth, (req, res) => {
  const list = read("discounts") || [];
  const {
    categoryId,
    categoryName,
    productId,
    productName,
    discountScope,
    type,
    value,
    label_ar,
    label_en,
    active,
    expiresAt,
  } = req.body;

  const scope = discountScope || "category";

  if (scope === "product") {
    if (!productId) {
      return res.status(400).json({ error: "productId is required for product discount" });
    }
  } else {
    if (!categoryId) {
      return res.status(400).json({ error: "categoryId is required for category discount" });
    }
  }

  if (!type || value == null) {
    return res.status(400).json({ error: "type and value are required" });
  }

  const d = {
    id: uuidv4(),
    discountScope: scope,
    categoryId: scope === "category" ? categoryId : "",
    categoryName: scope === "category" ? (categoryName || "") : "",
    productId: scope === "product" ? productId : "",
    productName: scope === "product" ? (productName || "") : "",
    type: type === "fixed" ? "fixed" : "percent",
    value: Number(value),
    label_ar: label_ar || "",
    label_en: label_en || "",
    active: active !== false,
    expiresAt: expiresAt || null,
    createdAt: new Date().toISOString(),
  };

  list.push(d);
  write("discounts", list);
  res.status(201).json(d);
});

router.put("/admin/discounts/:id", adminAuth, (req, res) => {
  const list = read("discounts") || [];
  const idx = list.findIndex((x) => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const b = req.body;

  if ("discountScope" in b) list[idx].discountScope = b.discountScope;
  if ("categoryId" in b) list[idx].categoryId = b.categoryId || "";
  if ("categoryName" in b) list[idx].categoryName = b.categoryName || "";
  if ("productId" in b) list[idx].productId = b.productId || "";
  if ("productName" in b) list[idx].productName = b.productName || "";
  if ("type" in b) list[idx].type = b.type === "fixed" ? "fixed" : "percent";
  if ("value" in b) list[idx].value = Number(b.value);
  if ("label_ar" in b) list[idx].label_ar = b.label_ar || "";
  if ("label_en" in b) list[idx].label_en = b.label_en || "";
  if ("active" in b) list[idx].active = !!b.active;
  if ("expiresAt" in b) list[idx].expiresAt = b.expiresAt || null;

  write("discounts", list);
  res.json(list[idx]);
});

router.delete("/admin/discounts/:id", adminAuth, (req, res) => {
  write(
    "discounts",
    (read("discounts") || []).filter((x) => x.id !== req.params.id)
  );
  res.json({ success: true });
});

module.exports = router;
