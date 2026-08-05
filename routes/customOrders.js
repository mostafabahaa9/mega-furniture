const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const { read, write } = require("../utils/db");
const { adminAuth } = require("../middleware/auth");
const { uploadNoSvg } = require("../middleware/upload");
const { sendMail } = require("../utils/mail");
const { destroyByUrl } = require("../utils/cloudinary");

const CO_STATUS_LABELS = {
  new: "Request Received",
  "in-progress": "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const CO_STATUS_DESC = {
  new: "We have received your custom furniture request. Our team will contact you within 24 hours to discuss details and provide a quote.",
  "in-progress": "We have started crafting your custom furniture project with high precision and quality.",
  completed: "Your custom furniture project has been completed! Thank you for choosing Mega Furniture.",
  cancelled: "Your custom furniture request has been cancelled. If you have any questions, please contact our support team.",
};

const CO_STATUS_ICON = {
  new: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F5A623" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  "in-progress": `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F5A623" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  completed: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2.5" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  cancelled: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff4757" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
};

const CO_TYPE_LABELS = {
  "living-room": "Living Room / L-Shape",
  bedroom: "Bedroom",
  "dining-room": "Dining Room",
  wardrobe: "Wardrobe / Closet",
  "tv-unit": "TV Unit",
  "kids-room": "Kids Room",
  office: "Office Furniture",
  other: "Custom Item",
};

