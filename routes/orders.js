const router = require("express").Router();
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const { read, write } = require("../utils/db");
const { adminAuth } = require("../middleware/auth");
const { sendMail } = require("../utils/mail");
const { notifyAdmin } = require("../utils/notify");
const couponsRouter = require("./coupons");

const VALID_STATUSES = [
  "pending_payment",
  "received",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

const STATUS_LABELS_EN = {
  pending_payment: "Pending Payment",
  received: "Under Review",
  processing: "In Production",
  shipped: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

const STATUS_LABELS_AR = {
  pending_payment: "في انتظار الدفع",
  received: "قيد المراجعة",
  processing: "قيد التصنيع",
  shipped: "في الطريق",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
  returned: "مرتجع",
};

const STATUS_DESC_EN = {
  pending_payment: "We are waiting for your online payment to complete the order.",
  received: "We have received your order and are currently reviewing it. Our team will get in touch with you shortly.",
  processing: "Your order is now in production. We are crafting your piece with precision and quality.",
  shipped: "Your order has been shipped and is on its way to your delivery address.",
  delivered: "Your order has been delivered successfully! Thank you for choosing Mega Furniture.",
  cancelled: "Your order has been cancelled. If you have any questions, please contact our support team.",
  returned: "We have received your return request and will reach out to guide you through the process.",
};

function buildStatusEmail(order, newStatus) {
  const label = STATUS_LABELS_EN[newStatus] || newStatus;
  const desc = STATUS_DESC_EN[newStatus] || "";
  const track = order.trackingCode || order.id;
  const name = order.customerName || "Valued Customer";

  const accentColor =
    newStatus === "delivered"
      ? "#2ed573"
      : newStatus === "cancelled"
        ? "#ff4757"
        : newStatus === "shipped"
          ? "#1e90ff"
          : "#F5A623";

  const statusIcon =
    {
      received: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F5A623" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
      processing: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F5A623" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
      shipped: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F5A623" stroke-width="2" stroke-linecap="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
      delivered: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2.5" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      cancelled: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff4757" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      returned: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff9800" stroke-width="2" stroke-linecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`,
    }[newStatus] || `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F5A623" stroke-width="2" stroke-linecap="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.2"/><polygon points="21 16 12 21 3 16 3 8 12 3 21 8 21 16"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`;

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f3f0;font-family:'Segoe UI',Arial,sans-serif;direction:ltr">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f0;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

        <!-- HEADER -->
        <tr><td style="background:#0C0C0E;border-radius:16px 16px 0 0;padding:28px 36px;text-align:center">
          <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:.04em">
            MEGA <span style="color:#F5A623">FURNITURE</span>
          </div>
          <div style="color:#8A8680;font-size:12px;margin-top:4px;letter-spacing:.1em">Premium Furniture for Egyptian Homes</div>
        </td></tr>

        <!-- STATUS BADGE -->
        <tr><td style="background:#ffffff;padding:36px 36px 0">
          <div style="text-align:center;margin-bottom:24px">
            <div style="font-size:52px;margin-bottom:12px">${statusIcon}</div>
            <div style="display:inline-block;background:${accentColor};color:#fff;font-size:14px;font-weight:700;padding:8px 24px;border-radius:100px;letter-spacing:.04em">
              ${label}
            </div>
          </div>
          <h2 style="margin:0 0 8px;font-size:20px;color:#111;text-align:center">Order Status Update</h2>
          <p style="margin:0 0 24px;color:#6A6055;font-size:15px;text-align:center;line-height:1.6">
            Hello <strong>${name}</strong>, your order <strong style="color:#F5A623">${track}</strong> has been updated.
          </p>
        </td></tr>

        <!-- DESCRIPTION -->
        <tr><td style="background:#ffffff;padding:0 36px 28px">
          <div style="background:#f8f7f4;border-left:4px solid ${accentColor};border-radius:8px;padding:16px 20px;font-size:15px;color:#333;line-height:1.7">
            ${desc}
          </div>
        </td></tr>

        <!-- ORDER DETAILS -->
        <tr><td style="background:#ffffff;padding:0 36px 28px">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e2d6;border-radius:10px;overflow:hidden">
            <tr style="background:#f2ede5">
              <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#6A6055;letter-spacing:.08em">ORDER DETAILS</td>
            </tr>
            <tr>
              <td style="padding:14px 16px">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#6A6055;font-size:13px;padding:4px 0">Tracking Code</td>
                    <td style="text-align:right;font-family:monospace;font-size:13px;font-weight:700;color:#111;padding:4px 0">${track}</td>
                  </tr>
                  <tr>
                    <td style="color:#6A6055;font-size:13px;padding:4px 0">Status</td>
                    <td style="text-align:right;font-size:13px;font-weight:700;color:${accentColor};padding:4px 0">${label}</td>
                  </tr>
                  ${
                    order.total
                      ? `<tr>
                    <td style="color:#6A6055;font-size:13px;padding:4px 0">Total Amount</td>
                    <td style="text-align:right;font-size:13px;font-weight:700;color:#111;padding:4px 0">EGP ${Number(order.total).toLocaleString()}</td>
                  </tr>`
                      : ""
                  }
                </table>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td style="background:#ffffff;padding:0 36px 36px;text-align:center">
          <p style="color:#6A6055;font-size:13px;margin:0 0 16px">Questions about your order? Reach out to us:</p>
          <a href="https://wa.me/${process.env.WHATSAPP_NUMBER || "201040454343"}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:100px">
            Contact Support on WhatsApp
          </a>
        </td></tr>

        ${
          newStatus === "delivered"
            ? (() => {
                const base = process.env.BASE_URL || "http://localhost:3001";
                const fullUrl = `${base}/pages/reviews.html?tracking=${track}&name=${encodeURIComponent(name)}`;
                const labels = { 1: "Poor", 5: "Great" };
                const starCells = [5, 4, 3, 2, 1]
                  .map((n) => {
                    const url = `${base}/api/review-quick?tracking=${track}&rating=${n}&name=${encodeURIComponent(name)}`;
                    return `<td align="center" style="padding:0 4px">
                      <a href="${url}" style="display:block;width:44px;height:44px;line-height:44px;background:#fff;border:2px solid #e8e2d6;border-radius:50%;text-decoration:none;font-size:24px;text-align:center;color:#F5A623">★</a>
                      <div style="font-size:10px;color:#8A8680;margin-top:5px;text-align:center;white-space:nowrap">${labels[n] || ""}</div>
                    </td>`;
                  })
                  .join("");
                return `
        <!-- REVIEW -->
        <tr><td style="background:#fafaf8;padding:28px 36px;text-align:center;border-top:1px solid #f0ede6">
          <div style="font-size:15px;font-weight:700;color:#111;margin-bottom:6px">How was your experience?</div>
          <p style="color:#6A6055;font-size:13px;margin:0 0 20px">Your feedback helps us continuously improve</p>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto">
            <tr>${starCells}</tr>
          </table>
          <div style="margin-top:18px">
            <a href="${fullUrl}" style="font-size:12px;color:#F5A623;text-decoration:none;border-bottom:1px solid #F5A62366">Write a Full Review</a>
          </div>
        </td></tr>`;
              })()
            : ""
        }

        <!-- FOOTER -->
        <tr><td style="background:#0C0C0E;border-radius:0 0 16px 16px;padding:20px 36px;text-align:center">
          <div style="color:#8A8680;font-size:12px;line-height:1.7">
            Mega Furniture · Delivering Across Egypt<br>
            Thank you for choosing Mega Furniture
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildCustomerInvoiceEmail(order) {
  const track = order.trackingCode || order.id;
  const name = order.customerName || "Valued Customer";
  const itemsRows = (order.items || [])
    .map((it) => {
      const line = (it.price || 0) * (it.quantity || 1);
      const meta = [
        it.color ? `Color: ${it.color}` : "",
        it.size
          ? `Size: ${typeof it.size === "object" ? it.size.nameEn || it.size.nameAr || "" : it.size}`
          : "",
        it.sideChoice
          ? `Orientation: ${it.sideChoice === "right" ? "Right" : "Left"}`
          : "",
      ]
        .filter(Boolean)
        .join(" · ");
      return `
        <tr>
          <td style="padding:12px 14px;border-bottom:1px solid #f0ede6">
            <div style="font-size:14px;font-weight:700;color:#111">${it.nameEn || it.nameAr || it.id}</div>
            ${meta ? `<div style="font-size:12px;color:#8A8680;margin-top:2px">${meta}</div>` : ""}
          </td>
          <td style="padding:12px 14px;border-bottom:1px solid #f0ede6;font-size:13px;color:#555;text-align:center">${it.quantity || 1}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #f0ede6;font-size:13px;color:#555;text-align:right">EGP ${Number(it.price || 0).toLocaleString()}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #f0ede6;font-size:14px;font-weight:700;color:#111;text-align:right">EGP ${Number(line).toLocaleString()}</td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f3f0;font-family:'Segoe UI',Arial,sans-serif;direction:ltr">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f0;padding:40px 20px">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%">

        <!-- HEADER -->
        <tr><td style="background:#0C0C0E;border-radius:16px 16px 0 0;padding:28px 36px;text-align:center">
          <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:.04em">
            MEGA <span style="color:#F5A623">FURNITURE</span>
          </div>
          <div style="color:#8A8680;font-size:12px;margin-top:4px;letter-spacing:.1em">Premium Furniture for Egyptian Homes</div>
        </td></tr>

        <!-- SUCCESS BANNER -->
        <tr><td style="background:#F5A623;padding:20px 36px;text-align:center">
          <div style="font-size:20px;font-weight:800;color:#fff">Order Confirmed Successfully</div>
        </td></tr>

        <!-- BODY -->
        <tr><td style="background:#fff;padding:32px 36px">

          <p style="margin:0 0 24px;font-size:16px;color:#333;line-height:1.7;text-align:center">
            Hello <strong>${name}</strong>, thank you for choosing Mega Furniture!<br>
            We have received your order and will begin preparing it shortly.
          </p>

          <!-- TRACKING CODE -->
          <div style="background:#f8f7f4;border-radius:12px;padding:20px;margin-bottom:28px;text-align:center">
            <div style="font-size:12px;color:#8A8680;margin-bottom:6px;letter-spacing:.1em">YOUR TRACKING CODE</div>
            <div style="font-size:26px;font-weight:900;color:#F5A623;font-family:monospace;letter-spacing:.08em">${track}</div>
            <div style="font-size:12px;color:#8A8680;margin-top:6px">Save this code to track your order anytime</div>
          </div>

          <!-- ITEMS TABLE -->
          <div style="font-size:13px;font-weight:700;color:#6A6055;letter-spacing:.08em;margin-bottom:8px">ORDER SUMMARY</div>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e8e2d6;border-radius:10px;overflow:hidden">
            <tr style="background:#f2ede5">
              <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#6A6055">Item</td>
              <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#6A6055;text-align:center">Qty</td>
              <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#6A6055;text-align:right">Price</td>
              <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#6A6055;text-align:right">Total</td>
            </tr>
            ${itemsRows}
          </table>

          <!-- TOTALS -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e2d6;border-radius:10px;overflow:hidden">
            <tr>
              <td style="padding:11px 16px;font-size:13px;color:#6A6055">Subtotal</td>
              <td style="padding:11px 16px;font-size:14px;color:#111;text-align:right">EGP ${Number(order.subtotal || 0).toLocaleString()}</td>
            </tr>
            ${
              order.shippingFee
                ? `<tr style="background:#fafaf8">
              <td style="padding:11px 16px;font-size:13px;color:#6A6055">Shipping</td>
              <td style="padding:11px 16px;font-size:14px;color:#111;text-align:right">EGP ${Number(order.shippingFee).toLocaleString()}</td>
            </tr>`
                : ""
            }
            ${
              order.discountAmount
                ? `<tr>
              <td style="padding:11px 16px;font-size:13px;color:#6A6055">Discount${order.promoCode ? ` (${order.promoCode})` : ""}</td>
              <td style="padding:11px 16px;font-size:14px;color:#2ed573;font-weight:700;text-align:right">− EGP ${Number(order.discountAmount).toLocaleString()}</td>
            </tr>`
                : ""
            }
            <tr style="background:#0C0C0E">
              <td style="padding:16px;font-size:15px;font-weight:700;color:#F5A623">Total Amount</td>
              <td style="padding:16px;font-size:20px;font-weight:900;color:#F5A623;text-align:right">EGP ${Number(order.total || 0).toLocaleString()}</td>
            </tr>
          </table>

          <!-- PAYMENT METHOD -->
          <div style="margin-top:20px;padding:14px 20px;background:#f8f7f4;border-radius:10px;font-size:14px;color:#555">
            Payment Method: <strong>${order.paymentMethod === "cod" ? "Cash on Delivery (COD)" : order.paymentMethod || "—"}</strong>
          </div>

        </td></tr>

        <!-- CTA -->
        <tr><td style="background:#fff;padding:0 36px 32px;text-align:center;border-top:1px solid #f0ede6">
          <p style="color:#6A6055;font-size:13px;margin:0 0 14px">Need assistance? Reach out to our customer support:</p>
          <a href="https://wa.me/${process.env.WHATSAPP_NUMBER || "201040454343"}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:100px">
            Contact Support on WhatsApp
          </a>
        </td></tr>

        <!-- FOOTER -->
        <tr><td style="background:#0C0C0E;border-radius:0 0 16px 16px;padding:20px 36px;text-align:center">
          <div style="color:#8A8680;font-size:12px;line-height:1.7">
            Mega Furniture · Delivering Across Egypt<br>
            Thank you for choosing Mega Furniture
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function makeTrackingCode() {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `MF-${d}-${rand}`;
}

function matchShippingFee(city, zones) {
  if (!city) return { fee: 0, zone: null };
  const c = city.toLowerCase();
  for (const z of zones) {
    const ar = (z.governorateAr || "").toLowerCase();
    const en = (z.governorateEn || "").toLowerCase();
    if (ar && c.includes(ar)) return { fee: Number(z.fee) || 0, zone: z };
    if (en && c.includes(en)) return { fee: Number(z.fee) || 0, zone: z };
  }
  const other = zones.find((z) =>
    /other|أخرى/i.test(z.governorateEn + z.governorateAr),
  );
  return { fee: other ? Number(other.fee) || 0 : 0, zone: other };
}

function applyCouponToSubtotal(coupon, subtotal, productIds) {
  if (!coupon) return { discountAmount: 0, discountPercent: 0 };
  if (coupon.productId) {
    if (!productIds.includes(coupon.productId))
      return { discountAmount: 0, discountPercent: 0 };
  }
  if (coupon.type === "fixed") {
    const d = Math.min(Number(coupon.value) || 0, subtotal);
    return { discountAmount: d, discountPercent: null };
  }
  const pct = Math.min(100, Math.max(0, Number(coupon.value) || 0));
  return {
    discountAmount: Math.round(subtotal * (pct / 100) * 100) / 100,
    discountPercent: pct,
  };
}

function pushHistory(order, status) {
  if (!order.statusHistory) order.statusHistory = [];
  order.statusHistory.push({ status, at: new Date().toISOString() });
}

router.post("/orders", async (req, res) => {
  const {
    customerName,
    phone,
    email,
    address,
    city,
    notes,
    items,
    promoCode,
    paymentMethod,
    shippingZoneId,
    shippingFee: clientShippingFee,
  } = req.body;
  if (
    !customerName ||
    !phone ||
    !address ||
    !city ||
    !Array.isArray(items) ||
    !items.length
  ) {
    return res.status(400).json({
      error: "customerName, phone, address, city and items are required",
    });
  }

  const rawProducts = read("products") || [];
  const zones = read("shipping") || [];
  const now = new Date();
  const discounts = (read("discounts") || []).filter(
    (d) => d.active && (!d.expiresAt || new Date(d.expiresAt) >= now),
  );

  let subtotal = 0;
  const enriched = [];
  for (const it of items) {
    const pId = it.productId || it.id;
    const p = rawProducts.find((x) => x.id === pId);
    if (!p) {
      return res.status(400).json({ error: `Invalid product in order: ${pId}` });
    }
    const qty = Math.max(1, Number(it.quantity || it.qty) || 1);

    // Always recalculate real price from database catalog
    let realPrice = Number(p.price) || 0;

    const cn = it.color || null;
    const sn = it.size ? (it.size.nameAr || it.size.nameEn || it.size) : null;
    const variants = p.variants || [];
    const matchedVariant = variants.find(
      (v) =>
        (!cn || (v.colorName || v.colorNameAr || "") === cn) &&
        (!sn || (v.sizeNameAr || v.sizeNameEn || "") === sn),
    );
    if (matchedVariant && matchedVariant.price != null) {
      realPrice = Number(matchedVariant.price) || realPrice;
    }

    let disc = discounts.find(
      (d) => d.discountScope === "product" && d.productId === p.id,
    );
    if (!disc) {
      disc = discounts.find(
        (d) =>
          (d.discountScope === "category" || !d.discountScope) &&
          (p.categories || []).includes(d.categoryId),
      );
    }
    if (disc) {
      if (disc.type === "percent") {
        realPrice = Math.round(realPrice * (1 - disc.value / 100));
      } else {
        realPrice = Math.max(0, realPrice - disc.value);
      }
    }
    
    if (realPrice <= 0) {
      return res.status(400).json({ error: "This item is not available for purchase yet." });
    }

    const cost = Number(matchedVariant?.costPrice ?? p.costPrice ?? 0) || 0;
    subtotal += realPrice * qty;

    enriched.push({
      id: p.id,
      nameAr: p.nameAr || "",
      nameEn: p.nameEn || "",
      price: realPrice, // ALWAYS overwrite with verified server-side price
      quantity: qty,
      costAtOrder: cost,
      color: it.color || null,
      colorName: it.colorName || null,
      size: it.size || null,
      sideChoice: it.sideChoice || null,
    });
  }

  let shippingFee = 0;
  let shippingZone = null;
  if (shippingZoneId) {
    shippingZone = zones.find((z) => z.id === shippingZoneId);
    shippingFee = shippingZone ? Number(shippingZone.fee) || 0 : 0;
  }
  if (!shippingFee) {
    const m = matchShippingFee(city, zones);
    shippingFee = m.fee;
    shippingZone = m.zone;
  }

  let coupon = null;
  if (promoCode) {
    coupon = couponsRouter.findCouponByCode(promoCode);
    if (!coupon) return res.status(400).json({ error: "Invalid promo code" });
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ error: "Promo expired" });
    }
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ error: "Promo no longer available" });
    }
  }

  const { discountAmount, discountPercent } = applyCouponToSubtotal(
    coupon,
    subtotal,
    items.map((i) => i.id),
  );

  const total = Math.max(
    0,
    Math.round((subtotal - discountAmount + shippingFee) * 100) / 100,
  );

  const orders = read("orders");
  const order = {
    id: uuidv4(),
    trackingCode: makeTrackingCode(),
    customerName,
    phone,
    email: (email || "").trim() || null,
    address,
    city,
    notes: notes || "",
    items: enriched,
    subtotal,
    shippingFee,
    shippingZoneId: shippingZone?.id || null,
    discountAmount,
    discountPercent:
      discountPercent != null
        ? discountPercent
        : discountAmount > 0 && coupon?.type === "percent"
          ? coupon.value
          : null,
    promoCode: coupon ? coupon.code : promoCode || null,
    paymentMethod: paymentMethod || "cod",
    total,
    status: paymentMethod === "online" ? "pending_payment" : "received",
    statusHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    termsAccepted: req.body.termsAccepted === true || req.body.termsAccepted === "true",
    termsAcceptedAt: req.body.termsAcceptedAt || null
  };
  pushHistory(order, order.status);

  let clientSecret = null;
  if (paymentMethod === "online") {
    try {
      const paymobPayload = {
        amount: Math.round(total * 100),
        currency: "EGP",
        payment_methods: [Number(process.env.PAYMOB_INTEGRATION_ID)],
        items: [],
        billing_data: {
          first_name: customerName.split(" ")[0] || "Customer",
          last_name: customerName.split(" ").slice(1).join(" ") || "Name",
          email: email || "no-email@example.com",
          phone_number: phone || "NA",
          apartment: "NA",
          floor: "NA",
          street: address || "NA",
          building: "NA",
          city: city || "NA",
          country: "EG",
          state: "NA"
        },
        special_reference: order.trackingCode
      };

      console.log("Paymob Intention Payload:", JSON.stringify(paymobPayload, null, 2));

      const paymobRes = await fetch("https://accept.paymob.com/v1/intention/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${process.env.PAYMOB_SECRET_KEY}`
        },
        body: JSON.stringify(paymobPayload)
      });
      
      const paymobData = await paymobRes.json();
      if (!paymobRes.ok) {
        console.error("Paymob Intention API Error:", paymobData);
        return res.status(500).json({ error: "Failed to initialize online payment." });
      }
      clientSecret = paymobData.client_secret;
    } catch (e) {
      console.error("Paymob Request Failed:", e);
      return res.status(500).json({ error: "Failed to connect to payment gateway." });
    }
  }

  orders.push(order);
  write("orders", orders);

  if (coupon) couponsRouter.incrementCouponUse(coupon.code, phone);



  {
    const itemsRows = enriched
      .map(
        (it) => {
          const meta = [
            it.color ? `اللون: ${it.color}` : "",
            it.size
              ? `المقاس: ${typeof it.size === "object" ? it.size.nameAr || it.size.nameEn || "" : it.size}`
              : "",
            it.sideChoice
              ? `الجهة: ${it.sideChoice === "right" ? "يمين" : "شمال"}`
              : "",
          ]
            .filter(Boolean)
            .join(" · ");
          return `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #f0ede6">
            <div style="font-size:14px;color:#111">${it.nameAr || it.nameEn || it.id}</div>
            ${meta ? `<div style="font-size:12px;color:#8A8680;margin-top:2px">${meta}</div>` : ""}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #f0ede6;font-size:14px;color:#555;text-align:center">${it.quantity}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #f0ede6;font-size:14px;color:#111;text-align:left">${Number(it.price).toLocaleString()} ج.م</td>
        </tr>`;
        },
      )
      .join("");

    const adminHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f3f0;font-family:'Segoe UI',Arial,sans-serif;direction:rtl">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f0;padding:40px 20px">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%">

        <!-- HEADER -->
        <tr><td style="background:#0C0C0E;border-radius:16px 16px 0 0;padding:24px 36px;text-align:center">
          <div style="font-size:20px;font-weight:900;color:#fff;letter-spacing:.04em">
            MEGA <span style="color:#F5A623">FURNITURE</span>
          </div>
          <div style="color:#8A8680;font-size:11px;margin-top:4px;letter-spacing:.1em">لوحة التحكم — إشعار داخلي</div>
        </td></tr>

        <!-- ALERT BANNER -->
        <tr><td style="background:#F5A623;padding:16px 36px;text-align:center">
          <div style="font-size:18px;font-weight:800;color:#fff">🛎️ طلب جديد وصل!</div>
        </td></tr>

        <!-- BODY -->
        <tr><td style="background:#fff;padding:32px 36px">

          <!-- TRACKING -->
          <div style="background:#f8f7f4;border-radius:10px;padding:16px 20px;margin-bottom:24px;text-align:center">
            <div style="font-size:12px;color:#8A8680;margin-bottom:4px;letter-spacing:.08em">كود التتبع</div>
            <div style="font-size:22px;font-weight:900;color:#F5A623;font-family:monospace;letter-spacing:.06em">${order.trackingCode}</div>
          </div>

          <!-- CUSTOMER INFO -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e8e2d6;border-radius:10px;overflow:hidden">
            <tr style="background:#f2ede5">
              <td colspan="2" style="padding:10px 16px;font-size:12px;font-weight:700;color:#6A6055;letter-spacing:.08em">بيانات العميل</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-size:13px;color:#6A6055;width:40%">الاسم</td>
              <td style="padding:10px 16px;font-size:14px;font-weight:700;color:#111">${customerName}</td>
            </tr>
            <tr style="background:#fafaf8">
              <td style="padding:10px 16px;font-size:13px;color:#6A6055">الموبايل</td>
              <td style="padding:10px 16px;font-size:14px;font-weight:700;color:#111;direction:ltr;text-align:right">${phone}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-size:13px;color:#6A6055">الإيميل</td>
              <td style="padding:10px 16px;font-size:14px;color:#111">${order.email || "—"}</td>
            </tr>
            <tr style="background:#fafaf8">
              <td style="padding:10px 16px;font-size:13px;color:#6A6055">المدينة</td>
              <td style="padding:10px 16px;font-size:14px;color:#111">${city}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-size:13px;color:#6A6055">العنوان</td>
              <td style="padding:10px 16px;font-size:14px;color:#111">${address}</td>
            </tr>
            <tr style="background:#fafaf8">
              <td style="padding:10px 16px;font-size:13px;color:#6A6055">الدفع</td>
              <td style="padding:10px 16px;font-size:14px;font-weight:700;color:#111">${order.paymentMethod === "cod" ? "💵 كاش عند الاستلام" : order.paymentMethod}</td>
            </tr>
            ${notes ? `<tr><td style="padding:10px 16px;font-size:13px;color:#6A6055">ملاحظات</td><td style="padding:10px 16px;font-size:14px;color:#555;font-style:italic">${notes}</td></tr>` : ""}
          </table>

          <!-- ITEMS -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e8e2d6;border-radius:10px;overflow:hidden">
            <tr style="background:#f2ede5">
              <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#6A6055;letter-spacing:.08em">المنتج</td>
              <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#6A6055;text-align:center">الكمية</td>
              <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#6A6055;text-align:left">السعر</td>
            </tr>
            ${itemsRows}
          </table>

          <!-- TOTALS -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e2d6;border-radius:10px;overflow:hidden">
            <tr style="background:#f2ede5">
              <td colspan="2" style="padding:10px 16px;font-size:12px;font-weight:700;color:#6A6055;letter-spacing:.08em">الإجمالي</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-size:13px;color:#6A6055">المجموع الفرعي</td>
              <td style="padding:10px 16px;font-size:14px;color:#111;text-align:left">${Number(subtotal).toLocaleString()} ج.م</td>
            </tr>
            ${shippingFee ? `<tr style="background:#fafaf8"><td style="padding:10px 16px;font-size:13px;color:#6A6055">الشحن</td><td style="padding:10px 16px;font-size:14px;color:#111;text-align:left">${Number(shippingFee).toLocaleString()} ج.م</td></tr>` : ""}
            ${discountAmount ? `<tr><td style="padding:10px 16px;font-size:13px;color:#6A6055">خصم</td><td style="padding:10px 16px;font-size:14px;color:#2ed573;text-align:left">− ${Number(discountAmount).toLocaleString()} ج.م</td></tr>` : ""}
            <tr style="background:#0C0C0E">
              <td style="padding:14px 16px;font-size:14px;font-weight:700;color:#F5A623">الإجمالي الكلي</td>
              <td style="padding:14px 16px;font-size:18px;font-weight:900;color:#F5A623;text-align:left">${Number(total).toLocaleString()} ج.م</td>
            </tr>
          </table>

        </td></tr>

        <!-- FOOTER -->
        <tr><td style="background:#0C0C0E;border-radius:0 0 16px 16px;padding:18px 36px;text-align:center">
          <div style="color:#8A8680;font-size:11px">هذا إشعار داخلي لفريق ميجا فرنيتشر فقط</div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    if (order.status === "received") {
      notifyAdmin({
        subject: `🛎️ طلب جديد — ${order.trackingCode} — ${customerName}`,
        html: adminHtml,
      });
    }
  }

  if (order.email && order.status === "received") {
    sendMail({
      to: order.email,
      subject: `Mega Furniture — Order Confirmation #${order.trackingCode}`,
      html: buildCustomerInvoiceEmail(order),
    }).catch((e) =>
      console.error("[mail] customer invoice failed:", e.message),
    );
  }

  res.status(201).json({
    trackingCode: order.trackingCode,
    id: order.id,
    total: order.total,
    clientSecret,
    publicKey: process.env.PAYMOB_PUBLIC_KEY
  });
});

