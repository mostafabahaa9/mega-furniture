<!-- ═══════════════════════════════════════════════════════════════ -->
<!--                  MEGA FURNITURE  ·  README.md                 -->
<!-- ═══════════════════════════════════════════════════════════════ -->

<div align="center">

```
███╗   ███╗███████╗ ██████╗  █████╗
████╗ ████║██╔════╝██╔════╝ ██╔══██╗
██╔████╔██║█████╗  ██║  ███╗███████║
██║╚██╔╝██║██╔══╝  ██║   ██║██╔══██║
██║ ╚═╝ ██║███████╗╚██████╔╝██║  ██║
╚═╝     ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝

███████╗██╗   ██╗██████╗ ███╗   ██╗██╗████████╗██╗   ██╗██████╗ ███████╗
██╔════╝██║   ██║██╔══██╗████╗  ██║██║╚══██╔══╝██║   ██║██╔══██╗██╔════╝
█████╗  ██║   ██║██████╔╝██╔██╗ ██║██║   ██║   ██║   ██║██████╔╝█████╗
██╔══╝  ██║   ██║██╔══██╗██║╚██╗██║██║   ██║   ██║   ██║██╔══██╗██╔══╝
██║     ╚██████╔╝██║  ██║██║ ╚████║██║   ██║   ╚██████╔╝██║  ██║███████╗
╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝
```

### 🛋️ _Premium Furniture, Delivered to Your Door_

