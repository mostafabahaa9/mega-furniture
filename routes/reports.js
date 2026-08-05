const router = require("express").Router();
const { read } = require("../utils/db");
const { adminAuth } = require("../middleware/auth");

function inRange(iso, from, to) {
  const t = new Date(iso).getTime();
  return t >= from && t <= to;
}

function calcTotals(orders, products) {
  let revenue = 0,
    profit = 0;
  orders.forEach((o) => {
    revenue += Number(o.total) || 0;
    (o.items || []).forEach((it) => {
      const qty = Number(it.quantity) || 1;
      const price = Number(it.price) || 0;
      // Use costAtOrder if saved; otherwise fall back to current product costPrice
      let cost = Number(it.costAtOrder) || 0;
      if (!cost && products) {
        const p = products.find((x) => x.id === it.id);
        cost = Number(p?.costPrice) || 0;
      }
      profit += (price - cost) * qty;
    });
    profit -= Number(o.discountAmount) || 0;
  });
  return { revenue: Math.round(revenue), profit: Math.round(profit) };
}

function changePct(cur, prev) {
  if (prev <= 0) return null;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
}

function buildChartGroups(orders, fromMs, toMs, products) {
  const diffDays = Math.ceil((toMs - fromMs) / 86400000);

  if (diffDays <= 7) {
    // daily
    const groups = [];
    for (let i = 0; i < diffDays; i++) {
      const d = new Date(fromMs + i * 86400000);
      const ds = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const de = ds + 86399999;
      const mo = orders.filter((o) => inRange(o.createdAt, ds, de));
      const { revenue, profit } = calcTotals(mo, products);
      groups.push({
        label: d.toLocaleDateString("ar-EG", {
          day: "numeric",
          month: "short",
        }),
        revenue,
        profit,
        orders: mo.length,
      });
    }
    return groups;
  }

  if (diffDays <= 90) {
    // weekly
    const weeks = Math.ceil(diffDays / 7);
    const groups = [];
    for (let i = 0; i < weeks; i++) {
      const ws = fromMs + i * 7 * 86400000;
      const we = Math.min(ws + 7 * 86400000 - 1, toMs);
      const mo = orders.filter((o) => inRange(o.createdAt, ws, we));
      const { revenue, profit } = calcTotals(mo, products);
      const d = new Date(ws);
      groups.push({
        label: d.toLocaleDateString("ar-EG", {
          day: "numeric",
          month: "short",
        }),
        revenue,
        profit,
        orders: mo.length,
      });
    }
    return groups;
  }

  // monthly
  const groups = [];
  let d = new Date(
    new Date(fromMs).getFullYear(),
    new Date(fromMs).getMonth(),
    1,
  );
  while (d.getTime() <= toMs) {
    const ms = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    const me = new Date(
      d.getFullYear(),
      d.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    ).getTime();
    const mo = orders.filter((o) =>
      inRange(o.createdAt, ms, Math.min(me, toMs)),
    );
    const { revenue, profit } = calcTotals(mo, products);
    groups.push({
      label: d.toLocaleDateString("ar-EG", { month: "short", year: "2-digit" }),
      revenue,
      profit,
      orders: mo.length,
    });
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }
  return groups.slice(-24);
}

