const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const { read, write } = require("../utils/db");
const { adminAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { notifyAdmin } = require("../utils/notify");
const { destroyByUrl } = require("../utils/cloudinary");

function fileUrl(f) {
  if (!f) return null;
  if (f.path && f.path.startsWith("http")) return f.path;
  return f.filename || f.path;
}

function safeParseJSON(val, fallback) {
  if (!val) return fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function parseSideChoiceEnabled(raw) {
  if (!raw) return false;
  if (raw.sideChoiceEnabled != null) {
    return raw.sideChoiceEnabled === true || raw.sideChoiceEnabled === "true";
  }
  return raw.detailSide === "left" || raw.detailSide === "right";
}

function publicProduct(p) {
  if (!p) return p;
  const { costPrice, internalNotes, supplierInfo, supplier, margin, ...rest } = p;
  // Also strip costPrice from variant objects
  if (Array.isArray(rest.variants)) {
    rest.variants = rest.variants.map((v) => {
      const { costPrice: _vc, ...safeVariant } = v;
      return safeVariant;
    });
  }
  return rest;
}

function normalizeProduct(raw) {
  const cats = raw.categories || [];
  const photos = raw.photos || [];
  return {
    ...raw,
    partOfSetId: raw.partOfSetId || null,
    roomGroupId: raw.roomGroupId || null,
    categories: Array.isArray(cats) ? cats : [],
    photos: Array.isArray(photos) ? photos : [],
    dimensions:
      raw.dimensions && typeof raw.dimensions === "object"
        ? {
            length: raw.dimensions.length ?? null,
            width: raw.dimensions.width ?? null,
            depth: raw.dimensions.depth ?? null,
            height: raw.dimensions.height ?? null,
            pieces: Array.isArray(raw.dimensions.pieces) ? raw.dimensions.pieces : [],
          }
        : { length: null, width: null, depth: null, height: null, pieces: [] },
    colors: Array.isArray(raw.colors) ? raw.colors : [],
    sizes: Array.isArray(raw.sizes) ? raw.sizes : [],
    variants: Array.isArray(raw.variants) ? raw.variants : null,
    costPrice: raw.costPrice != null && raw.costPrice !== "" && Number(raw.costPrice) > 0 ? Number(raw.costPrice) : null,
    price: raw.price != null ? Number(raw.price) : 0,
    featured: raw.featured === true,
    isNew: raw.isNew === true,
    bestSeller: raw.bestSeller === true,
    visible: raw.visible !== false,
    sideChoiceEnabled: parseSideChoiceEnabled(raw),
    sideChoiceType: raw.sideChoiceType || (parseSideChoiceEnabled(raw) ? "orientation" : "none"),
    sideOptions: Array.isArray(raw.sideOptions) ? raw.sideOptions : (raw.sideOptions ? safeParseJSON(raw.sideOptions, []) : (parseSideChoiceEnabled(raw) ? ["left", "right"] : [])),
    colorPhotos: raw.colorPhotos || {},
    sidePhotos: raw.sidePhotos || {},
    featuredInMarquee: raw.featuredInMarquee === true,
    addOns: Array.isArray(raw.addOns) ? raw.addOns : [],
  };
}



function categoryValues(category) {
  return [category.slug, category.id].filter(Boolean);
}

function expandCategorySelection(categories) {
  const selected = Array.isArray(categories) ? categories : [];
  const allCategories = read("categories") || [];
  const byValue = new Map();
  allCategories.forEach((category) => {
    categoryValues(category).forEach((value) => byValue.set(value, category));
  });
  const expanded = new Set(selected);
  selected.forEach((value) => {
    const category = byValue.get(value);
    if (!category || !category.parentId) return;
    const parent = allCategories.find((c) => c.id === category.parentId);
    if (parent) categoryValues(parent).forEach((value) => expanded.add(value));
  });
  return Array.from(expanded);
}

function categoryMatches(product, category) {
  const cats = product.categories || [];
  if (cats.includes(category)) return true;
  const allCategories = read("categories") || [];
  const selected = allCategories.find(
    (c) => c.slug === category || c.id === category,
  );
  if (!selected) return false;
  const allowed = new Set(categoryValues(selected));
  allCategories
    .filter((c) => c.parentId === selected.id)
    .forEach((child) => categoryValues(child).forEach((value) => allowed.add(value)));
  return cats.some((value) => allowed.has(value));
}

function applyDiscounts(products) {
  const now = new Date();
  const discounts = (read("discounts") || []).filter(
    (d) => d.active && (!d.expiresAt || new Date(d.expiresAt) >= now),
  );
  if (!discounts.length) return products;
  return products.map((p) => {
    const cats = p.categories || [];
    // Product-level discount (first priority)
    let disc = discounts.find(
      (d) => d.discountScope === "product" && d.productId === p.id
    );
    // Category-level discount (second priority)
    if (!disc) {
      disc = discounts.find(
        (d) =>
          (d.discountScope === "category" || !d.discountScope) &&
          categoryMatches(p, d.categoryId)
      );
    }
    if (!disc) return p;
    const originalPrice = p.price;
    const salePrice =
      disc.type === "percent"
        ? Math.round(originalPrice * (1 - disc.value / 100))
        : Math.max(0, originalPrice - disc.value);
    return {
      ...p,
      discountPercent: disc.type === "percent" ? disc.value : null,
      originalPrice,
      salePrice,
      discountLabel_ar: disc.label_ar || "",
      discountLabel_en: disc.label_en || "",
    };
  });
}

// Public: list products (with optional filters)
router.get("/products", (req, res) => {
  let products = applyDiscounts(
    read("products")
      .map((p) => normalizeProduct(p))
      .map(publicProduct),
  );
  const { category, search, sort, minPrice, maxPrice, color, featured } =
    req.query;

  products = products.filter((p) => p.visible !== false);
  if (req.query.marquee === "true")
    products = products.filter((p) => p.featuredInMarquee === true);
  if (featured === "true")
    products = products.filter((p) => p.featured === true);
  if (category && category !== "all") {
    products = products.filter((p) => categoryMatches(p, category));
  }
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(
      (p) =>
        (p.nameAr || "").includes(search) ||
        (p.nameEn || "").toLowerCase().includes(q) ||
        (p.descriptionEn || "").toLowerCase().includes(q) ||
        (p.descriptionAr || "").includes(search),
    );
  }
  if (minPrice != null && minPrice !== "") {
    const m = Number(minPrice);
    if (!Number.isNaN(m))
      products = products.filter((p) => (p.price || 0) >= m);
  }
  if (maxPrice != null && maxPrice !== "") {
    const m = Number(maxPrice);
    if (!Number.isNaN(m))
      products = products.filter((p) => (p.price || 0) <= m);
  }
  if (color) {
    const q = String(color).toLowerCase();
    products = products.filter((p) =>
      (p.colors || []).some(
        (c) =>
          String(c.name || "")
            .toLowerCase()
            .includes(q) ||
          String(c.nameEn || "")
            .toLowerCase()
            .includes(q) ||
          String(c.hex || "").toLowerCase() === q,
      ),
    );
  }
  if (sort === "price-asc")
    products.sort((a, b) => (a.price || 0) - (b.price || 0));
  else if (sort === "price-desc")
    products.sort((a, b) => (b.price || 0) - (a.price || 0));
  else
    products.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    );

  res.json(products);
});