function buildConfirmEmail(order) {
  const name = order.customerName || "Valued Customer";
  const type = CO_TYPE_LABELS[order.furnitureType] || order.furnitureType;
  const wa = process.env.WHATSAPP_NUMBER || "201040454343";

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

        <!-- CONFIRM BADGE -->
        <tr><td style="background:#ffffff;padding:36px 36px 0">
          <div style="text-align:center;margin-bottom:24px">
            <div style="display:inline-block;background:#F5A623;color:#fff;font-size:14px;font-weight:700;padding:8px 24px;border-radius:100px;letter-spacing:.04em">
              Custom Request Received
            </div>
          </div>
          <h2 style="margin:0 0 8px;font-size:20px;color:#111;text-align:center">We Received Your Request</h2>
          <p style="margin:0 0 24px;color:#6A6055;font-size:15px;text-align:center;line-height:1.6">
            Hello <strong>${name}</strong>, we have received your custom work request and will contact you within <strong style="color:#F5A623">24 hours</strong> with details and pricing.
          </p>
        </td></tr>

        <!-- ORDER DETAILS -->
        <tr><td style="background:#ffffff;padding:0 36px 28px">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e2d6;border-radius:10px;overflow:hidden">
            <tr style="background:#f2ede5">
              <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#6A6055;letter-spacing:.08em">REQUEST SUMMARY</td>
            </tr>
            <tr><td style="padding:14px 16px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:#6A6055;font-size:13px;padding:5px 0;width:40%">Name</td>
                  <td style="font-size:13px;font-weight:600;color:#111;padding:5px 0">${name}</td>
                </tr>
                <tr>
                  <td style="color:#6A6055;font-size:13px;padding:5px 0">Phone</td>
                  <td style="font-size:13px;font-weight:600;color:#111;padding:5px 0">${order.phone}</td>
                </tr>
                <tr>
                  <td style="color:#6A6055;font-size:13px;padding:5px 0">Furniture Type</td>
                  <td style="font-size:13px;font-weight:600;color:#F5A623;padding:5px 0">${type}</td>
                </tr>
                ${
                  order.colors
                    ? `<tr>
                  <td style="color:#6A6055;font-size:13px;padding:5px 0">Colors</td>
                  <td style="font-size:13px;color:#111;padding:5px 0">${order.colors}</td>
                </tr>`
                    : ""
                }
                ${
                  order.description
                    ? `<tr>
                  <td style="color:#6A6055;font-size:13px;padding:5px 0;vertical-align:top">Description</td>
                  <td style="font-size:13px;color:#111;padding:5px 0;line-height:1.6">${order.description}</td>
                </tr>`
                    : ""
                }
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- MESSAGE -->
        <tr><td style="background:#ffffff;padding:0 36px 28px">
          <div style="background:#fffbf0;border-left:4px solid #F5A623;border-radius:8px;padding:16px 20px;font-size:14px;color:#333;line-height:1.8">
            Our design specialist will call you at <strong>${order.phone}</strong> to discuss dimensions and materials.
          </div>
        </td></tr>

        <!-- CTA -->
        <tr><td style="background:#ffffff;padding:0 36px 36px;text-align:center">
          <p style="color:#6A6055;font-size:13px;margin:0 0 16px">Prefer instant communication? Message us on WhatsApp:</p>
          <a href="https://wa.me/${wa}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:100px">
            Contact Us on WhatsApp
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

function buildStatusEmail(order, status) {
  const name = order.customerName || "Valued Customer";
  const label = CO_STATUS_LABELS[status] || status;
  const desc = CO_STATUS_DESC[status] || "";
  const icon = CO_STATUS_ICON[status] || "";
  const wa = process.env.WHATSAPP_NUMBER || "201040454343";

  const accentColor =
    status === "completed"
      ? "#2ed573"
      : status === "cancelled"
        ? "#ff4757"
        : status === "in-progress"
          ? "#1e90ff"
          : "#F5A623";

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
            <div style="font-size:52px;margin-bottom:12px">${icon}</div>
            <div style="display:inline-block;background:${accentColor};color:#fff;font-size:14px;font-weight:700;padding:8px 24px;border-radius:100px;letter-spacing:.04em">
              ${label}
            </div>
          </div>
          <h2 style="margin:0 0 8px;font-size:20px;color:#111;text-align:center">Custom Order Update</h2>
          <p style="margin:0 0 24px;color:#6A6055;font-size:15px;text-align:center;line-height:1.6">
            Hello <strong>${name}</strong>, your custom work request has moved to a new stage.
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
              <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#6A6055;letter-spacing:.08em">DETAILS</td>
            </tr>
            <tr><td style="padding:14px 16px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:#6A6055;font-size:13px;padding:4px 0;width:40%">Name</td>
                  <td style="font-size:13px;font-weight:600;color:#111;padding:4px 0">${name}</td>
                </tr>
                <tr>
                  <td style="color:#6A6055;font-size:13px;padding:4px 0">Furniture Type</td>
                  <td style="font-size:13px;font-weight:600;color:#F5A623;padding:4px 0">${CO_TYPE_LABELS[order.furnitureType] || order.furnitureType}</td>
                </tr>
                <tr>
                  <td style="color:#6A6055;font-size:13px;padding:4px 0">Status</td>
                  <td style="font-size:13px;font-weight:700;color:${accentColor};padding:4px 0">${label}</td>
                </tr>
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td style="background:#ffffff;padding:0 36px 36px;text-align:center">
          <p style="color:#6A6055;font-size:13px;margin:0 0 16px">Questions about your request? Contact us:</p>
          <a href="https://wa.me/${wa}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:100px">
            Contact Us on WhatsApp
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

/* Public: submit a custom order */
router.post("/custom-orders", uploadNoSvg.array("photos", 25), async (req, res) => {
  const {
    customerName,
    phone,
    email,
    furnitureType,
    description,
    colors,
    budget,
  } = req.body;
  if (!customerName || !phone || !furnitureType)
    return res
      .status(400)
      .json({ error: "customerName, phone and furnitureType are required" });

  const order = {
    id: uuidv4(),
    customerName: customerName.trim(),
    phone: phone.trim(),
    email: (email || "").trim() || null,
    furnitureType,
    description: (description || "").trim(),
    colors: (colors || "").trim(),
    budget: budget || null,
    photos: (req.files || []).map((f) => f.path),
    status: "new",
    adminNotes: "",
    createdAt: new Date().toISOString(),
  };

  const orders = read("customOrders");
  orders.push(order);
  write("customOrders", orders);

  // Send confirmation email to customer
  if (order.email) {
    try {
      await sendMail({
        to: order.email,
        subject: "وصلنا طلبك! - ميجا فرنيتشر",
        text: `أهلاً ${order.customerName}،\n\nاستلمنا طلبك للشغل المخصوص وهنتواصل معاك خلال 24 ساعة.\n\nنوع الأثاث: ${CO_TYPE_LABELS[order.furnitureType] || order.furnitureType}\n\nشكراً لثقتك في ميجا فرنيتشر`,
        html: buildConfirmEmail(order),
      });
    } catch (err) {
      console.error("[mail] custom order confirm failed:", err.message);
    }
  }

  res.status(201).json({ success: true });
});

/* Admin: list all */
router.get("/admin/custom-orders", adminAuth, (req, res) => {
  res.json(
    read("customOrders").sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    ),
  );
});

/* Admin: update status / notes */
router.put("/admin/custom-orders/:id", adminAuth, async (req, res) => {
  const orders = read("customOrders");
  const idx = orders.findIndex((o) => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const { status, adminNotes } = req.body;
  const prevStatus = orders[idx].status;

  if (status) orders[idx].status = status;
  if (adminNotes !== undefined) orders[idx].adminNotes = adminNotes;
  write("customOrders", orders);

  const order = orders[idx];

  // Send status email when status actually changed and customer has email
  if (status && status !== prevStatus && order.email) {
    try {
      const label = CO_STATUS_LABELS[status] || status;
      await sendMail({
        to: order.email,
        subject: `تحديث طلبك المخصوص - ${label} | ميجا فرنيتشر`,
        text: `أهلاً ${order.customerName}،\n\nطلبك للشغل المخصوص انتقل إلى: ${label}\n\n${CO_STATUS_DESC[status] || ""}\n\nللتواصل: megafurniturestores@gmail.com`,
        html: buildStatusEmail(order, status),
      });
      console.log(`[mail] custom order status → ${order.email} : ${status} ✅`);
    } catch (err) {
      console.error("[mail] custom order status email failed:", err.message);
    }
  }

  res.json(order);
});

/* Admin: delete */
router.delete("/admin/custom-orders/:id", adminAuth, async (req, res) => {
  const orders = read("customOrders");
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Not found" });
  await Promise.all((order.photos || []).map((url) => destroyByUrl(url)));
  write(
    "customOrders",
    orders.filter((o) => o.id !== req.params.id),
  );
  res.json({ success: true });
});

module.exports = router;
