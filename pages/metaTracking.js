/* Shared Meta Pixel + CAPI event sender. One invocation = one browser event
 * and one CAPI event, both carrying the exact same unique event ID. */
(function () {
  function makeEventId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID().replace(/-/g, "");
    }
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function cookie(name) {
    const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\/+^])/g, "\\$1") + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : undefined;
  }

  window.metaTrack = function metaTrack(eventName, customData, userData) {
    const eventId = makeEventId();
    const data = customData || {};
    const customer = userData || {};

    try { window.fbq("track", eventName, data, { eventID: eventId }); } catch (error) {}

    fetch("/api/meta/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        eventName,
        eventId,
        sourceUrl: window.location.href,
        customData: data,
        userData: {
          email: customer.email,
          phone: customer.phone,
          city: customer.city,
          fbp: cookie("_fbp"),
          fbc: cookie("_fbc"),
        },
      }),
    }).catch(function () {});

    return eventId;
  };

  // Covers plain WhatsApp links across the site. Capture phase suppresses the
  // legacy inline fbq('track', 'Contact') handler, preventing a second browser
  // event while preserving the link's normal navigation.
  document.addEventListener("click", function (event) {
    const link = event.target.closest && event.target.closest('a[href*="wa.me/"]');
    if (!link || link.dataset.metaContactTracked) return;
    link.dataset.metaContactTracked = "1";
    event.stopImmediatePropagation();
    window.metaTrack("Contact");
  }, true);
})();