// Similar products (prioritize roomGroupId, then same category, then popular)
router.get("/products/:id/similar", (req, res) => {
  const rawAll = read("products")
    .map((p) => normalizeProduct(p))
    .map(publicProduct)
    .filter((x) => x.visible !== false);
  const all = applyDiscounts(rawAll);
  const p = all.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: "Product not found" });

  let list = [];
  // 1. Priority: same roomGroupId
  if (p.roomGroupId) {
    list = all.filter((x) => x.id !== p.id && x.roomGroupId === p.roomGroupId);
  }

  // 2. Fallback: same category
  if (list.length < 4) {
    const cats = p.categories || [];
    const sameCat = all.filter(
      (x) =>
        x.id !== p.id &&
        !list.some((exist) => exist.id === x.id) &&
        (x.categories || []).some((c) => cats.includes(c) || cats.some((pc) => categoryMatches(x, pc))),
    );
    list = list.concat(sameCat);
  }

  // 3. General fallback: other products
  if (list.length < 4) {
    const remaining = all.filter(
      (x) => x.id !== p.id && !list.some((exist) => exist.id === x.id),
    );
    list = list.concat(remaining);
  }

  res.json(list.slice(0, 8));
});

// Public: single product (no cost)
router.get("/products/:id", (req, res) => {
  const product = read("products").find((x) => x.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  if (normalizeProduct(product).visible === false)
    return res.status(404).json({ error: "Product not found" });
  const reviews = read("reviews").filter(
    (r) => r.productId === product.id && r.approved,
  );
  const [withDisc] = applyDiscounts([publicProduct(normalizeProduct(product))]);
  
  const roomGroupId = withDisc.roomGroupId;
  let roomGroup = null;
  if (roomGroupId) {
    const allProducts = read("products").map(normalizeProduct).map(publicProduct);
    const otherProducts = applyDiscounts(
      allProducts.filter(p => p.id !== product.id && p.roomGroupId === roomGroupId && p.visible !== false)
    );
    const groups = read("roomGroups") || [];
    const groupLabel = groups.find(g => g.id === roomGroupId) || null;
    
    if (otherProducts.length > 0) {
      roomGroup = {
        id: roomGroupId,
        labelAr: groupLabel ? groupLabel.nameAr : "",
        labelEn: groupLabel ? groupLabel.nameEn : "",
        products: otherProducts
      };
    }
  }

  res.json({ ...withDisc, reviews, roomGroup });
});

// Admin: list all (includes cost, for dashboard)
router.get("/admin/products", adminAuth, (req, res) => {
  const list = read("products").map((p) => normalizeProduct(p));
  res.json(
    list.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0),
    ),
  );
});

