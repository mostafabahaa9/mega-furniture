const router = require("express").Router();
const { trackWebsiteEvent } = require("../utils/metaCapi");

const ALLOWED_EVENTS = new Set(["ViewContent", "AddToCart", "Contact"]);
const ID_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  return (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : undefined) || req.socket.remoteAddress;
}

// This receives only events initiated by the site's browser helper. Customer
// details are hashed inside metaCapi.js and are never written to the database.
router.post("/meta/events", (req, res) => {
  const { eventName, eventId, sourceUrl, customData, userData } = req.body || {};
  if (!ALLOWED_EVENTS.has(eventName) || !ID_PATTERN.test(eventId || "")) {
    return res.status(400).json({ error: "Invalid Meta event" });
  }

  let safeSourceUrl;
  try {
    const url = new URL(sourceUrl);
    if (url.host !== req.get("host")) throw new Error("external URL");
    safeSourceUrl = url.toString();
  } catch {
    return res.status(400).json({ error: "Invalid event source URL" });
  }

  const data = customData && typeof customData === "object" ? customData : {};
  const safeCustomData = {
    content_ids: Array.isArray(data.content_ids) ? data.content_ids.slice(0, 50).map(String) : undefined,
    content_type: data.content_type === "product" ? "product" : undefined,
    value: Number.isFinite(Number(data.value)) ? Number(data.value) : undefined,
    currency: data.currency === "EGP" ? "EGP" : undefined,
    num_items: Number.isInteger(Number(data.num_items)) ? Number(data.num_items) : undefined,
  };
  Object.keys(safeCustomData).forEach((key) => safeCustomData[key] === undefined && delete safeCustomData[key]);

  const submittedUserData = userData && typeof userData === "object" ? userData : {};
  trackWebsiteEvent({
    eventName,
    eventId,
    sourceUrl: safeSourceUrl,
    customData: safeCustomData,
    userData: {
      email: submittedUserData.email,
      phone: submittedUserData.phone,
      city: submittedUserData.city,
      fbp: submittedUserData.fbp,
      fbc: submittedUserData.fbc,
      ip: clientIp(req),
      userAgent: req.get("user-agent"),
    },
  });

  return res.status(202).json({ accepted: true, eventId });
});

module.exports = router;
