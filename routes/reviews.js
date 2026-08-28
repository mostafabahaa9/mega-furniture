const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const { read, write } = require("../utils/db");
const { adminAuth } = require("../middleware/auth");
const { uploadNoSvg } = require("../middleware/upload");
const { destroyByUrl } = require("../utils/cloudinary");

function fileUrl(f) {
  if (!f) return null;
  if (f.path && f.path.startsWith("http")) return f.path;
  return f.filename || f.path;
}

/* Public: approved reviews */
router.get("/reviews", (req, res) => {
  const { productId, featured } = req.query;
  let reviews = read("reviews").filter((r) => r.approved);
  if (featured === 'true') {
    reviews = reviews.filter((r) => r.featuredOnHome);
  }
  if (productId) {
    reviews = reviews.filter((r) => r.productId === productId);
  }
  reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(reviews);
});

/* Public: submit a review (with optional photo) */
router.post("/reviews", uploadNoSvg.single("photo"), (req, res) => {
  const { customerName, rating, comment, productId, city } = req.body;

  if (!customerName || !rating)
    return res
      .status(400)
      .json({ error: "customerName and rating are required" });

  const ratingNum = parseInt(rating);
  if (ratingNum < 1 || ratingNum > 5)
    return res.status(400).json({ error: "Rating must be between 1 and 5" });

  /* Look up product to store SKU & name directly on the review */
  let productSku = null;
  let productName = null;
  if (productId) {
    const products = read("products");
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      productSku = prod.sku || null;
      productName = prod.nameEn || prod.nameAr || null;
    }
  }

  const review = {
    id: uuidv4(),
    productId: productId || null,
    productSku,
    productName,
    customerName: customerName.trim(),
    city: (city || "").trim() || null,
    rating: ratingNum,
    comment: (comment || "").trim(),
    photo: req.file ? fileUrl(req.file) : null,
    approved: false,
    featuredOnHome: false,
    createdAt: new Date().toISOString(),
  };

  const reviews = read("reviews");
  reviews.push(review);
  write("reviews", reviews);
  res.status(201).json({ success: true });
});

/* Public: quick-rate from email link — GET /review-quick?tracking=X&rating=Y&name=Z */
router.get("/review-quick", (req, res) => {
  const { tracking, rating, name } = req.query;
  const ratingNum = parseInt(rating);
  if (!tracking || !ratingNum || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).send("<h2>رابط غير صحيح</h2>");
  }
  const orders = read("orders");
  const order = orders.find((o) => o.trackingCode === tracking);
  const customerName = name || (order && order.customerName) || "عميل";
  const stars = "⭐".repeat(ratingNum);
  const review = {
    id: uuidv4(),
    productId: null,
    customerName: customerName.trim(),
    city: (order && order.city) || null,
    rating: ratingNum,
    comment: "",
    source: "email",
    trackingCode: tracking,
    approved: false,
    featuredOnHome: false,
    createdAt: new Date().toISOString(),
  };
  const reviews = read("reviews");
  const already = reviews.find(
    (r) => r.trackingCode === tracking && r.source === "email",
  );
  if (!already) {
    reviews.push(review);
    write("reviews", reviews);
  }
  res.send(`<!DOCTYPE html><html lang="en" dir="ltr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Thank You for Your Rating</title></head>
<body style="margin:0;padding:40px 20px;background:#f4f3f0;font-family:'Segoe UI',Arial,sans-serif;direction:ltr;text-align:center">
  <div style="max-width:400px;margin:0 auto;background:#fff;border-radius:20px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,.08)">
    <div style="font-size:32px;color:#F5A623;margin-bottom:12px">${stars}</div>
    <h2 style="margin:0 0 8px;color:#111;font-size:22px">Thank You for Your Rating!</h2>
    <p style="color:#6A6055;font-size:15px;line-height:1.7;margin:0 0 24px">Your feedback is very important to us and helps us continuously improve.</p>
    <div style="font-size:13px;color:#8A8680;font-weight:700;letter-spacing:0.05em">Mega Furniture</div>
  </div>
</body></html>`);
});

/* Admin: all reviews */
router.get("/admin/reviews", adminAuth, (req, res) => {
  res.json(
    read("reviews").sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    ),
  );
});

/* Admin: approve */
router.put("/admin/reviews/:id/approve", adminAuth, (req, res) => {
  const reviews = read("reviews");
  const idx = reviews.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  reviews[idx].approved = true;
  write("reviews", reviews);
  res.json(reviews[idx]);
});

/* Admin: toggle feature on home */
router.put("/admin/reviews/:id/feature", adminAuth, (req, res) => {
  const reviews = read("reviews");
  const idx = reviews.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  reviews[idx].featuredOnHome = !reviews[idx].featuredOnHome;
  write("reviews", reviews);
  res.json(reviews[idx]);
});

/* Admin: delete */
router.delete("/admin/reviews/:id", adminAuth, async (req, res) => {
  let reviews = read("reviews");
  const rev = reviews.find((r) => r.id === req.params.id);
  if (!rev) return res.status(404).json({ error: "Not found" });
  if (rev.photo) await destroyByUrl(rev.photo);
  write(
    "reviews",
    reviews.filter((r) => r.id !== req.params.id),
  );
  res.json({ success: true });
});

module.exports = router;