// Admin: full product (includes cost)
router.get("/admin/products/:id", adminAuth, (req, res) => {
  const product = read("products").find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json(normalizeProduct(product));
});

function parseExtras(body, existing = {}) {
  let costPrice;
  if (body.costPrice !== undefined) {
    const rawVal = typeof body.costPrice === "string" ? body.costPrice.trim() : body.costPrice;
    costPrice = rawVal !== "" && rawVal != null && !isNaN(parseFloat(rawVal)) && parseFloat(rawVal) > 0
      ? parseFloat(rawVal)
      : null;
  } else {
    costPrice = existing.costPrice != null && existing.costPrice > 0 ? existing.costPrice : null;
  }
  const colors = safeParseJSON(body.colors, existing.colors || []);
  const sizes = safeParseJSON(body.sizes, existing.sizes || []);
  const variantsParsed = safeParseJSON(body.variants, undefined);
  const variants =
    variantsParsed !== undefined ? variantsParsed : (existing.variants ?? null);
  const dimensionsParsed = safeParseJSON(body.dimensions, undefined);
  const dimensions =
    dimensionsParsed !== undefined
      ? {
          length:
            dimensionsParsed.length != null
              ? parseFloat(dimensionsParsed.length)
              : null,
          width:
            dimensionsParsed.width != null
              ? parseFloat(dimensionsParsed.width)
              : null,
          depth:
            dimensionsParsed.depth != null
              ? parseFloat(dimensionsParsed.depth)
              : null,
          height:
            dimensionsParsed.height != null
              ? parseFloat(dimensionsParsed.height)
              : null,
          pieces: Array.isArray(dimensionsParsed.pieces)
            ? dimensionsParsed.pieces.map(p => ({
                nameEn: p.nameEn ? String(p.nameEn).trim() : "",
                nameAr: p.nameAr ? String(p.nameAr).trim() : "",
                length: p.length != null ? parseFloat(p.length) : null,
                width: p.width != null ? parseFloat(p.width) : null,
                depth: p.depth != null ? parseFloat(p.depth) : null,
                height: p.height != null ? parseFloat(p.height) : null,
              }))
            : []
        }
      : existing.dimensions ?? { length: null, width: null, depth: null, height: null, pieces: [] };

  /* Feature Banner */
  const featureBanner = (() => {
    try {
      const raw = body.featureBanner;
      if (!raw) return existing.featureBanner ?? null;
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch { return existing.featureBanner ?? null; }
  })();

  const sideChoiceType =
    body.sideChoiceType !== undefined
      ? body.sideChoiceType
      : (existing.sideChoiceType ?? "none");
  const sideOptions =
    body.sideOptions !== undefined
      ? safeParseJSON(body.sideOptions, [])
      : (existing.sideOptions ?? []);

  const colorPhotosParsed = safeParseJSON(body.colorPhotos, undefined);
  const colorPhotos = colorPhotosParsed !== undefined ? colorPhotosParsed : (existing.colorPhotos ?? null);

  const sidePhotosParsed = safeParseJSON(body.sidePhotos, undefined);
  const sidePhotos = sidePhotosParsed !== undefined ? sidePhotosParsed : (existing.sidePhotos ?? null);

  const addOnsParsed = safeParseJSON(body.addOns, undefined);
  const addOns = addOnsParsed !== undefined ? addOnsParsed : (existing.addOns ?? []);

  return {
    costPrice,
    colors: Array.isArray(colors) ? colors : [],
    sizes: Array.isArray(sizes) ? sizes : [],
    variants: Array.isArray(variants) ? variants : null,
    dimensions,
    featureBanner: featureBanner || null,
    sideChoiceType,
    sideOptions,
    colorPhotos: colorPhotos || {},
    sidePhotos: sidePhotos || {},
    addOns: Array.isArray(addOns) ? addOns : [],
  };
}

// Admin: create product
router.post(
  "/admin/products",
  adminAuth,
  upload.array("photos", 50),
  (req, res) => {
    const products = read("products");
    const {
      nameAr,
      nameEn,
      descriptionAr,
      descriptionEn,
      price,
      categories,
      sku,
      specStructureAr,
      specStructureEn,
      specFabricAr,
      specFabricEn,
      specFillingAr,
      specFillingEn,
      specDimensionsNoteAr,
      specDimensionsNoteEn,
      productCareAr,
      productCareEn,
    } = req.body;
    const photos = (req.files || []).map(fileUrl);
    const extras = parseExtras(req.body, {});

    const product = normalizeProduct({
      id: uuidv4(),
      nameAr: nameAr || "",
      nameEn: nameEn || "",
      sku: sku ? String(sku).trim().toUpperCase() : "",
      descriptionAr: descriptionAr || "",
      descriptionEn: descriptionEn || "",
      specStructureAr: specStructureAr || "",
      specStructureEn: specStructureEn || "",
      specFabricAr: specFabricAr || "",
      specFabricEn: specFabricEn || "",
      specFillingAr: specFillingAr || "",
      specFillingEn: specFillingEn || "",
      specDimensionsNoteAr: specDimensionsNoteAr || "",
      specDimensionsNoteEn: specDimensionsNoteEn || "",
      productCareAr: productCareAr || "",
      productCareEn: productCareEn || "",
      price: parseFloat(price) || 0,
      categories: expandCategorySelection(safeParseJSON(categories, [])),
      ...extras,
      photos,
      mainPhoto: photos[0] || null,
      featured: req.body.featured === "true" || req.body.featured === true,
      featuredInMarquee: req.body.featuredInMarquee === "true" || req.body.featuredInMarquee === true,
      isNew: req.body.isNew === "true" || req.body.isNew === true,
      bestSeller: req.body.bestSeller === "true" || req.body.bestSeller === true,
      visible: req.body.visible !== "false" && req.body.visible !== false,
      sideChoiceEnabled:
        req.body.sideChoiceEnabled === "true" ||
        req.body.sideChoiceEnabled === true,
      partOfSetId: req.body.partOfSetId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    products.push(product);

    write("products", products);
    res.status(201).json(product);
  },
);

// Admin: update product
router.put(
  "/admin/products/:id",
  adminAuth,
  upload.array("photos", 50),
  (req, res) => {
    const products = read("products");
    const idx = products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });

    const cur = normalizeProduct(products[idx]);
    const {
      nameAr,
      nameEn,
      descriptionAr,
      descriptionEn,
      price,
      categories,
      sku,
      mainPhoto,
      keepPhotos,
      specStructureAr,
      specStructureEn,
      specFabricAr,
      specFabricEn,
      specFillingAr,
      specFillingEn,
      specDimensionsNoteAr,
      specDimensionsNoteEn,
      productCareAr,
      productCareEn,
    } = req.body;
    const newPhotos = (req.files || []).map(fileUrl);
    const existingPhotos = safeParseJSON(keepPhotos, cur.photos || []);
    const allPhotos = [...existingPhotos, ...newPhotos];
    const extras = parseExtras(req.body, cur);

    products[idx] = {
      ...cur,
      nameAr: nameAr ?? cur.nameAr,
      nameEn: nameEn ?? cur.nameEn,
      sku: sku != null ? String(sku).trim().toUpperCase() : cur.sku || "",
      descriptionAr: descriptionAr ?? cur.descriptionAr,
      descriptionEn: descriptionEn ?? cur.descriptionEn,
      specStructureAr: specStructureAr !== undefined ? specStructureAr : cur.specStructureAr || "",
      specStructureEn: specStructureEn !== undefined ? specStructureEn : cur.specStructureEn || "",
      specFabricAr: specFabricAr !== undefined ? specFabricAr : cur.specFabricAr || "",
      specFabricEn: specFabricEn !== undefined ? specFabricEn : cur.specFabricEn || "",
      specFillingAr: specFillingAr !== undefined ? specFillingAr : cur.specFillingAr || "",
      specFillingEn: specFillingEn !== undefined ? specFillingEn : cur.specFillingEn || "",
      specDimensionsNoteAr: specDimensionsNoteAr !== undefined ? specDimensionsNoteAr : cur.specDimensionsNoteAr || "",
      specDimensionsNoteEn: specDimensionsNoteEn !== undefined ? specDimensionsNoteEn : cur.specDimensionsNoteEn || "",
      productCareAr: productCareAr !== undefined ? productCareAr : cur.productCareAr || "",
      productCareEn: productCareEn !== undefined ? productCareEn : cur.productCareEn || "",
      price: price !== undefined ? parseFloat(price) : cur.price,
      categories: categories
          ? expandCategorySelection(safeParseJSON(categories, cur.categories))
          : expandCategorySelection(cur.categories),
      ...extras,
      photos: allPhotos,
      mainPhoto: mainPhoto || allPhotos[0] || null,
      featured:
        req.body.featured !== undefined
          ? req.body.featured === "true" || req.body.featured === true
          : cur.featured === true,
      featuredInMarquee:
        req.body.featuredInMarquee !== undefined
          ? req.body.featuredInMarquee === "true" || req.body.featuredInMarquee === true
          : cur.featuredInMarquee === true,
      isNew:
        req.body.isNew !== undefined
          ? req.body.isNew === "true" || req.body.isNew === true
          : cur.isNew === true,
      bestSeller:
        req.body.bestSeller !== undefined
          ? req.body.bestSeller === "true" || req.body.bestSeller === true
          : cur.bestSeller === true,
      visible:
        req.body.visible !== undefined
          ? req.body.visible === "true" || req.body.visible === true
          : cur.visible !== false,
      sideChoiceEnabled:
        req.body.sideChoiceEnabled !== undefined
          ? req.body.sideChoiceEnabled === "true" ||
            req.body.sideChoiceEnabled === true
          : cur.sideChoiceEnabled === true,
      partOfSetId: req.body.partOfSetId !== undefined ? (req.body.partOfSetId || null) : cur.partOfSetId,
      updatedAt: new Date().toISOString(),
    };
    write("products", products);
    res.json(products[idx]);
  },
);

// Admin: reorder gallery
router.patch("/admin/products/:id/photos-order", adminAuth, (req, res) => {
  const products = read("products");
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const order = req.body.photos;
  if (!Array.isArray(order))
    return res.status(400).json({ error: "photos array required" });
  const cur = new Set(products[idx].photos || []);
  const next = order.filter((f) => cur.has(f));
  products[idx].photos.forEach((f) => {
    if (!next.includes(f)) next.push(f);
  });
  products[idx].photos = next;
  if (!next.includes(products[idx].mainPhoto))
    products[idx].mainPhoto = next[0] || null;
  products[idx].updatedAt = new Date().toISOString();
  write("products", products);
  res.json(products[idx]);
});

// Admin: delete product
router.delete("/admin/products/:id", adminAuth, async (req, res) => {
  let products = read("products");
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Not found" });

  await Promise.all((product.photos || []).map((url) => destroyByUrl(url)));

  write(
    "products",
    products.filter((p) => p.id !== req.params.id),
  );
  res.json({ success: true });
});

// Admin: delete a single photo (url passed in body to avoid slash issues)
router.delete("/admin/products/:id/photo", adminAuth, async (req, res) => {
  const products = read("products");
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const { url } = req.body;
  await destroyByUrl(url);

  products[idx].photos = (products[idx].photos || []).filter((p) => p !== url);
  if (products[idx].mainPhoto === url) {
    products[idx].mainPhoto = products[idx].photos[0] || null;
  }
  products[idx].updatedAt = new Date().toISOString();
  write("products", products);
  res.json(products[idx]);
});

// Admin: set main photo
router.patch("/admin/products/:id/main-photo", adminAuth, (req, res) => {
  const products = read("products");
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  products[idx].mainPhoto = req.body.mainPhoto;
  products[idx].updatedAt = new Date().toISOString();
  write("products", products);
  res.json(products[idx]);
});

// Admin: upload a single photo (for color images)
router.post(
  "/admin/upload-photo",
  adminAuth,
  upload.single("photo"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ url: fileUrl(req.file) });
  },
);

// Room groups lookup routes
router.get("/room-groups", (req, res) => {
  res.json(read("roomGroups") || []);
});

router.get("/room-groups/:id", (req, res) => {
  const groups = read("roomGroups") || [];
  const g = groups.find(x => x.id === req.params.id);
  if (!g) return res.status(404).json({ error: "Room group not found" });
  res.json(g);
});

module.exports = router;
