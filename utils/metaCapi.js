/**
 * Meta Conversions API (CAPI) — Server-Side Event Tracking
 * 
 * Sends events directly to Meta's servers, bypassing ad blockers.
 * Works alongside client-side fbq() for redundancy + deduplication.
 * 
 * Required env vars:
 *   META_CAPI_TOKEN  — Access token from Facebook Events Manager
 * 
 * Optional env vars:
 *   META_TEST_EVENT_CODE — Temporary code for Test Events tab (remove in production)
 *   CAPI_DEBUG_LOGS — Set to "true" to log the outgoing CAPI event and Meta response
 *   CAPI_DEBUG_ORDER_ID — Optional event_id/trackingCode filter for one order only
 */

const https = require("https");
const crypto = require("crypto");

const PIXEL_ID = "1236448993498775";
const API_VERSION = "v21.0";

if (process.env.CAPI_DEBUG_LOGS === "true") {
  console.log("[CAPI] Debug logging enabled:", {
    meta_capi_token_configured: Boolean(process.env.META_CAPI_TOKEN),
    meta_test_event_code_configured: Boolean(process.env.META_TEST_EVENT_CODE),
  });
}

function hashSHA256(value) {
  if (!value) return undefined;
  return crypto.createHash("sha256").update(value.toString().trim().toLowerCase()).digest("hex");
}

// Meta expects E.164 digits without the + sign before hashing. Egyptian local
// numbers commonly begin with 0, so convert them to the country code first.
function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  return digits;
}

// Meta requires a numeric value. Orders may be restored from JSON or another
// integration as a formatted string (for example "75,600"), so normalize it
// before either validating or sending a Purchase event.
function normalizePurchaseValue(value) {
  const amount = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(amount) ? amount : NaN;
}

function shouldLogCapiEvent(eventData) {
  if (process.env.CAPI_DEBUG_LOGS !== "true") return false;
  const debugOrderId = process.env.CAPI_DEBUG_ORDER_ID;
  return !debugOrderId || eventData.event_id === debugOrderId;
}

// Keep runtime debug output useful for verification without writing customer
// identifiers, hashed user data, or Meta access tokens to application logs.
function getCapiLogPayload(eventData, testEventCode) {
  const customData = eventData.custom_data || {};
  return {
    event_name: eventData.event_name,
    event_id: eventData.event_id,
    event_time: eventData.event_time,
    action_source: eventData.action_source,
    event_source_url: eventData.event_source_url,
    custom_data: {
      value: customData.value,
      currency: customData.currency,
      content_ids: customData.content_ids,
      num_items: customData.num_items,
    },
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };
}

function buildUserData({ email, phone, city, ip, userAgent, fbp, fbc } = {}) {
  return {
    em: email ? [hashSHA256(email)] : undefined,
    ph: phone ? [hashSHA256(normalizePhone(phone))] : undefined,
    ct: city ? [hashSHA256(city)] : undefined,
    country: [hashSHA256("eg")],
    client_ip_address: ip || undefined,
    client_user_agent: userAgent || undefined,
    fbp: fbp || undefined,
    fbc: fbc || undefined,
  };
}

/**
 * Send event(s) to Meta Conversions API
 * @param {Object} opts
 * @param {string} opts.eventName - e.g. 'Purchase', 'ViewContent', 'AddToCart'
 * @param {string} opts.eventId - Unique ID for deduplication with client-side pixel
 * @param {string} opts.sourceUrl - The page URL where the event occurred
 * @param {Object} opts.userData - User data (email, phone, ip, ua, etc.)
 * @param {Object} opts.customData - Event-specific data (value, currency, content_ids, etc.)
 */
function sendCapiEvent(eventData) {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) {
    return;
  }

  // Clean undefined fields in user_data
  if (eventData.user_data) {
    Object.keys(eventData.user_data).forEach(k => {
      if (eventData.user_data[k] === undefined) delete eventData.user_data[k];
    });
  }

  const body = {
    data: [eventData],
  };

  const testCode = process.env.META_TEST_EVENT_CODE;
  if (testCode) {
    body.test_event_code = testCode;
  }

  const logCapiEvent = shouldLogCapiEvent(eventData);
  if (logCapiEvent) {
    console.log("[CAPI] Outgoing Meta payload:", JSON.stringify(getCapiLogPayload(eventData, testCode), null, 2));
  }

  const postData = JSON.stringify(body);
  const options = {
    hostname: "graph.facebook.com",
    port: 443,
    path: `/${API_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  const req = https.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      const accepted = res.statusCode >= 200 && res.statusCode < 300;
      let metaResponse = data;
      try {
        metaResponse = data ? JSON.parse(data) : {};
      } catch (_) {
        // Keep Meta's raw response body when it is not JSON.
      }

      if (logCapiEvent) {
        console.log("[CAPI] Meta response:", JSON.stringify({
          event_name: eventData.event_name,
          event_id: eventData.event_id,
          accepted,
          status_code: res.statusCode,
          response: metaResponse,
        }, null, 2));
      }

      if (!accepted) {
        console.error(`[CAPI] ${eventData.event_name} failed!`, metaResponse);
      } else {
        console.log(`[CAPI] ${eventData.event_name} sent successfully!`);
      }
    });
  });

  req.on("error", (e) => console.error(`[CAPI] Network error:`, e.message));
  req.write(postData);
  req.end();
}

/**
 * Send Purchase event to CAPI
 */
function trackPurchase({ order, ip, userAgent }) {
  const contentIds = (order.items || []).map(i => i.bundleId || i.id).filter(Boolean);
  const baseUrl = process.env.BASE_URL || "https://megafurnitures.com";
  const purchaseValue = normalizePurchaseValue(order.total);

  // Do not send a misleading zero/invalid Purchase event to Meta.
  if (!(purchaseValue > 0)) {
    console.error("[CAPI] Invalid Purchase value:", order.total);
    return undefined;
  }

  sendCapiEvent({
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: order.trackingCode, // <--- EXACTLY AS REQUESTED
    event_source_url: `${baseUrl}/checkout`,
    action_source: "website",
    user_data: buildUserData({
      email: order.email,
      phone: order.phone,
      city: order.city,
      ip,
      userAgent,
    }),
    custom_data: {
      content_ids: contentIds,
      content_type: "product",
      value: purchaseValue,
      currency: "EGP",
      order_id: order.trackingCode,
      num_items: (order.items || []).reduce((total, item) => total + (Number(item.quantity) || 1), 0),
    }
  });

  return order.trackingCode;
}

/** Send a browser-initiated website event through CAPI using the same event_id. */
function trackWebsiteEvent({ eventName, eventId, sourceUrl, customData, userData }) {
  const allowedEvents = new Set(["ViewContent", "AddToCart", "Contact"]);
  if (!allowedEvents.has(eventName)) throw new Error("Unsupported CAPI event");
  if (!eventId || typeof eventId !== "string") throw new Error("A unique event_id is required");

  sendCapiEvent({
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: sourceUrl,
    action_source: "website",
    user_data: buildUserData(userData),
    custom_data: customData || {},
  });
}

module.exports = { sendCapiEvent, trackPurchase, trackWebsiteEvent, normalizePhone, normalizePurchaseValue };
