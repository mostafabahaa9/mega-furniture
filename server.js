require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");
const { ready: dbReady } = require("./utils/db");

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3001;

// Additional Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

// Prevent Parameter Pollution
app.use(hpp());

// Prevent NoSQL Injection / Operator Injection
app.use(mongoSanitize());

// Force HTTPS in production environment
app.use((req, res, next) => {
  if (
    process.env.NODE_ENV === "production" &&
    req.headers["x-forwarded-proto"] !== "https"
  ) {
    return res.redirect(301, "https://" + req.headers.host + req.url);
  }
  next();
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// CORS setup
const defaultOrigins = [
  "https://mega-furniture-production.up.railway.app",
  "https://www.megafurnitures.com",
  "https://megafurnitures.com",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

const envOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));
const localDevOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || origin === "null") return cb(null, true);
      if (allowedOrigins.includes("*")) return cb(null, true);
      if (allowedOrigins.some((o) => origin === o))
        return cb(null, true);
      if (process.env.CORS_STRICT_LOCAL !== "1" && localDevOrigin.test(origin))
        return cb(null, true);
      cb(new Error(`CORS: ${origin} not allowed`));
    },
    credentials: true,
  }),
);

// Body Parser Limit
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate Limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests, please try again later" },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many login attempts, try again in 15 minutes" },
});

// Apply Rate Limiters
app.use("/api", generalLimiter);
app.use("/api/orders", strictLimiter);
app.use("/api/reviews", strictLimiter);
app.use("/api/custom-orders", strictLimiter);
app.use("/admin/login", loginLimiter);
app.use("/api/admin/login", loginLimiter);

// Input Sanitization Middleware (XSS prevention)
function sanitizeInput(obj) {
  if (!obj || typeof obj !== "object") return obj;
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === "string") {
      obj[key] = obj[key]
        .replace(/<script[^>]*>.*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, (match) => {
          if (/script|iframe|object|embed|style/i.test(match)) return "";
          return match;
        })
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "")
        .trim();
    } else if (typeof obj[key] === "object") {
      sanitizeInput(obj[key]);
    }
  });
  return obj;
}

app.use((req, res, next) => {
  if (req.body) sanitizeInput(req.body);
  if (req.query) sanitizeInput(req.query);
  next();
});


  // Clean URL 301 Redirects
  app.use((req, res, next) => {
    // Exact match for the old root HTML
    if (req.path === '/mega-furniture.html') {
      const q = Object.keys(req.query).length ? '?' + (req.url.split('?')[1] || '') : '';
      return res.redirect(301, '/' + q);
    }
    // Match /pages/something.html
    if (req.path.startsWith('/pages/') && req.path.endsWith('.html')) {
      const cleanPath = req.path.replace('/pages/', '/').replace('.html', '');
      const q = Object.keys(req.query).length ? '?' + (req.url.split('?')[1] || '') : '';
      return res.redirect(301, cleanPath + q);
    }
    next();
  });

  // Static assets
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/logos", express.static(path.join(__dirname, "logos")));
app.use("/pages", express.static(path.join(__dirname, "pages")));

// Frontend Pages

  const cleanPages = ['shop', 'offers', 'bundle', 'about', 'contact', 'checkout', 'reviews', 'videos', 'custom-work', 'track', 'terms', 'policies'];
  cleanPages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
      res.sendFile(path.join(__dirname, "pages", `${page}.html`));
    });
  });

app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "mega-furniture.html")),
);

app.get("/admin", (req, res) =>
  res.sendFile(path.join(__dirname, "admin.html")),
);

// ── SEO: robots.txt ──
app.get("/robots.txt", (req, res) => {
  res.sendFile(path.join(__dirname, "robots.txt"));
});

// ── SEO: Dynamic sitemap.xml ──
app.get("/sitemap.xml", (req, res) => {
  const { read } = require("./utils/db");
  const BASE = "https://www.megafurnitures.com";
  const staticPages = [
    "/", "/shop", "/offers", "/about",
    "/contact", "/videos", "/reviews",
    "/custom-work", "/bundle", "/track", "/terms", "/policies",
  ];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  staticPages.forEach((p) => {
    xml += `  <url><loc>${BASE}${p}</loc></url>\n`;
  });
  const products = read("products") || [];
  products.forEach((p) => {
    if (p.id) xml += `  <url><loc>${BASE}/product?id=${p.id}</loc></url>\n`;
  });
  const bundles = read("bundles") || [];
  bundles.forEach((b) => {
    if (b.id) xml += `  <url><loc>${BASE}/bundle?id=${b.id}</loc></url>\n`;
  });
  xml += `</urlset>`;
  res.set("Content-Type", "application/xml");
  res.send(xml);
});

