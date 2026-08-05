const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { read, write } = require("../utils/db");
const { adminAuth } = require("../middleware/auth");
const { sendMail } = require("../utils/mail");
const couponsRouter = require("./coupons");

const DEFAULT_TIERS = [
  { id: "new", label: "جديد 🆕", color: "#8A8680" },
  { id: "regular", label: "منتظم ⭐", color: "#1e90ff" },
  { id: "vip", label: "VIP 👑", color: "#F5A623" },
  { id: "gold", label: "Gold 🥇", color: "#f0c040" },
];

function buildCustomerMessageEmail({
  customerName,
  message,
  couponCode,
  coupon,
  couponProduct,
}) {
  const name = customerName || "Valued Customer";

  let couponHtml = "";
  if (coupon) {
    const discountText =
      coupon.type === "percent"
        ? `Discount: <strong style="color:#F5A623">${coupon.value}% OFF</strong>`
        : `Discount: <strong style="color:#F5A623">EGP ${Number(coupon.value).toLocaleString()} OFF</strong>`;

    const productRow = couponProduct
      ? `<tr>
          <td style="padding:10px 16px;font-size:12px;color:#6A6055;border-top:1px solid #ece8e0">Applies To</td>
          <td style="padding:10px 16px;font-size:13px;font-weight:700;color:#111;text-align:right;border-top:1px solid #ece8e0">
            ${couponProduct.sku ? `<span style="background:#f2ede5;color:#8A6540;font-size:11px;font-family:monospace;padding:2px 6px;border-radius:4px;margin-right:6px">${couponProduct.sku}</span>` : ""}
            ${couponProduct.nameEn || couponProduct.nameAr || "—"}
          </td>
        </tr>`
      : `<tr>
          <td style="padding:10px 16px;font-size:12px;color:#6A6055;border-top:1px solid #ece8e0">Applies To</td>
          <td style="padding:10px 16px;font-size:13px;color:#555;text-align:right;border-top:1px solid #ece8e0">All Products</td>
        </tr>`;

    const expiryRow = coupon.expiresAt
      ? `<tr>
          <td style="padding:10px 16px;font-size:12px;color:#6A6055;border-top:1px solid #ece8e0">Valid Until</td>
          <td style="padding:10px 16px;font-size:13px;font-weight:700;color:#c0392b;text-align:right;border-top:1px solid #ece8e0">
            ${new Date(coupon.expiresAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
          </td>
        </tr>`
      : `<tr>
          <td style="padding:10px 16px;font-size:12px;color:#6A6055;border-top:1px solid #ece8e0">Expiry</td>
          <td style="padding:10px 16px;font-size:13px;color:#555;text-align:right;border-top:1px solid #ece8e0">No Expiration</td>
        </tr>`;

    couponHtml = `
      <div style="background:#f8f7f4;border:2px dashed #F5A623;border-radius:14px;padding:24px;text-align:center;margin:24px 0">
        <div style="font-size:11px;color:#8A8680;letter-spacing:.12em;margin-bottom:10px;text-transform:uppercase">YOUR PROMO CODE</div>
        <div style="font-size:32px;font-weight:900;color:#F5A623;font-family:monospace;letter-spacing:.1em;margin-bottom:10px">${couponCode}</div>
        <div style="font-size:14px;color:#444;margin-bottom:16px">${discountText}</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;text-align:left">
          ${productRow}
          ${expiryRow}
        </table>
      </div>`;
  }
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f3f0;font-family:'Segoe UI',Arial,sans-serif;direction:ltr">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f0;padding:40px 20px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%">
        <tr><td style="background:#0C0C0E;border-radius:16px 16px 0 0;padding:28px 36px;text-align:center">
          <div style="font-size:22px;font-weight:900;color:#fff">MEGA <span style="color:#F5A623">FURNITURE</span></div>
          <div style="color:#8A8680;font-size:12px;margin-top:4px">Premium Furniture for Egyptian Homes</div>
        </td></tr>
        <tr><td style="background:#fff;padding:36px">
          <p style="margin:0 0 20px;font-size:17px;color:#333;line-height:1.8">Hello <strong style="color:#111">${name}</strong>,</p>
          ${message ? `<div style="font-size:15px;color:#444;line-height:1.9;white-space:pre-line;margin-bottom:20px">${message}</div>` : ""}
          ${couponHtml}
          <p style="margin:20px 0 0;font-size:13px;color:#8A8680;text-align:center">Thank you for choosing Mega Furniture</p>
        </td></tr>
        <tr><td style="background:#0C0C0E;border-radius:0 0 16px 16px;padding:18px 36px;text-align:center">
          <div style="color:#8A8680;font-size:11px">Mega Furniture · Delivering Across Egypt</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const SECRET = () =>
  process.env.ADMIN_SECRET_TOKEN ||
  process.env.JWT_SECRET ||
  (() => { throw new Error("JWT secret not configured"); })();

function getAdmin() {
  if (process.env.ADMIN_DEFAULT_USERNAME && process.env.ADMIN_DEFAULT_PASSWORD) {
    return {
      username: process.env.ADMIN_DEFAULT_USERNAME,
      passwordHash: bcrypt.hashSync(process.env.ADMIN_DEFAULT_PASSWORD, 10),
      createdAt: new Date().toISOString(),
    };
  }
  let admin = read("admin");
  if (!admin) {
    console.error("[admin] No admin record found in database.");
    return null;
  }
  return admin;
}

router.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  const admin = getAdmin();
  if (!admin) {
    return res.status(503).json({ error: "Admin account not configured. Set ADMIN_DEFAULT_USERNAME and ADMIN_DEFAULT_PASSWORD in environment variables." });
  }
  if (
    username !== admin.username ||
    !bcrypt.compareSync(password, admin.passwordHash)
  ) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ role: "admin" }, SECRET(), { expiresIn: "24h" });
  res.json({ token });
});