[![Node.js](https://img.shields.io/badge/Node.js-≥18.0.0-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media_CDN-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com)
[![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app)

</div>

---

## ◈ What is Mega Furniture?

> **Mega Furniture** is a full-stack Egyptian e-commerce platform built for premium furniture retail.
> It combines a feature-rich customer-facing storefront with a powerful admin dashboard — all powered by a secure, production-hardened Node.js/Express API backed by PostgreSQL.

The platform handles everything from product browsing and custom order requests, to order tracking, coupon management, payment integration, and automated email notifications — all in one unified system.

---

## ◈ Table of Contents

```
  ╔══════════════════════════════════════╗
  ║  1. Architecture Overview            ║
  ║  2. Feature Highlights               ║
  ║  3. Tech Stack                       ║
  ║  4. Project Structure                ║
  ║  5. API Reference                    ║
  ║  6. Security Model                   ║
  ║  7. Environment Setup                ║
  ║  8. Running Locally                  ║
  ║  9. Deployment (Railway)             ║
  ╚══════════════════════════════════════╝
```

---

## ◈ 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌──────────────────────┐   ┌──────────────────────────────┐   │
│  │  mega-furniture.html │   │        admin.html            │   │
│  │  (Customer Store)    │   │    (Admin Dashboard)         │   │
│  └──────────┬───────────┘   └──────────────┬───────────────┘   │
│             │ /pages/*.html                │ /admin            │
└─────────────┼──────────────────────────────┼───────────────────┘
              │                              │
┌─────────────▼──────────────────────────────▼───────────────────┐
│                    EXPRESS SERVER  (server.js)                  │
│  ┌───────────┐ ┌──────────────┐ ┌────────────┐ ┌────────────┐  │
│  │  Helmet   │ │ Rate Limiter │ │    CORS    │ │ XSS Guard  │  │
│  └───────────┘ └──────────────┘ └────────────┘ └────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    API ROUTES  /api/*                   │   │
│  │  products │ categories │ orders │ reviews │ coupons     │   │
│  │  shipping │ custom-orders │ videos │ bundles │ colors   │   │
│  │  collections │ banners │ discounts │ reports │ visits   │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
 ┌──────────┐         ┌──────────┐        ┌──────────────┐
 │PostgreSQL│         │Cloudinary│        │  Brevo Email │
 │(Primary  │         │ (Images/ │        │    (SMTP)    │
 │  Store)  │         │ Videos)  │        └──────────────┘
 └──────────┘         └──────────┘
       │
 ┌─────▼──────┐
 │  JSON Cache│  ← In-memory + local file fallback
 │  (data/*.  │
 │    json)   │
 └────────────┘
```

---

## ◈ 2. Feature Highlights

### 🛍️ Customer-Facing Storefront

| Feature | Description |
|---|---|
| **Product Catalog** | Browse products with filtering by category, color, price range |
| **Product Detail** | Full image gallery, video previews, size/color variants, reviews |
| **Shopping Cart** | Client-side cart with real-time total calculation |
| **Checkout** | Multi-step checkout with coupon/discount support |
| **Order Tracking** | Track orders by order ID with live status updates |
| **Custom Orders** | Submit custom furniture requests with reference images |
| **Reviews** | Leave verified reviews with star ratings |
| **Videos Gallery** | Embedded product videos and showroom tours |
| **About / Contact** | Store info, WhatsApp integration |
| **Terms of Service** | Full legal terms page |

### 🔧 Admin Dashboard

| Module | Capabilities |
|---|---|
| **Products** | Create/edit/delete products, bulk image upload (up to 50 photos), set colors/sizes/categories |
| **Categories** | Hierarchical category management |
| **Orders** | View all orders, update status (Pending → Confirmed → Shipped → Delivered), export to Excel |
| **Custom Orders** | Manage bespoke furniture requests, communicate with customers |
| **Coupons** | Create/expire discount coupons with usage limits |
| **Discounts** | Bulk price discounts per category |
| **Collections** | Curated product groupings (e.g., "Summer Sale") |
| **Bundles** | Multi-product set deals |
| **Colors** | Manage color palette used across products |
| **Banners** | Homepage promotional banner management |
| **Videos** | Upload & manage showroom/product videos |
| **Reviews** | Moderate customer reviews |
| **Shipping** | Configure shipping rates and zones |
| **Reports** | Sales analytics, revenue breakdown, export reports |
| **Announcements** | Site-wide notification banner control |
| **Visit Tracking** | Daily/weekly visitor statistics |

---

## ◈ 3. Tech Stack

```
╔══════════════════════╦══════════════════════════════════════╗
║ Layer                ║ Technology                           ║
╠══════════════════════╬══════════════════════════════════════╣
║ Runtime              ║ Node.js >= 18.0.0                    ║
║ Framework            ║ Express 4.x                          ║
║ Database             ║ PostgreSQL (via `pg` pool)           ║
║ ORM / Query          ║ Raw SQL with in-memory JSON cache    ║
║ Image Storage        ║ Cloudinary (multer-storage-cloud)    ║
║ Email                ║ Brevo (formerly Sendinblue) REST API ║
║ Auth                 ║ JWT (jsonwebtoken) + bcrypt          ║
║ Payments             ║ Kashier + Paymob payment gateways   ║
║ File Upload          ║ Multer (local) + Cloudinary CDN      ║
║ Excel Export         ║ ExcelJS                              ║
║ Scraping / PDF       ║ Playwright + jsdom                   ║
║ Security             ║ Helmet, hpp, express-mongo-sanitize  ║
║ Rate Limiting        ║ express-rate-limit                   ║
║ Deployment           ║ Railway (Nixpacks build)             ║
║ Dev Server           ║ Nodemon                              ║
╚══════════════════════╩══════════════════════════════════════╝
```

---

## ◈ 4. Project Structure

```
mega-furniture/
│
├── 📄 server.js                  ← App entry point, middleware, route mounting
├── 📄 package.json               ← Dependencies & scripts
├── 📄 railway.toml               ← Railway deployment config
├── 📄 nodemon.json               ← Dev watcher config
│
├── 📁 routes/                    ← All API route handlers
│   ├── admin.js                  ← Admin auth & management
│   ├── products.js               ← Product CRUD + image upload
│   ├── categories.js             ← Category tree management
│   ├── orders.js                 ← Order lifecycle management
│   ├── customOrders.js           ← Custom furniture requests
│   ├── reviews.js                ← Product reviews
│   ├── coupons.js                ← Discount coupons
│   ├── discounts.js              ← Bulk discounts
│   ├── shipping.js               ← Shipping configuration
│   ├── reports.js                ← Analytics & exports
│   ├── videos.js                 ← Video management
│   ├── collections.js            ← Product collections
│   ├── bundles.js                ← Product bundles/sets
│   ├── colors.js                 ← Color definitions
│   ├── banners.js                ← Homepage banners
│   ├── announcement.js           ← Site announcements
│   └── visits.js                 ← Visit tracking
│
├── 📁 middleware/                ← Reusable Express middleware
│   ├── auth.js                   ← JWT admin authentication guard
│   ├── upload.js                 ← Multer + Cloudinary image uploader
│   └── videoUpload.js            ← Multer video file handler
│
├── 📁 utils/                     ← Core utilities
│   ├── db.js                     ← PostgreSQL pool + JSON cache layer
│   ├── mail.js                   ← Brevo email sender
│   ├── notify.js                 ← Notification helpers
│   └── cloudinary.js             ← Cloudinary SDK setup
│
├── 📁 pages/                     ← Frontend HTML pages (served as static)
│   ├── shop.html                 ← Product listing & filtering
│   ├── product.html              ← Single product detail
│   ├── checkout.html             ← Cart & checkout flow
│   ├── track.html                ← Order tracking
│   ├── reviews.html              ← Customer reviews
│   ├── custom-work.html          ← Custom order submission
│   ├── videos.html               ← Video gallery
│   ├── about.html                ← About the store
│   ├── contact.html              ← Contact page
│   ├── terms.html                ← Terms of service
│   └── header.js                 ← Shared header component (JS)
│
├── 📁 data/                      ← JSON seed files & persistent fallback
├── 📁 uploads/                   ← Local upload buffer (before Cloudinary)
├── 📁 logos/                     ← Static brand assets
│
├── 📄 mega-furniture.html        ← Main storefront homepage
├── 📄 admin.html                 ← Admin SPA dashboard
│
├── 📄 .env                       ← Secret environment variables (not committed)
└── 📄 .env.example               ← Environment variable template
```

---

## ◈ 5. API Reference

All API endpoints are prefixed with `/api`.

### 🔐 Authentication
```
POST   /api/admin/login              ← Admin login (rate-limited: 5/15min)
```

### 📦 Products
```
GET    /api/products                 ← List all products
GET    /api/products/:id             ← Get single product
POST   /api/products                 ← Create product [AUTH]
PUT    /api/products/:id             ← Update product [AUTH]
DELETE /api/products/:id             ← Delete product [AUTH]
POST   /api/products/:id/images      ← Upload product images [AUTH]
```

### 🗂️ Categories
```
GET    /api/categories               ← Get all categories
POST   /api/categories               ← Create category [AUTH]
PUT    /api/categories/:id           ← Update category [AUTH]
DELETE /api/categories/:id           ← Delete category [AUTH]
```

### 🛒 Orders
```
POST   /api/orders                   ← Place a new order (rate-limited)
GET    /api/orders                   ← List all orders [AUTH]
GET    /api/orders/:id               ← Get order detail [AUTH]
PUT    /api/orders/:id/status        ← Update order status [AUTH]
GET    /api/orders/track/:trackId    ← Public order tracking
```

### ✏️ Custom Orders
```
POST   /api/custom-orders            ← Submit custom furniture request
GET    /api/custom-orders            ← List all custom orders [AUTH]
PUT    /api/custom-orders/:id        ← Update custom order [AUTH]
```

### ⭐ Reviews
```
GET    /api/reviews                  ← Get all reviews
POST   /api/reviews                  ← Submit a review (rate-limited)
DELETE /api/reviews/:id              ← Delete review [AUTH]
```

### 🏷️ Coupons & Discounts
```
GET    /api/coupons                  ← List coupons [AUTH]
POST   /api/coupons                  ← Create coupon [AUTH]
POST   /api/coupons/validate         ← Validate a coupon code
DELETE /api/coupons/:id              ← Delete coupon [AUTH]

GET    /api/discounts                ← Get active discounts
POST   /api/discounts                ← Set discount [AUTH]
```

### 🚚 Shipping
```
GET    /api/shipping                 ← Get shipping configuration
PUT    /api/shipping                 ← Update shipping rates [AUTH]
```

### 📊 Reports
```
GET    /api/reports                  ← Sales analytics [AUTH]
GET    /api/reports/export           ← Export to Excel [AUTH]
```

### 🎨 Other Resources
```
GET/POST/DELETE  /api/collections    ← Product collections
GET/POST/DELETE  /api/bundles        ← Product bundles
GET/POST/DELETE  /api/colors         ← Color palette
GET/POST/DELETE  /api/banners        ← Homepage banners
GET/POST/DELETE  /api/videos         ← Product/showroom videos
GET/PUT          /api/announcement   ← Site-wide announcement banner
POST             /api/visits         ← Log a page visit
GET              /api/settings       ← Language & theme defaults
GET              /health             ← Health check endpoint
```

---

## ◈ 6. Security Model

Mega Furniture implements a defense-in-depth security strategy:

```
  ┌─────────────────────────────────────────────────┐
  │              SECURITY LAYERS                    │
  │                                                 │
  │  🔒 HTTPS Redirect       (production only)      │
  │  🛡️  Helmet               (HTTP security headers)│
  │  🚫 HPP                  (param pollution guard) │
  │  🧹 Mongo Sanitize       (NoSQL injection block) │
  │  ⚡ Rate Limiting        (DDoS / brute-force)    │
  │       • General: 100 req / 15 min               │
  │       • Orders/Reviews: 20 req / 1 hour         │
  │       • Admin Login: 5 attempts / 15 min        │
  │  🧼 XSS Input Sanitizer  (script tag stripper)  │
  │  🔑 JWT Auth             (admin route guard)    │
  │  🔐 bcrypt               (password hashing)     │
  │  📏 Body Limit           (10MB max payload)     │
  └─────────────────────────────────────────────────┘
```

---

## ◈ 7. Environment Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
# ─── Server ──────────────────────────────────────────────
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/dbname

# ─── Auth ────────────────────────────────────────────────
JWT_SECRET=change-this-to-a-very-long-random-secret-string
ADMIN_SECRET_TOKEN=generate-a-strong-random-64-character-token

# ─── CORS ────────────────────────────────────────────────
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# ─── Communications ──────────────────────────────────────
WHATSAPP_NUMBER=201040454343
BREVO_API_KEY=your_brevo_api_key
SMTP_FROM=Mega Furniture <noreply@megafurniture.com>

# ─── Cloudinary (Image CDN) ──────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ─── Payment Gateways ────────────────────────────────────
KASHIER_API_KEY=your_kashier_api_key
KASHIER_IFRAME_SECRET=your_kashier_iframe_secret
PAYMOB_SECRET_KEY=your_paymob_secret_key
PAYMOB_PUBLIC_KEY=your_paymob_public_key
PAYMOB_HMAC_SECRET=your_paymob_hmac_secret
PAYMOB_INTEGRATION_ID=your_paymob_integration_id
```

---

## ◈ 8. Running Locally

### Prerequisites

- **Node.js** `>= 18.0.0`
- **PostgreSQL** running instance (or use the JSON-only fallback mode)

### Install & Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/mega-furniture.git
cd mega-furniture

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
#  → Edit .env with your actual credentials

# 4. Start development server (with hot reload)
npm run dev

# ─── OR ───

# 5. Start production server
npm start
```

The server will start on `http://localhost:3001`

| URL | Description |
|---|---|
| `http://localhost:3001/` | Customer storefront |
| `http://localhost:3001/admin` | Admin dashboard |
| `http://localhost:3001/health` | Health check |

> **💡 Tip:** If no `DATABASE_URL` is set, the app gracefully falls back to local JSON files in `/data` as its data store.

---

## ◈ 9. Deployment (Railway)

This project is pre-configured for **Railway** via `railway.toml`:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node server.js"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

### Deploy Steps

```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login and link project
railway login
railway link

# 3. Set environment variables in Railway dashboard
#    (or use: railway variables set KEY=VALUE)

# 4. Deploy
railway up
```

> ✅ Railway will automatically provision a **PostgreSQL** addon — just link it and the `DATABASE_URL` will be injected automatically.

---

## ◈ Data Persistence Strategy

```
         Write Request
               │
    ┌──────────▼──────────┐
    │   In-Memory Cache   │  ← Instant reads (O(1))
    └──────────┬──────────┘
               │ async write
    ┌──────────▼──────────┐
    │   data/*.json       │  ← Local file backup
    └──────────┬──────────┘
               │ async upsert
    ┌──────────▼──────────┐
    │   PostgreSQL        │  ← Durable primary store
    │  (store_data table) │    (key/JSONB value pairs)
    └─────────────────────┘
```

On startup: PostgreSQL → Cache → JSON seed files (only for missing keys).
This means the app works even without a database connection.

---

## ◈ License

```
MIT License — © 2026 Mega Furniture
Built with ❤️ in Egypt 🇪🇬
```

---

<div align="center">

```
  ┌─────────────────────────────────────────┐
  │  🛋️  Premium Furniture, Premium Code    │
  │       megafurniture.com                 │
  └─────────────────────────────────────────┘
```

</div>