// ── SEO: Server-side rendered product page (OG tags for social crawlers) ──
app.get("/product", (req, res) => {
    const id = req.query.id;
    if (!id) return res.sendFile(path.join(__dirname, "pages/product.html"));
  const { read } = require("./utils/db");
  const product = (read("products") || []).find((p) => p.id === id);
  if (!product) {
    return res.sendFile(path.join(__dirname, "pages/product.html"));
  }
  const name = product.nameEn || product.nameAr || "Product";
  const desc = (product.descriptionEn || product.descriptionAr || "Premium furniture by Mega Furniture").substring(0, 200);
  const price = product.salePrice || product.price || 0;
  const image = product.mainPhoto
    ? (product.mainPhoto.startsWith("http") ? product.mainPhoto : `https://www.megafurnitures.com/uploads/${product.mainPhoto}`)
    : "";
  const url = `https://www.megafurnitures.com/product?id=${id}`;
  const inStock = product.stock !== 0;

  const ogTags = `
    <meta property="og:type" content="product" />
    <meta property="og:title" content="${name} | Mega Furniture" />
    <meta property="og:description" content="${desc.replace(/"/g, '&quot;')}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:site_name" content="Mega Furniture" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${name} | Mega Furniture" />
    <meta name="twitter:description" content="${desc.replace(/"/g, '&quot;')}" />
    <meta name="twitter:image" content="${image}" />`;

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: name,
    image: image ? [image] : [],
    description: desc,
    brand: { "@type": "Brand", name: "Mega Furniture" },
    offers: {
      "@type": "Offer",
      url: url,
      priceCurrency: "EGP",
      price: price,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  });

  let html = fs.readFileSync(path.join(__dirname, "pages/product.html"), "utf8");
  // Inject OG tags right after <meta charset>
  html = html.replace(
    '<meta charset="UTF-8" />',
    `<meta charset="UTF-8" />${ogTags}`
  );
  // Replace generic title
  html = html.replace(
    "<title>Mega Furniture | Product Details</title>",
    `<title>${name} | Mega Furniture</title>`
  );
  // Inject JSON-LD before </head>
  html = html.replace(
    "</head>",
    `<script type="application/ld+json">${jsonLd}</script>\n  </head>`
  );
  res.send(html);
});


// API Routes
app.use("/api", require("./routes/discounts"));
app.use("/api", require("./routes/coupons"));
app.use("/api", require("./routes/shipping"));
app.use("/api", require("./routes/reports"));
app.use("/api", require("./routes/products"));
app.use("/api", require("./routes/categories"));
app.use("/api", require("./routes/orders"));
app.use("/api", require("./routes/meta"));
app.use("/api", require("./routes/visits"));
app.use("/api", require("./routes/reviews"));
app.use("/api", require("./routes/customOrders"));
app.use("/api", require("./routes/videos"));
app.use("/api", require("./routes/collections"));
app.use("/api", require("./routes/bundles"));
app.use("/api", require("./routes/colors"));
app.use("/api", require("./routes/banners"));
app.use("/admin", require("./routes/banners"));
app.use("/api", require("./routes/promoBanners"));
app.use("/api", require("./routes/offersBanners"));
app.use("/api", require("./routes/shopTheLook"));
app.use("/api", require("./routes/announcement"));
app.use("/api", require("./routes/admin"));

// Settings route
app.get("/api/settings", (req, res) => {
  try {
    const settingsPath = path.join(__dirname, "data", "settings.json");
    const raw = fs.readFileSync(settingsPath, "utf-8");
    const settings = JSON.parse(raw);
    res.json({
      defaultLanguage: settings.defaultLanguage || "en",
      defaultTheme: settings.defaultTheme || "light",
    });
  } catch {
    res.json({ defaultLanguage: "en", defaultTheme: "light" });
  }
});

app.get("/health", (req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() }),
);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Global Error Handler — Hide stack traces in production
app.use((err, req, res, next) => {
  console.error("[api-error]", err.stack || err);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error:
          "Too many photos uploaded at once or invalid field name. Please upload up to 50 photos.",
      });
    }
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "One of the uploaded photos exceeds the 8MB size limit.",
      });
    }
    return res.status(400).json({ error: err.message || "File upload error" });
  }

  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message || "Server error",
  });
});

dbReady
  .then(() => {
    app.listen(PORT, () => console.log(`Mega Furniture API on port ${PORT}`));
  })
  .catch((err) => {
    console.error("[startup] DB init failed, starting anyway:", err.message);
    app.listen(PORT, () => console.log(`Mega Furniture API on port ${PORT}`));
  });