router.post("/admin/change-password", adminAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6)
    return res
      .status(400)
      .json({ error: "New password must be at least 6 characters" });
  const admin = getAdmin();
  if (!bcrypt.compareSync(currentPassword, admin.passwordHash)) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }
  admin.passwordHash = bcrypt.hashSync(newPassword, 10);
  write("admin", admin);
  res.json({ success: true });
});

router.post("/admin/change-credentials", adminAuth, (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;
  const admin = getAdmin();
  if (!bcrypt.compareSync(currentPassword, admin.passwordHash)) {
    return res.status(401).json({ error: "كلمة المرور الحالية غلط" });
  }
  if (!newUsername && !newPassword) {
    return res
      .status(400)
      .json({ error: "ادخل يوزر جديد أو باسورد جديد على الأقل" });
  }
  if (newUsername) admin.username = newUsername.trim();
  if (newPassword) {
    if (newPassword.length < 6)
      return res
        .status(400)
        .json({ error: "الباسورد لازم يكون 6 حروف على الأقل" });
    admin.passwordHash = bcrypt.hashSync(newPassword, 10);
  }
  write("admin", admin);
  res.json({ success: true, username: admin.username });
});

router.get("/admin/settings/notify-emails", adminAuth, (req, res) => {
  const settings = read("settings") || {};
  const emails =
    settings.notifyEmails && settings.notifyEmails.length
      ? settings.notifyEmails
      : process.env.ADMIN_NOTIFY_EMAIL
        ? [process.env.ADMIN_NOTIFY_EMAIL]
        : [];
  res.json({ emails });
});

router.put("/admin/settings/notify-emails", adminAuth, (req, res) => {
  const emails = (req.body.emails || [])
    .map((e) => e.trim())
    .filter((e) => e.includes("@"));
  const settings = read("settings") || {};
  settings.notifyEmails = emails;
  write("settings", settings);
  res.json({ success: true, emails });
});

router.get("/admin/stats", adminAuth, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const orders = read("orders");
  const visits = read("visits");
  const products = read("products");
  const reviews = read("reviews");

  let totalProfit = 0;
  orders.forEach((o) => {
    if (o.status === "cancelled" || o.status === "returned") return;
    (o.items || []).forEach((it) => {
      const qty = Number(it.quantity) || 1;
      const price = Number(it.price) || 0;
      const cost = Number(it.costAtOrder != null ? it.costAtOrder : 0) || 0;
      totalProfit += (price - cost) * qty;
    });
    totalProfit -= Number(o.discountAmount) || 0;
  });
  totalProfit = Math.round(totalProfit * 100) / 100;

  const lowStock = products.filter((p) => {
    const q = p.variants && p.variants.length
      ? p.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
      : 999;
    return q <= 5;
  }).length;

  res.json({
    totalProducts: products.length,
    totalOrders: orders.length,
    todayOrders: orders.filter((o) => o.createdAt.startsWith(today)).length,
    pendingOrders: orders.filter((o) => o.status === "received").length,
    totalVisits: visits.length,
    pendingVisits: visits.filter((v) => v.status === "pending").length,
    pendingReviews: reviews.filter((r) => !r.approved).length,
    totalRevenue: orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + (o.total || 0), 0),
    totalProfit,
    lowStockCount: lowStock,
  });
});

