const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const DEFAULTS = {
  products: [],
  categories: [],
  orders: [],
  visits: [],
  reviews: [],
  coupons: [],
  shipping: [],
  videos: [],
  settings: {},
  customOrders: [],
  admin: null,
  customerMeta: {},
  banners: [],
  colors: [],
  sets: [],
  roomGroups: [],
};

const cache = {};
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── helpers ──────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isPopulated(val) {
  if (val === null || val === undefined) return false;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === "object") return Object.keys(val).length > 0;
  return true;
}

// ── Populate cache from PostgreSQL, seed from JSON files on first run ──
const ready = (async () => {
  let pgOk = false;
  const MAX_RETRIES = 3;
  const BACKOFF = [1000, 2000, 4000]; // 1s, 2s, 4s

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS store_data (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL
        )
      `);
      const { rows } = await pool.query("SELECT key, value FROM store_data");
      for (const row of rows) cache[row.key] = row.value;
      pgOk = true;
      console.log(`[db] Postgres connected — loaded ${rows.length} key(s) from store_data`);
      break;
    } catch (err) {
      console.error(
        `[db] Postgres attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`,
      );
      if (attempt < MAX_RETRIES) {
        const delay = BACKOFF[attempt - 1];
        console.log(`[db] Retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        console.error(
          "[db] All Postgres retries exhausted — proceeding with local JSON fallback only (pgOk=false)",
        );
      }
    }
  }

  // Only seed MISSING keys from JSON data files (never overwrite existing DB data)
  const DATA_DIR = path.join(__dirname, "../data");
  if (fs.existsSync(DATA_DIR)) {
    for (const file of fs
      .readdirSync(DATA_DIR)
      .filter((f) => f.endsWith(".json"))) {
      const key = file.replace(".json", "");
      if (cache[key] !== undefined) continue;
      try {
        const val = JSON.parse(
          fs.readFileSync(path.join(DATA_DIR, file), "utf8"),
        );
        cache[key] = val;
        if (pgOk) {
          await pool.query(
            "INSERT INTO store_data(key,value) VALUES($1,$2) ON CONFLICT DO NOTHING",
            [key, JSON.stringify(val)],
          );
        }
      } catch (err) {
        console.error(
          `[db] Failed to seed "${key}" from ${file}: ${err.message}`,
        );
      }
    }
  }

  // ── Startup summary ──────────────────────────────────────────────
  console.log("[db] ── Startup data summary ──");
  for (const key of Object.keys(DEFAULTS)) {
    const val = cache[key];
    const status = isPopulated(val)
      ? Array.isArray(val)
        ? `✓ ${val.length} item(s)`
        : typeof val === "object"
          ? `✓ ${Object.keys(val).length} key(s)`
          : "✓ set"
      : "✗ EMPTY (using default)";
    console.log(`[db]   ${key.padEnd(16)} ${status}`);
  }
  console.log(`[db] ── pgOk=${pgOk} ──`);

  // ── Admin account warning ────────────────────────────────────────
  if (
    !isPopulated(cache.admin) &&
    !process.env.ADMIN_DEFAULT_USERNAME &&
    !process.env.ADMIN_DEFAULT_PASSWORD
  ) {
    console.error(
      "╔════════════════════════════════════════════════════════════════╗\n" +
      "║  ⚠  WARNING: NO ADMIN ACCOUNT EXISTS                        ║\n" +
      "║  cache.admin is empty/null AND ADMIN_DEFAULT_USERNAME /      ║\n" +
      "║  ADMIN_DEFAULT_PASSWORD env vars are not set.                ║\n" +
      "║  Admin login will return 503 until this is resolved.         ║\n" +
      "║  Fix: set env vars or seed data/admin.json                  ║\n" +
      "╚════════════════════════════════════════════════════════════════╝",
    );
  }
})();

function read(key) {
  if (cache[key] !== undefined) return cache[key];
  const def = DEFAULTS[key] !== undefined ? DEFAULTS[key] : null;
  cache[key] = def;
  return def;
}

function write(key, data) {
  cache[key] = data;

  try {
    const filePath = path.join(__dirname, "../data", `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error(`[db] local write error for ${key}:`, err.message);
  }

  pool
    .query(
      `INSERT INTO store_data(key,value) VALUES($1,$2)
       ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value`,
      [key, JSON.stringify(data)],
    )
    .catch((err) => console.error("[db] write error:", err.message));
}

module.exports = { read, write, ready };