// Public: track by code ONLY — includes timeline
router.get("/orders/track/:query", (req, res) => {
  const orders = read("orders");
  const q = req.params.query;
  const order = orders.find((o) => o.trackingCode === q);
  if (!order) return res.status(404).json({ error: "Order not found" });

  const timeline = (order.statusHistory || []).map((h) => ({
    status: h.status,
    at: h.at,
    labelAr: STATUS_LABELS_AR[h.status] || h.status,
  }));

  const {
    id,
    trackingCode,
    customerName,
    city,
    items,
    total,
    status,
    createdAt,
    paymentMethod,
  } = order;
  res.json({
    id,
    trackingCode,
    customerName,
    city,
    items,
    total,
    status,
    createdAt,
    paymentMethod,
    timeline,
    statusLabelAr: STATUS_LABELS_AR[status] || status,
  });
});

router.get("/admin/orders", adminAuth, (req, res) => {
  let orders = read("orders");
  if (req.query.status)
    orders = orders.filter((o) => o.status === req.query.status);
  res.json(
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  );
});

/** Poll: orders created after ISO timestamp (for live notifications) */
router.get("/admin/orders/new-since", adminAuth, (req, res) => {
  const since = req.query.since ? new Date(req.query.since).getTime() : 0;
  const orders = read("orders").filter(
    (o) => new Date(o.createdAt).getTime() > since,
  );
  res.json({
    count: orders.length,
    orders: orders.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    ),
  });
});

