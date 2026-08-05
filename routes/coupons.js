const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const { read, write } = require("../utils/db");
const { adminAuth } = require("../middleware/auth");

function findByCode(code) {
  const c = (code || "").trim().toUpperCase();
  return read("coupons").find((x) => x.active && x.code.toUpperCase() === c);
}

function calcDiscountAmount(coupon, total) {
  const { type, value } = coupon;
  const base = Number(total) || 0;
  if (type === "percent") return Math.round(base * (value / 100) * 100) / 100;
  return Math.min(Number(value) || 0, base);
}

function categoryValues(category) {
  return [category && category.slug, category && category.id].filter(Boolean);
}

function categoryCouponMatches(couponCategoryId, cartCategoryValues) {
  const categories = read("categories") || [];
  const selected = categories.find(
    (c) => c.id === couponCategoryId || c.slug === couponCategoryId,
  );
  if (!selected) return cartCategoryValues.includes(couponCategoryId);
  const allowed = new Set(categoryValues(selected));
  categories
    .filter((c) => c.parentId === selected.id)
    .forEach((child) =>
      categoryValues(child).forEach((value) => allowed.add(value)),
    );
  return cartCategoryValues.some((value) => allowed.has(value));
}

/** Public: validate coupon for checkout */
router.post("/coupon/validate", (req, res) => {
  const { code, total, productIds, categoryIds, phone } = req.body;
  const coupon = findByCode(code);
  if (!coupon)
    return res.json({ valid: false, error: "Invalid or inactive code" });

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return res.json({ valid: false, error: "Coupon expired" });
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return res.json({ valid: false, error: "Coupon usage limit reached" });
  }

  const t = Number(total) || 0;

  // Check minOrderAmount
  if (coupon.minOrderAmount != null) {
    if (t < Number(coupon.minOrderAmount)) {
      const needed = Math.ceil(coupon.minOrderAmount - t);
      return res.json({
        valid: false,
        error: `Minimum order EGP ${Number(coupon.minOrderAmount).toLocaleString()} required`,
        minOrderAmount: coupon.minOrderAmount,
        needed,
      });
    }
  }

  // Check productId
  if (coupon.productId) {
    const ids = Array.isArray(productIds) ? productIds : [];
    if (!ids.includes(coupon.productId)) {
      return res.json({
        valid: false,
        error: "Coupon not valid for these items",
      });
    }
  }

  // Check categoryId
  if (coupon.categoryId) {
    const cats = Array.isArray(categoryIds) ? [].concat(...categoryIds) : [];
    if (!categoryCouponMatches(coupon.categoryId, cats)) {
      return res.json({
        valid: false,
        error: "Coupon not valid for items in your cart",
      });
    }
  }

  // Check maxUsesPerCustomer
  if (coupon.maxUsesPerCustomer != null && phone) {
    const usedBy = Array.isArray(coupon.usedBy) ? coupon.usedBy : [];
    const timesUsed = usedBy.filter((p) => p === String(phone)).length;
    if (timesUsed >= coupon.maxUsesPerCustomer) {
      return res.json({ valid: false, error: "Already used" });
    }
  }

  const discountAmount = t > 0 ? calcDiscountAmount(coupon, t) : 0;
  const finalTotal = Math.max(0, t - discountAmount);

  res.json({
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    scope: coupon.scope || "order",
    categoryId: coupon.categoryId || null,
    productId: coupon.productId || null,
    minOrderAmount: coupon.minOrderAmount || null,
    discountAmount,
    finalTotal,
  });
});

router.get("/admin/coupons", adminAuth, (req, res) => {
  res.json(read("coupons"));
});

function buildCoupon(b, existing = {}) {
  return {
    ...existing,
    code: String(b.code || existing.code || "")
      .trim()
      .toUpperCase(),
    type: (b.type || existing.type) === "fixed" ? "fixed" : "percent",
    value: b.value != null ? Number(b.value) : Number(existing.value) || 0,
    active: b.active !== undefined ? !!b.active : existing.active !== false,
    productId:
      "productId" in b ? b.productId || null : existing.productId || null,
    categoryId:
      "categoryId" in b ? b.categoryId || null : existing.categoryId || null,
    expiresAt:
      "expiresAt" in b ? b.expiresAt || null : existing.expiresAt || null,
    maxUses:
      "maxUses" in b
        ? b.maxUses != null
          ? Number(b.maxUses)
          : null
        : (existing.maxUses ?? null),
    minOrderAmount:
      "minOrderAmount" in b
        ? b.minOrderAmount != null
          ? Number(b.minOrderAmount)
          : null
        : (existing.minOrderAmount ?? null),
    maxUsesPerCustomer:
      "maxUsesPerCustomer" in b
        ? b.maxUsesPerCustomer != null
          ? Number(b.maxUsesPerCustomer)
          : null
        : (existing.maxUsesPerCustomer ?? null),
    scope: b.scope || existing.scope || "order",
    autoDiscount:
      "autoDiscount" in b ? !!b.autoDiscount : existing.autoDiscount || false,
    usedBy: existing.usedBy || [],
    usedCount: existing.usedCount || 0,
  };
}

router.post("/admin/coupons", adminAuth, (req, res) => {
  const coupons = read("coupons");
  const { code, type, value } = req.body;
  if (!code || !type || value == null)
    return res.status(400).json({ error: "code, type, value required" });
  const c = buildCoupon(req.body, { id: uuidv4() });
  if (coupons.some((x) => x.code.toUpperCase() === c.code)) {
    return res.status(400).json({ error: "Code already exists" });
  }
  coupons.push(c);
  write("coupons", coupons);
  res.status(201).json(c);
});

router.put("/admin/coupons/:id", adminAuth, (req, res) => {
  const coupons = read("coupons");
  const idx = coupons.findIndex((x) => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  coupons[idx] = buildCoupon(req.body, coupons[idx]);
  write("coupons", coupons);
  res.json(coupons[idx]);
});

router.delete("/admin/coupons/:id", adminAuth, (req, res) => {
  write(
    "coupons",
    read("coupons").filter((x) => x.id !== req.params.id),
  );
  res.json({ success: true });
});

/** Increment usedCount + record phone after successful order */
function incrementCouponUse(code, phone) {
  if (!code) return;
  const coupons = read("coupons");
  const idx = coupons.findIndex(
    (x) => x.code.toUpperCase() === String(code).trim().toUpperCase(),
  );
  if (idx === -1) return;
  coupons[idx].usedCount = (coupons[idx].usedCount || 0) + 1;
  if (phone) {
    if (!Array.isArray(coupons[idx].usedBy)) coupons[idx].usedBy = [];
    coupons[idx].usedBy.push(String(phone));
  }
  write("coupons", coupons);
}

router.incrementCouponUse = incrementCouponUse;
router.findCouponByCode = findByCode;
module.exports = router;