/** Aggregated customers from orders (phone = key) */
router.get("/admin/customers", adminAuth, (req, res) => {
  const orders = read("orders");
  const meta = read("customerMeta") || {};
  const settings = read("settings") || {};
  const tiers =
    settings.tiers && settings.tiers.length ? settings.tiers : DEFAULT_TIERS;

  const byPhone = {};
  orders.forEach((o) => {
    const ph = (o.phone || "").trim();
    if (!ph) return;
    if (!byPhone[ph]) {
      byPhone[ph] = {
        phone: ph,
        customerName: o.customerName,
        email: o.email || null,
        address: o.address,
        city: o.city,
        orderCount: 0,
        totalSpent: 0,
        lastOrderAt: o.createdAt,
        orders: [],
      };
    }
    byPhone[ph].orderCount += 1;
    byPhone[ph].totalSpent += Number(o.total) || 0;
    if (!byPhone[ph].email && o.email) byPhone[ph].email = o.email;
    if (new Date(o.createdAt) > new Date(byPhone[ph].lastOrderAt)) {
      byPhone[ph].lastOrderAt = o.createdAt;
      byPhone[ph].customerName = o.customerName;
      byPhone[ph].address = o.address;
      byPhone[ph].city = o.city;
      if (o.email) byPhone[ph].email = o.email;
    }
    byPhone[ph].orders.push({
      id: o.id,
      trackingCode: o.trackingCode,
      total: o.total,
      status: o.status,
      createdAt: o.createdAt,
    });
  });

  const list = Object.values(byPhone).map((c) => {
    const m = meta[c.phone] || {};
    let autoTier = "new";
    if (c.orderCount >= 5) autoTier = "vip";
    else if (c.orderCount >= 2) autoTier = "regular";
    const tier = m.tier || autoTier;
    return { ...c, tier, autoTier, tieredAt: m.updatedAt || null };
  });
  list.sort((a, b) => b.totalSpent - a.totalSpent);
  res.json({ customers: list, tiers });
});

/** Send email to customer */
router.post("/admin/customers/message", adminAuth, async (req, res) => {
  const { email, phone, subject, message, couponCode, customerName } = req.body;
  const to = (email || "").trim();
  if (!to || !subject)
    return res.status(400).json({ error: "email and subject required" });
  const coupon = couponCode ? couponsRouter.findCouponByCode(couponCode) : null;
  const couponProduct =
    coupon && coupon.productId
      ? read("products").find((p) => p.id === coupon.productId) || null
      : null;
  const html = buildCustomerMessageEmail({
    customerName,
    message,
    couponCode,
    coupon,
    couponProduct,
  });
  try {
    const result = await sendMail({
      to,
      subject,
      html,
      text: message || subject,
    });
    if (result && result.skipped)
      return res.status(503).json({
        error: "SMTP غير مضبوط على السيرفر — تحقق من إعدادات الإيميل",
      });
    res.json({ success: true, messageId: result && result.messageId });
  } catch (e) {
    res.status(500).json({ error: e.message || "Send failed" });
  }
});

/** Manually set customer tier */
router.patch("/admin/customers/:phone/tier", adminAuth, (req, res) => {
  const { tier } = req.body;
  if (!tier) return res.status(400).json({ error: "tier required" });
  const meta = read("customerMeta") || {};
  meta[req.params.phone] = {
    ...(meta[req.params.phone] || {}),
    tier,
    updatedAt: new Date().toISOString(),
  };
  write("customerMeta", meta);
  res.json({ success: true });
});

/** Get tier configuration */
router.get("/admin/settings/tiers", adminAuth, (req, res) => {
  const settings = read("settings") || {};
  res.json(
    settings.tiers && settings.tiers.length ? settings.tiers : DEFAULT_TIERS,
  );
});

/** Save tier configuration */
router.put("/admin/settings/tiers", adminAuth, (req, res) => {
  const tiers = req.body.tiers;
  if (!Array.isArray(tiers) || !tiers.length)
    return res.status(400).json({ error: "tiers array required" });
  const settings = read("settings") || {};
  settings.tiers = tiers.filter((t) => t.id && t.label);
  write("settings", settings);
  res.json({ success: true, tiers: settings.tiers });
});

module.exports = router;