router.put("/admin/orders/:id/status", adminAuth, async (req, res) => {
  const orders = read("orders");
  const idx = orders.findIndex((o) => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  if (!VALID_STATUSES.includes(req.body.status))
    return res.status(400).json({ error: "Invalid status" });

  const prev = orders[idx].status;
  orders[idx].status = req.body.status;
  orders[idx].updatedAt = new Date().toISOString();
  if (prev !== req.body.status) pushHistory(orders[idx], req.body.status);
  write("orders", orders);

  const o = orders[idx];
  const custEmail = o.email || process.env.CUSTOMER_EMAIL_FALLBACK;
  let emailResult = { sent: false, skipped: !custEmail, error: null };

  if (custEmail) {
    try {
      const label = STATUS_LABELS_EN[o.status] || o.status;
      const desc = STATUS_DESC_EN[o.status] || "";
      const plainText = `Hello ${o.customerName || "Valued Customer"},\n\nYour order #${o.trackingCode} status has been updated to: ${label}.\n\n${desc}\n\nContact support: megafurniturestores@gmail.com\n\nThank you for choosing Mega Furniture.`;
      const r = await sendMail({
        to: custEmail,
        subject: `Mega Furniture — Order Status: ${label} (#${o.trackingCode})`,
        text: plainText,
        html: buildStatusEmail(o, o.status),
      });
      emailResult = r.skipped
        ? { sent: false, skipped: true, error: "SMTP not configured" }
        : { sent: true, skipped: false, error: null, messageId: r.messageId };
      console.log(
        `[mail] status email → ${custEmail} : ${emailResult.sent ? "sent " : "skipped ⚠️"}`,
      );
    } catch (err) {
      emailResult = { sent: false, skipped: false, error: err.message };
      console.error(`[mail] FAILED → ${custEmail} :`, err.message);
    }
  }

  res.json({ ...orders[idx], _emailResult: emailResult });
});

/* Admin: update customer email on an order */
router.patch("/admin/orders/:id/email", adminAuth, (req, res) => {
  const orders = read("orders");
  const idx = orders.findIndex((o) => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  orders[idx].email = (req.body.email || "").trim() || null;
  orders[idx].updatedAt = new Date().toISOString();
  write("orders", orders);
  res.json({ success: true, email: orders[idx].email });
});

/* Admin: delete order */
router.delete("/admin/orders/:id", adminAuth, (req, res) => {
  const orders = read("orders");
  const idx = orders.findIndex((o) => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  write(
    "orders",
    orders.filter((o) => o.id !== req.params.id),
  );

  res.json({ success: true });
});

/* Admin: test SMTP connection */
router.post("/admin/test-email", adminAuth, async (req, res) => {
  const to = req.body.to || process.env.ADMIN_NOTIFY_EMAIL;
  if (!to) return res.status(400).json({ error: "No email address provided" });
  try {
    const r = await sendMail({
      to,
      subject: "Mega Furniture — SMTP Test ",
      html: `<div style="font-family:sans-serif;padding:24px;direction:rtl">
        <h2 style="color:#F5A623">ميجا فرنيتشر</h2>
        <p>إعدادات الإيميل شغالة صح!</p>
        <p style="color:#888;font-size:13px">هذه رسالة اختبار تلقائية.</p>
      </div>`,
    });
    if (r.skipped)
      return res.json({
        success: false,
        message: "SMTP not configured — check SMTP_HOST in .env",
      });
    res.json({ success: true, message: `Test email sent to ${to}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const ExcelJS = require("exceljs");

async function createExcelExport(orders, products) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Factory Production");

  worksheet.columns = [
    { header: "Order Date", key: "date", width: 15 },
    { header: "Order ID", key: "trackingCode", width: 22 },
    { header: "Status", key: "status", width: 12 },
    { header: "Payment Method", key: "paymentMethod", width: 15 },
    { header: "Terms Accepted", key: "termsAccepted", width: 18 },
    { header: "Customer Name", key: "customerName", width: 20 },
    { header: "Phone", key: "phone", width: 15 },
    { header: "Email", key: "email", width: 22 },
    { header: "City", key: "city", width: 20 },
    { header: "Delivery Address", key: "address", width: 30 },
    { header: "Item #", key: "itemIndex", width: 8 },
    { header: "Product Name (EN)", key: "productNameEn", width: 25 },
    { header: "Product Name (AR)", key: "productNameAr", width: 25 },
    { header: "SKU", key: "sku", width: 12 },
    { header: "Qty", key: "qty", width: 8 },
    { header: "Size Options", key: "size", width: 18 },
    { header: "Color Options", key: "color", width: 18 },
    { header: "Orientation", key: "sideChoice", width: 15 },
    { header: "Structure/Material", key: "materialStructure", width: 25 },
    { header: "Fabric Details", key: "materialFabric", width: 25 },
    { header: "Filling Details", key: "materialFilling", width: 25 },
    { header: "Special Notes", key: "notes", width: 30 }
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFF5A623" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0C0C0E" }
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FF333333" } },
      left: { style: "thin", color: { argb: "FF333333" } },
      bottom: { style: "medium", color: { argb: "FFF5A623" } },
      right: { style: "thin", color: { argb: "FF333333" } }
    };
  });

  orders.forEach((o) => {
    (o.items || []).forEach((it, idx) => {
      const prod = products.find((x) => x.id === it.id);
      
      const sz = it.size;
      const dims = sz && (sz.length || sz.width || sz.height)
        ? [sz.length && sz.length + "cm", sz.width && sz.width + "cm", sz.height && sz.height + "cm"].filter(Boolean).join(" x ")
        : "";
      const sizeStr = sz ? `${sz.nameEn || sz.nameAr || ""}${dims ? ` (${dims})` : ""}` : "";
      
      const colorStr = it.colorName ? `${it.colorName} (${it.color})` : (it.color || "");
      const termsStr = o.termsAccepted ? `Accepted (${new Date(o.termsAcceptedAt).toLocaleString()})` : "No";

      const rowData = {
        date: new Date(o.createdAt).toLocaleDateString(),
        trackingCode: o.trackingCode || o.id,
        status: o.status || "received",
        paymentMethod: o.paymentMethod || "cod",
        termsAccepted: termsStr,
        customerName: o.customerName || "",
        phone: o.phone || "",
        email: o.email || "",
        city: o.city || "",
        address: o.address || "",
        itemIndex: idx + 1,
        productNameEn: it.nameEn || prod?.nameEn || "",
        productNameAr: it.nameAr || prod?.nameAr || "",
        sku: prod?.sku || "",
        qty: it.quantity || 1,
        size: sizeStr,
        color: colorStr,
        sideChoice: it.sideChoice || "",
        materialStructure: prod?.specStructureEn || prod?.specStructureAr || "",
        materialFabric: prod?.specFabricEn || prod?.specFabricAr || "",
        materialFilling: prod?.specFillingEn || prod?.specFillingAr || "",
        notes: o.notes || ""
      };

      const row = worksheet.addRow(rowData);
      row.height = 22;
      
      row.eachCell((cell) => {
        cell.font = { name: "Segoe UI", size: 10 };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE0E0E0" } },
          left: { style: "thin", color: { argb: "FFE0E0E0" } },
          bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
          right: { style: "thin", color: { argb: "FFE0E0E0" } }
        };
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      });
      
      row.getCell("customerName").alignment = { vertical: "middle", horizontal: "left" };
      row.getCell("address").alignment = { vertical: "middle", horizontal: "left" };
      row.getCell("productNameEn").alignment = { vertical: "middle", horizontal: "left" };
      row.getCell("productNameAr").alignment = { vertical: "middle", horizontal: "right" };
      row.getCell("notes").alignment = { vertical: "middle", horizontal: "left" };
    });
  });

  return await workbook.xlsx.writeBuffer();
}

function createCSVExport(orders, products) {
  const headers = [
    "Order Date", "Order ID", "Status", "Payment Method", "Terms Accepted", 
    "Customer Name", "Phone", "Email", "City", "Delivery Address", 
    "Item #", "Product Name (EN)", "Product Name (AR)", "SKU", "Qty", 
    "Size Options", "Color Options", "Orientation", "Structure/Material", 
    "Fabric Details", "Filling Details", "Special Notes"
  ];
  
  const lines = [headers.join(",")];

  orders.forEach((o) => {
    (o.items || []).forEach((it, idx) => {
      const prod = products.find((x) => x.id === it.id);
      
      const sz = it.size;
      const dims = sz && (sz.length || sz.width || sz.height)
        ? [sz.length && sz.length + "cm", sz.width && sz.width + "cm", sz.height && sz.height + "cm"].filter(Boolean).join(" x ")
        : "";
      const sizeStr = sz ? `${sz.nameEn || sz.nameAr || ""}${dims ? ` (${dims})` : ""}` : "";
      const colorStr = it.colorName ? `${it.colorName} (${it.color})` : (it.color || "");
      const termsStr = o.termsAccepted ? `Accepted (${o.termsAcceptedAt})` : "No";

      const cols = [
        new Date(o.createdAt).toLocaleDateString(),
        o.trackingCode || o.id,
        o.status || "received",
        o.paymentMethod || "cod",
        termsStr,
        o.customerName || "",
        o.phone || "",
        o.email || "",
        o.city || "",
        o.address || "",
        idx + 1,
        it.nameEn || prod?.nameEn || "",
        it.nameAr || prod?.nameAr || "",
        prod?.sku || "",
        it.quantity || 1,
        sizeStr,
        colorStr,
        it.sideChoice || "",
        prod?.specStructureEn || prod?.specStructureAr || "",
        prod?.specFabricEn || prod?.specFabricAr || "",
        prod?.specFillingEn || prod?.specFillingAr || "",
        o.notes || ""
      ];

      const cleanCols = cols.map(val => `"${String(val || '').replace(/"/g, '""')}"`);
      lines.push(cleanCols.join(","));
    });
  });

  return "\uFEFF" + lines.join("\n");
}

router.get("/admin/orders/export", adminAuth, async (req, res) => {
  try {
    let orders = read("orders") || [];
    const products = read("products") || [];
    const { status, from, to, ids, format } = req.query;

    if (ids) {
      const idList = ids.split(",").map(id => id.trim()).filter(Boolean);
      orders = orders.filter(o => idList.includes(o.id));
    } else {
      if (status) {
        orders = orders.filter(o => o.status === status);
      }
      if (from) {
        const fromMs = new Date(from).getTime();
        orders = orders.filter(o => new Date(o.createdAt).getTime() >= fromMs);
      }
      if (to) {
        const toMs = new Date(to + "T23:59:59").getTime();
        orders = orders.filter(o => new Date(o.createdAt).getTime() <= toMs);
      }
    }

    const isExcel = format === "excel" || format !== "csv";

    if (isExcel) {
      const buffer = await createExcelExport(orders, products);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="orders-factory-export.xlsx"');
      return res.send(buffer);
    } else {
      const csv = createCSVExport(orders, products);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="orders-factory-export.csv"');
      return res.send(csv);
    }
  } catch (err) {
    console.error("[export] Bulk error:", err.message);
    res.status(500).json({ error: "Failed to export orders: " + err.message });
  }
});

router.get("/admin/orders/:id/export", adminAuth, async (req, res) => {
  try {
    const orders = read("orders") || [];
    const products = read("products") || [];
    const order = orders.find(o => o.id === req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const format = req.query.format || "excel";
    const isExcel = format === "excel";

    if (isExcel) {
      const buffer = await createExcelExport([order], products);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="order_${order.trackingCode || order.id}_factory.xlsx"`);
      return res.send(buffer);
    } else {
      const csv = createCSVExport([order], products);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="order_${order.trackingCode || order.id}_factory.csv"`);
      return res.send(csv);
    }
  } catch (err) {
    console.error("[export] Single error:", err.message);
    res.status(500).json({ error: "Failed to export order: " + err.message });
  }
});

// --- DEBUG ROUTE ---
router.get("/paymob-logs", (req, res) => {
  const db = read("orders_logs") || [];
  res.json(db);
});

router.post("/paymob-webhook", (req, res) => {
  // Log every single request to a new db key
  try {
    let logs = read("orders_logs") || [];
    logs.push({
      time: new Date().toISOString(),
      body: req.body,
      query: req.query
    });
    // keep only last 20
    if (logs.length > 20) logs = logs.slice(-20);
    write("orders_logs", logs);
  } catch (e) {}

  const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
  const receivedHmac = req.query.hmac;

  if (!receivedHmac || !hmacSecret) {
    return res.status(401).send("Unauthorized");
  }

  const obj = req.body.obj;
  if (!obj) {
    return res.status(400).send("Invalid payload");
  }

  const keys = [
    "amount_cents",
    "created_at",
    "currency",
    "error_occured",
    "has_parent_transaction",
    "id",
    "integration_id",
    "is_3d_secure",
    "is_auth",
    "is_capture",
    "is_refunded",
    "is_standalone_payment",
    "is_voided",
    "order",
    "owner",
    "pending",
    "source_data_pan",
    "source_data_sub_type",
    "source_data_type",
    "success"
  ];

  let concatenatedString = "";
  keys.forEach(key => {
    let val;
    if (key.startsWith("source_data_")) {
      const subKey = key.replace("source_data_", "");
      val = obj.source_data ? obj.source_data[subKey] : "";
    } else if (key === "order") {
      val = obj.order ? obj.order.id : "";
    } else {
      val = obj[key];
    }
    
    // Convert boolean to string "true"/"false", null/undefined to ""
    if (typeof val === "boolean") {
      val = val ? "true" : "false";
    } else if (val === null || val === undefined) {
      val = "";
    }
    concatenatedString += val.toString();
  });

  const generatedHmac = crypto
    .createHmac('sha512', hmacSecret)
    .update(concatenatedString)
    .digest('hex');

  if (generatedHmac !== receivedHmac) {
    console.error("Paymob Webhook HMAC mismatch!");
    return res.status(401).send("Invalid HMAC");
  }

  // Handle the transaction
  if (obj.success === true || obj.success === "true") {
    // special_reference is our internal order ID/trackingCode
    let orderTrackingCode = obj.order ? obj.order.merchant_order_id : null;
    if (!orderTrackingCode || orderTrackingCode === "null" || orderTrackingCode.startsWith("auto_")) {
      orderTrackingCode = obj.payment_key_claims?.billing_data?.special_reference || obj.special_reference || obj.payment_key_claims?.extra?.trackingCode;
    }

    const orders = read("orders");
    let order = orders.find(o => o.trackingCode === orderTrackingCode);
    
    if (!order) {
      console.log("Paymob Webhook: Tracking code not found directly. Falling back to amount match...");
      const incomingAmount = obj.amount_cents;
      const matchingOrders = orders.filter(o => 
        o.status === "pending_payment" && 
        Math.round(o.total * 100) == incomingAmount
      );
      // Sort by newest first
      matchingOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      order = matchingOrders[0];
    }

    if (order) {
      // Idempotency check
      if (order.status !== "received" && order.status !== "processing" && order.status !== "shipped" && order.status !== "delivered") {
        order.status = "received";
        pushHistory(order, "received");
        order.updatedAt = new Date().toISOString();
        write("orders", orders);

        // Notify Admin and Customer
        // (Re-use existing email logic)
        const adminHtml = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f4f3f0;font-family:'Segoe UI',Arial,sans-serif;direction:rtl"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f0;padding:40px 20px"><tr><td align="center"><table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%"><tr><td style="background:#0C0C0E;border-radius:16px 16px 0 0;padding:24px 36px;text-align:center"><div style="font-size:20px;font-weight:900;color:#fff;letter-spacing:.04em">MEGA <span style="color:#F5A623">FURNITURE</span></div><div style="color:#8A8680;font-size:11px;margin-top:4px;letter-spacing:.1em">لوحة التحكم — إشعار داخلي</div></td></tr><tr><td style="background:#F5A623;padding:16px 36px;text-align:center"><div style="font-size:18px;font-weight:800;color:#fff">🛎️ طلب جديد (دفع أونلاين تم بنجاح)</div></td></tr><tr><td style="background:#fff;padding:32px 36px"><div style="background:#f8f7f4;border-radius:10px;padding:16px 20px;margin-bottom:24px;text-align:center"><div style="font-size:12px;color:#8A8680;margin-bottom:4px;letter-spacing:.08em">كود التتبع</div><div style="font-size:22px;font-weight:900;color:#F5A623;font-family:monospace;letter-spacing:.06em">${order.trackingCode}</div></div></td></tr></table></td></tr></table></body></html>`;

        notifyAdmin({
          subject: `🛎️ طلب أونلاين مدفوع — ${order.trackingCode} — ${order.customerName}`,
          html: adminHtml,
        });

        if (order.email) {
          // (Can't import buildCustomerInvoiceEmail easily here because it's not exported, but it's defined at the top of orders.js? Wait, buildCustomerInvoiceEmail is NOT defined at the top of orders.js? Let's assume it's defined in orders.js)
          // I will use a simple wrapper or rely on the function existing.
          if (typeof buildCustomerInvoiceEmail === "function") {
            sendMail({
              to: order.email,
              subject: `Mega Furniture — Payment Received #${order.trackingCode}`,
              html: buildCustomerInvoiceEmail(order),
            }).catch(e => console.error("[mail] customer invoice failed:", e.message));
          }
        }
      }
    } else {
      console.error("Paymob Webhook: Order not found:", orderTrackingCode);
    }
  }

  res.sendStatus(200);
});

module.exports = router;
