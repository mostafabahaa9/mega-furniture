const jwt = require("jsonwebtoken");

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ")
    ? auth.slice(7)
    : req.headers["x-admin-token"] || auth;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Direct check for ADMIN_SECRET_TOKEN
  const adminSecret = process.env.ADMIN_SECRET_TOKEN;
  if (adminSecret && token === adminSecret) {
    req.admin = { role: "admin" };
    return next();
  }

  // Verify JWT token signature
  try {
    const secret =
      process.env.ADMIN_SECRET_TOKEN ||
      process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "Server misconfigured: JWT secret not set" });
    }
    const payload = jwt.verify(token, secret);
    req.admin = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = { adminAuth: requireAdmin, requireAdmin };