router.get("/admin/reports/full", adminAuth, (req, res) => {
  const { from, to } = req.query;
  const allOrders = read("orders");
  const products = read("products");
  const now = new Date();

  const toMs = to ? new Date(to + "T23:59:59.999").getTime() : now.getTime();
  const fromMs = from ? new Date(from + "T00:00:00.000").getTime() : 0;

  // previous period (same duration)
  const rangeMs = toMs - fromMs;
  const prevToMs = fromMs - 1;
  const prevFromMs = fromMs - rangeMs - 1;

  const isActive = (o) => o.status !== "cancelled" && o.status !== "returned";

  const periodOrders = allOrders.filter(
    (o) => isActive(o) && inRange(o.createdAt, fromMs, toMs),
  );
  const prevOrders = allOrders.filter(
    (o) => isActive(o) && inRange(o.createdAt, prevFromMs, prevToMs),
  );
  const allActive = allOrders.filter(isActive);

  const cur = calcTotals(periodOrders, products);
  const prev = calcTotals(prevOrders, products);

  // product aggregations
  const qtyMap = {},
    revMap = {},
    profitMap = {};
  periodOrders.forEach((o) => {
    (o.items || []).forEach((it) => {
      const pid = it.id;
      if (!pid) return;
      const qty = Number(it.quantity) || 1;
      const price = Number(it.price) || 0;
      let cost = Number(it.costAtOrder) || 0;
      if (!cost) {
        const p = products.find((x) => x.id === pid);
        cost = Number(p?.costPrice) || 0;
      }
      qtyMap[pid] = (qtyMap[pid] || 0) + qty;
      revMap[pid] = (revMap[pid] || 0) + price * qty;
      profitMap[pid] = (profitMap[pid] || 0) + (price - cost) * qty;
    });
  });

  // sold ids across ALL time (for unsold detection)
  const allSoldIds = new Set();
  allActive.forEach((o) =>
    (o.items || []).forEach((it) => it.id && allSoldIds.add(it.id)),
  );
  const periodSoldIds = new Set(Object.keys(qtyMap));

  const topProducts = Object.entries(qtyMap)
    .map(([id, qty]) => {
      const p = products.find((x) => x.id === id);
      return {
        id,
        qty,
        revenue: Math.round(revMap[id] || 0),
        profit: Math.round(profitMap[id] || 0),
        nameAr: p ? p.nameAr : "",
        nameEn: p ? p.nameEn : "",
      };
    })
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 15);

  const slowSellers = Object.entries(qtyMap)
    .map(([id, qty]) => {
      const p = products.find((x) => x.id === id);
      return {
        id,
        qty,
        revenue: Math.round(revMap[id] || 0),
        nameAr: p ? p.nameAr : "",
        nameEn: p ? p.nameEn : "",
      };
    })
    .sort((a, b) => a.qty - b.qty)
    .slice(0, 15);

  const unsoldProducts = products
    .filter((p) => !periodSoldIds.has(p.id))
    .slice(0, 30)
    .map((p) => ({
      id: p.id,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      everSold: allSoldIds.has(p.id),
    }));

  // cities
  const cityMap = {};
  periodOrders.forEach((o) => {
    const city = (o.city || "غير محدد").trim();
    if (!cityMap[city]) cityMap[city] = { orders: 0, revenue: 0 };
    cityMap[city].orders++;
    cityMap[city].revenue += Number(o.total) || 0;
  });
  const cities = Object.entries(cityMap)
    .map(([city, d]) => ({
      city,
      orders: d.orders,
      revenue: Math.round(d.revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 15);

  // customers
  const custMap = {};
  allOrders.forEach((o) => {
    const ph = (o.phone || "").trim();
    if (!ph) return;
    if (!custMap[ph])
      custMap[ph] = {
        phone: ph,
        name: o.customerName || "",
        orders: 0,
        spent: 0,
      };
    if (isActive(o) && inRange(o.createdAt, fromMs, toMs)) {
      custMap[ph].orders++;
      custMap[ph].spent += Number(o.total) || 0;
    }
    if (o.customerName) custMap[ph].name = o.customerName;
  });
  const topCustomers = Object.values(custMap)
    .filter((c) => c.orders > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 15)
    .map((c) => ({ ...c, spent: Math.round(c.spent) }));

  // inventory
  function getProductQty(p) {
    if (p.variants && p.variants.length) {
      return p.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    }
    return 999;
  }
  const outOfStock = products.filter((p) => getProductQty(p) === 0).length;
  const lowStock = products.filter((p) => {
    const q = getProductQty(p);
    return q > 0 && q <= 5;
  }).length;

  res.json({
    period: { from: from || null, to: to || null },
    revenue: cur.revenue,
    profit: cur.profit,
    orders: periodOrders.length,
    avgOrder: periodOrders.length
      ? Math.round(cur.revenue / periodOrders.length)
      : 0,
    prevRevenue: prev.revenue,
    prevProfit: prev.profit,
    prevOrders: prevOrders.length,
    revenueChange: changePct(cur.revenue, prev.revenue),
    profitChange: changePct(cur.profit, prev.profit),
    ordersChange: changePct(periodOrders.length, prevOrders.length),
    chart: buildChartGroups(periodOrders, fromMs, toMs, products),
    topProducts,
    slowSellers,
    unsoldProducts,
    cities,
    topCustomers,
    inventoryStats: {
      total: products.length,
      outOfStock,
      lowStock,
      healthy: products.length - outOfStock - lowStock,
    },
  });
});

/** CSV export */
router.get("/admin/reports/export.csv", adminAuth, (req, res) => {
  res.redirect("/api/admin/orders/export?format=csv");
});

module.exports = router;
