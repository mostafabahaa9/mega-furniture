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

// Populate cache from PostgreSQL, seed from JSON files on first run
const ready = (async () => {
  let pgOk = false;
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
  } catch (err) {
    console.error("[db] pg error:", err.message);
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
      } catch {}
    }
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
