(function () {
  const isSubPage = window.location.pathname.includes("/pages/");
  const homePath = isSubPage ? "../mega-furniture.html" : "mega-furniture.html";
  const shopPath = isSubPage ? "shop.html" : "pages/shop.html";
  const reviewsPath = isSubPage ? "reviews.html" : "pages/reviews.html";
  const videosPath = isSubPage ? "videos.html" : "pages/videos.html";
  const aboutPath = isSubPage ? "about.html" : "pages/about.html";
  const customPath = isSubPage ? "custom-work.html" : "pages/custom-work.html";
  const contactPath = isSubPage ? "contact.html" : "pages/contact.html";
  const trackPath = isSubPage ? "track.html" : "pages/track.html";
  const logoPath = isSubPage ? "../logos/mega-logo.jpg" : "logos/mega-logo.jpg";
  const lang = localStorage.getItem("megaLang") || "en";

  const apiBase = (window.location.protocol === "file:" || (window.location.port !== "3001" && window.location.port !== "")) && !window.location.hostname.includes("railway.app")
    ? "http://localhost:3001"
    : window.location.origin;

  // Intercept fetch requests to redirect local API requests to port 3001 if needed
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === "string" && (input.includes("/api/") || input.includes("/uploads/"))) {
      let url = input;
      if (url.startsWith("/")) {
        url = apiBase + url;
      } else if (url.startsWith(window.location.origin)) {
        url = url.replace(window.location.origin, apiBase);
      } else if (window.location.protocol === "file:" && (url.startsWith("file://") || !url.startsWith("http"))) {
        const match = url.match(/\/api\/.*$/);
        if (match) {
          url = apiBase + match[0];
        }
      }
      return originalFetch(url, init);
    }
    return originalFetch(input, init);
  };

  // Ensure brand fonts are always available (pages may omit --font-head)
  if (!document.querySelector('link[href*="Plus+Jakarta+Sans"]')) {
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,600;0,700;0,800;1,700&family=Outfit:wght@500;600;700;800&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700&display=swap";
    document.head.appendChild(fontLink);
  }

  // Injected Header CSS Styles
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap');

    /* Global RTL overrides and Cairo Font styling */
    html[dir="rtl"] {
      --font-body: "Cairo", sans-serif !important;
      --font-head: "Cairo", sans-serif !important;
    }
    html[dir="rtl"] body {
      text-align: right !important;
    }
    html[dir="rtl"] input, 
    html[dir="rtl"] textarea, 
    html[dir="rtl"] select {
      text-align: right !important;
      direction: rtl !important;
    }
    html[dir="rtl"] nav.global-header .nav-row-1 {
      direction: ltr !important;
    }

    /* RTL Search input mobile scaling fix */
    @media (max-width: 768px) {
      html[dir="rtl"] nav.global-header .nav-search-input {
        padding: 6px 12px 6px 36px !important;
      }
      html[dir="rtl"] nav.global-header .nav-search-submit {
        left: 12px !important;
        right: auto !important;
      }
    }


    /* 3-ROW HEADER STYLES */
    #gen-ann-bar, .ann-bar {
      position: relative !important;
    }
    nav.global-header {
      width: 100%;
      background: var(--bg, #F7F3EC);
      border-bottom: 1px solid var(--b, #E5E0D8);
      position: sticky;
      top: 0;
      z-index: 999;
      box-shadow: 0 2px 12px rgba(0,0,0,0.04);
      font-family: var(--font-body, system-ui);
      display: flex !important;
      flex-direction: column !important;
      align-items: stretch !important;
    }
    nav.global-header .nav-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1400px;
      margin: 0 auto;
      padding: 10px 24px;
      width: 100%;
      box-sizing: border-box;
    }
    nav.global-header .nav-row-1 {
      border-bottom: 1px solid var(--b, #E5E0D8);
      padding: 12px 24px;
    }
    nav.global-header .nav-row-2 {
      border-bottom: 1px solid var(--b, #E5E0D8);
      padding: 10px 24px;
    }
    nav.global-header .nav-row-3 {
      padding: 10px 24px;
      display: none !important;
    }
    .nav-row-1, .nav-row-2, .nav-row-3 {
      width: 100%;
    }

    /* Search Container */
    .nav-search-container {
      flex: 1;
      max-width: 340px;
      position: relative !important;
    }
    .nav-search-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      right: 0;
      background: var(--bg, #F7F3EC);
      border: 1px solid var(--b, #E5E0D8);
      border-radius: 16px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.15);
      z-index: 99999;
      max-height: 420px;
      overflow-y: auto;
      display: none;
      padding: 8px 0;
      backdrop-filter: blur(8px);
    }
    .nav-search-dropdown.active {
      display: block !important;
      animation: searchFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes searchFadeIn {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .search-res-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      text-decoration: none;
      color: var(--t, #333);
      transition: background 0.15s;
      border-bottom: 1px solid var(--b, #E5E0D8);
    }
    .search-res-item:last-child {
      border-bottom: none;
    }
    .search-res-item:hover {
      background: var(--s2, #FAF8F5);
    }
    .search-res-img {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
      background: var(--s2);
    }
    .search-res-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .search-res-title {
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .search-res-price {
      font-size: 12px;
      font-weight: 700;
      color: var(--o, #F5A623);
    }
    .search-res-more {
      display: block;
      padding: 12px 16px;
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      color: var(--o, #F5A623);
      text-decoration: none;
      background: var(--s2);
      border-top: 1px solid var(--b);
      transition: background 0.15s;
    }
    .search-res-more:hover {
      background: var(--s3);
    }
    .nav-search-form {
      position: relative;
      display: flex;
      align-items: center;
    }
    .nav-search-input {
      width: 100%;
      padding: 8px 16px 8px 40px;
      border-radius: 100px;
      border: 1px solid var(--b, #E5E0D8);
      background: var(--s2, #FAF8F5);
      font-size: 13px;
      color: var(--t, #333);
      outline: none;
      transition: all 0.2s;
    }
    html[dir="rtl"] .nav-search-input {
      padding: 8px 16px 8px 40px;
    }
    .nav-search-input:focus {
      border-color: var(--o, #F5A623);
      background: #fff;
    }
    .nav-search-submit {
      position: absolute;
      left: 12px;
      background: none;
      border: none;
      color: var(--tm, #888);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    html[dir="rtl"] .nav-search-submit {
      left: 12px;
      right: auto;
    }

    /* Logo Styles */
    nav.global-header .nav-row-1 {
      position: relative !important;
    }
    .logo-container {
      position: absolute !important;
      left: 50% !important;
      top: 50% !important;
      transform: translate(-50%, -50%) !important;
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      text-decoration: none !important;
      color: var(--t, #333) !important;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    @media (min-width: 769px) {
      .logo-container:hover {
        transform: translate(-50%, -52%) scale(1.04) !important;
      }
    }
    .logo-img {
      width: 44px !important;
      height: 44px !important;
      border-radius: 10px !important;
      object-fit: cover !important;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12) !important;
      border: 1px solid rgba(0, 0, 0, 0.08) !important;
    }
    .logo-wordmark {
      font-family: "Plus Jakarta Sans", "Outfit", system-ui, sans-serif !important;
      font-weight: 800 !important;
      font-size: 25px !important;
      letter-spacing: 0.12em !important;
      line-height: 0.95 !important;
      white-space: nowrap !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 3px !important;
      color: var(--t, #1d1d1f) !important;
      direction: ltr !important;
      text-transform: uppercase !important;
    }
    .logo-wordmark span {
      font-size: 11px !important;
      letter-spacing: 0.42em !important;
      font-weight: 700 !important;
      color: var(--o, #F5A623) !important;
      font-family: "Outfit", "Plus Jakarta Sans", sans-serif !important;
      font-style: normal !important;
      text-transform: uppercase !important;
    }

    /* Right navigation list style */
    .nr {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-direction: row !important;
    }
    .langbtn {
      background: transparent !important;
      border: 1px solid var(--b) !important;
      color: var(--tm) !important;
      padding: 6px 14px !important;
      border-radius: 100px !important;
      font-family: "Outfit", sans-serif !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      cursor: pointer !important;
      transition: all 0.2s !important;
      letter-spacing: 0.06em !important;
      white-space: nowrap !important;
    }
    .langbtn:hover {
      border-color: var(--o) !important;
      color: var(--o) !important;
    }
    .tt {
      background: transparent !important;
      border: 1px solid var(--b) !important;
      color: var(--tm) !important;
      width: 38px !important;
      height: 38px !important;
      border-radius: 100px !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: background 0.2s, transform 0.15s !important;
      flex-shrink: 0 !important;
      font-size: 20px !important;
      line-height: 1 !important;
    }
    .tt:hover {
      background: var(--s3) !important;
      transform: scale(1.08) !important;
    }
    
    .hbg {
      display: none !important;
      flex-direction: column !important;
      gap: 5px !important;
      cursor: pointer !important;
      background: var(--s) !important;
      border: 1px solid var(--o) !important;
      border-radius: 50% !important;
      padding: 0 !important;
      width: 38px !important;
      height: 38px !important;
      min-width: 38px !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
      overflow: visible !important;
      transition: transform 0.2s ease !important;
    }
    .hbg:active {
      transform: scale(0.95) !important;
    }
    .hbg span {
      display: block !important;
      width: 18px !important;
      height: 2px !important;
      background: var(--o) !important;
      border-radius: 2px !important;
      transition: all 0.3s !important;
    }
    .hbg.open span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px) !important; }
    .hbg.open span:nth-child(2) { opacity: 0 !important; }
    .hbg.open span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px) !important; }
    
    @media (max-width: 900px) {
      .nlinks { display: none !important; }
      .hbg { display: flex !important; }
    }
    .cb {
      position: relative !important;
      width: 44px !important;
      height: 44px !important;
      border-radius: 12px !important;
      background: var(--s2) !important;
      border: 1px solid var(--b) !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 20px !important;
      transition: background 0.2s !important;
      color: var(--t) !important;
    }
    .cb:hover {
      background: var(--s3) !important;
    }
    .cbadge {
      position: absolute !important;
      top: -6px !important;
      right: -6px !important;
      width: 20px !important;
      height: 20px !important;
      border-radius: 50% !important;
      background: var(--o) !important;
      color: #fff !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-shadow: 0 2px 6px rgba(245, 166, 35, 0.4) !important;
    }
    .wb {
      position: relative !important;
      width: 44px !important;
      height: 44px !important;
      border-radius: 12px !important;
      background: var(--s2) !important;
      border: 1px solid var(--b) !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 20px !important;
      transition: background 0.2s !important;
      color: var(--t) !important;
    }
    .wb:hover {
      background: var(--s3) !important;
    }
    .wbadge {
      background: #ff4757 !important;
      box-shadow: 0 2px 6px rgba(255, 71, 87, 0.4) !important;
    }
    .cp, .cpa, .wcp, .omod, .modal, .rev-modal-card, #omod {
      z-index: 100001 !important;
    }
    .cov, .ov, .wcov, .oov, .modal-bg, .rev-modal-bg, #oov {
      z-index: 100000 !important;
    }

    /* GLOBAL CART DRAWER STYLES */
    .ov {
      position: fixed !important;
      inset: 0 !important;
      background: rgba(0, 0, 0, 0.65) !important;
      backdrop-filter: blur(4px) !important;
      -webkit-backdrop-filter: blur(4px) !important;
      opacity: 0 !important;
      pointer-events: none !important;
      transition: opacity 0.3s !important;
    }
    .ov.open {
      opacity: 1 !important;
      pointer-events: all !important;
    }
    .cpa {
      position: fixed !important;
      top: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: min(440px, 100vw) !important;
      background: var(--s) !important;
      border-left: 1px solid var(--b) !important;
      transform: translateX(100%) !important;
      transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
      display: flex !important;
      flex-direction: column !important;
    }
    html[dir="rtl"] .cpa {
      left: 0 !important;
      right: auto !important;
      border-left: none !important;
      border-right: 1px solid var(--b) !important;
      transform: translateX(-100%) !important;
    }
    .cpa.open {
      transform: translateX(0) !important;
    }
    html[dir="rtl"] .cpa.open {
      transform: translateX(0) !important;
    }
    .chdr {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      padding: 20px 24px !important;
      border-bottom: 1px solid var(--b) !important;
    }
    html[dir="rtl"] .chdr {
      flex-direction: row-reverse !important;
    }
    .chdr h3 {
      font-family: var(--font-head) !important;
      font-size: 18px !important;
      font-weight: 700 !important;
      color: var(--t) !important;
      margin: 0 !important;
    }
    .cx {
      background: none !important;
      border: none !important;
      cursor: pointer !important;
      padding: 4px !important;
      color: var(--t) !important;
      opacity: 0.6 !important;
      transition: opacity 0.2s !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .cx:hover {
      opacity: 1 !important;
    }
    .clist {
      flex: 1 !important;
      overflow-y: auto !important;
      padding: 24px !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 20px !important;
    }
    .cemp {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      height: 100% !important;
      text-align: center !important;
      color: var(--tm) !important;
    }
    .cemp .big {
      margin-bottom: 16px !important;
    }
    .cemp p {
      font-size: 15px !important;
      font-weight: 600 !important;
      color: var(--t) !important;
      margin: 0 0 6px !important;
    }
    .cemp small {
      font-size: 12px !important;
      opacity: 0.8 !important;
    }
    .cftr {
      padding: 24px !important;
      border-top: 1px solid var(--b) !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 16px !important;
    }
    .cir {
      display: flex !important;
      gap: 16px !important;
      align-items: flex-start !important;
      padding-bottom: 20px !important;
      border-bottom: 1px solid var(--b) !important;
    }
    html[dir="rtl"] .cir {
      flex-direction: row-reverse !important;
    }
    .cir:last-child {
      border-bottom: none !important;
      padding-bottom: 0 !important;
    }
    .cii {
      width: 80px !important;
      height: 80px !important;
      border-radius: 12px !important;
      overflow: hidden !important;
      background: var(--s2) !important;
      border: 1px solid var(--b) !important;
      flex-shrink: 0 !important;
    }
    .cii img {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
    }
    .cin {
      flex: 1 !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 6px !important;
      text-align: left !important;
    }
    html[dir="rtl"] .cin {
      text-align: right !important;
    }
    .cin .nm {
      font-size: 14px !important;
      font-weight: 600 !important;
      color: var(--t) !important;
    }
    .cin .pr {
      font-size: 13px !important;
      font-weight: 700 !important;
      color: var(--o) !important;
    }
    .ciq {
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      border: 1px solid var(--b) !important;
      border-radius: 8px !important;
      padding: 4px 10px !important;
      width: fit-content !important;
      background: var(--s2) !important;
    }
    html[dir="rtl"] .ciq {
      flex-direction: row-reverse !important;
    }
    .ciq button {
      background: none !important;
      border: none !important;
      cursor: pointer !important;
      font-size: 14px !important;
      color: var(--t) !important;
      padding: 0 4px !important;
      opacity: 0.6 !important;
      transition: opacity 0.2s !important;
    }
    .ciq button:hover {
      opacity: 1 !important;
    }
    .ciq span {
      font-size: 13px !important;
      font-weight: 600 !important;
      color: var(--t) !important;
      min-width: 16px !important;
      text-align: center !important;
    }
    .crm {
      background: none !important;
      border: none !important;
      cursor: pointer !important;
      padding: 4px !important;
      color: var(--tm) !important;
      opacity: 0.6 !important;
      transition: opacity 0.2s !important;
    }
    .crm:hover {
      opacity: 1 !important;
      color: #ff3b30 !important;
    }
    .css-x {
      display: inline-block !important;
      position: relative !important;
      width: 12px !important;
      height: 12px !important;
      opacity: 0.7 !important;
    }
    .css-x::before, .css-x::after {
      content: '' !important;
      position: absolute !important;
      left: 5px !important;
      top: 0 !important;
      width: 2px !important;
      height: 12px !important;
      background-color: currentColor !important;
    }
    .css-x::before {
      transform: rotate(45deg) !important;
    }
    .css-x::after {
      transform: rotate(-45deg) !important;
    }

    /* Center Page Content & Row 2 Nav Links */
    nav.global-header .nav-row-2 {
      justify-content: center !important;
    }
    .nav-links-row-2 {
      display: flex;
      justify-content: center !important;
      align-items: center !important;
      gap: 24px !important;
      list-style: none;
      margin: 0 auto !important;
      padding: 0;
      width: 100% !important;
      max-width: 1200px !important;
    }
    main, .pw, .rs-section, .fprods, .adbanner, .bundles-sec, .shop-main, .shop-container, .product-container, .page-wrapper, .about-page, .contact-page, .custom-page, .reviews-container, .videos-container {
      max-width: 1400px !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }
    .nlink-r2 {
      color: var(--tm, #666);
      text-decoration: none;
      font-size: 13px;
      padding: 4px 12px;
      transition: all 0.2s;
      white-space: nowrap !important;
    }
    .nlink-r2:hover, .nlink-r2.active {
      color: var(--t, #333);
      font-weight: 500;
    }

    /* Row 3 Mega Menu */
    .nav-links-row-3 {
      display: flex;
      flex-wrap: wrap !important;
      justify-content: center;
      gap: 24px;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .ann-bullet {
      color: var(--o, #F5A623);
      font-weight: bold;
      margin-left: 20px;
    }
    html[dir="rtl"] .ann-marquee-content {
      animation: ann-marquee-anim-rtl 35s linear infinite !important;
    }
    @keyframes ann-marquee-anim-rtl {
      0% { transform: translate3d(0, 0, 0); }
      100% { transform: translate3d(50%, 0, 0); }
    }
    .nlink-r3 {
      color: var(--t, #333);
      text-decoration: none;
      font-size: 15px;
      font-weight: 700;
      padding: 6px 12px;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
      white-space: nowrap !important;
    }
    .nlink-r3:hover {
      color: var(--o, #F5A623);
    }
    
    /* Dropdown container */
    .menu-item-with-dropdown {
      position: relative;
    }
    .mega-dropdown {
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%) translateY(10px);
      background: var(--bg, #F7F3EC);
      border: 1px solid var(--b, #E5E0D8);
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      display: flex;
      gap: 32px;
      padding: 20px;
      opacity: 0;
      visibility: hidden;
      transition: all 0.25s ease;
      z-index: 1000;
    }
    .menu-item-with-dropdown:hover .mega-dropdown,
    .mega-dropdown.active {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0);
    }
    .mega-col {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 180px;
    }
    .mega-col-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--o, #F5A623);
      border-bottom: 1px solid var(--b, #E5E0D8);
      padding-bottom: 6px;
      margin-bottom: 4px;
    }
    .mega-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .mega-link {
      color: var(--t, #333);
      text-decoration: none;
      font-size: 14px;
      transition: color 0.2s;
    }
    .mega-link:hover {
      color: var(--o, #F5A623);
    }

    .mega-product-item:hover {
      transform: translateY(-2px);
    }

    /* Mobile drawer Styles */
    .mob-drawer {
      position: fixed;
      inset: 0 0 0 auto;
      width: 85%;
      max-width: 320px;
      background: var(--nb, rgba(247, 243, 236, 0.98));
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-left: 1px solid var(--b, #E5E0D8);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      padding: 24px 16px;
      box-shadow: -4px 0 30px rgba(0,0,0,0.15);
      transform: translateX(100%);
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .mob-drawer.open {
      transform: translateX(0) !important;
    }
    .mob-drawer-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 9999;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }
    .mob-drawer-overlay.open {
      opacity: 1;
      visibility: visible;
    }
    .mob-drawer-hdr {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      padding: 0 8px;
    }
    .mob-drawer-close {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--s2, #FAF8F5);
      border: 1px solid var(--b, #E5E0D8);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      cursor: pointer;
      color: var(--t);
      transition: all 0.2s ease;
    }
    .mob-drawer-close:hover {
      background: var(--s3);
      transform: rotate(90deg);
    }
    .mob-drawer-body {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .mob-links-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .mob-nav-link {
      display: flex !important;
      align-items: center !important;
      padding: 12px 18px !important;
      font-size: 15px !important;
      font-weight: 500 !important;
      color: var(--t) !important;
      text-decoration: none !important;
      border-radius: 12px !important;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
      background: transparent !important;
    }
    .mob-nav-link:hover {
      background: var(--s2, #FAF8F5) !important;
      color: var(--o, #F5A623) !important;
      transform: translateX(6px) !important;
    }
    html[dir="rtl"] .mob-nav-link:hover {
      transform: translateX(-6px) !important;
    }
    .mob-nav-link.active {
      background: rgba(245, 166, 35, 0.1) !important;
      color: var(--o, #F5A623) !important;
      font-weight: 600 !important;
    }
    .mob-accordion-item {
      border-bottom: 1px solid var(--b, #E5E0D8);
      padding-bottom: 12px;
    }
    .mob-accordion-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--t, #333);
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      user-select: none;
    }
    .mob-accordion-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.25s ease-out;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-top: 0;
    }
    .mob-accordion-content.open {
      max-height: 500px;
      padding-top: 10px;
    }

    /* Global layout padding reset to support sticky header natively */
    body, .pw, .about-hero, .terms-container {
      padding-top: 0 !important;
    }
    .pb, .rs-dots, .hs-dots, .slider-progress, .scroll-progress {
      display: none !important;
    }

    /* Mobile media queries and layout scaling adjustments */
    @media (max-width: 768px) {
      nav.global-header .nav-row-2,
      nav.global-header .nav-row-3 {
        display: none !important;
      }
      nav.global-header .nav-row-1 {
        padding: 8px 12px !important;
        flex-wrap: nowrap !important;
        gap: 6px !important;
      }
      .logo-container {
        position: static !important;
        transform: none !important;
        left: auto !important;
        top: auto !important;
        order: 1 !important;
        flex: 0 0 auto !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
      }
      .logo-container:hover,
      .logo-container:active,
      .logo-container:focus {
        transform: none !important;
        opacity: 0.85 !important;
      }
      .logo-img {
        width: 38px !important;
        height: 38px !important;
      }
      .logo-wordmark {
        font-size: 19px !important;
        letter-spacing: 0.1em !important;
      }
      .logo-wordmark span {
        font-size: 9.5px !important;
        letter-spacing: 0.36em !important;
      }
      .nr {
        order: 3 !important;
        flex: 0 0 auto !important;
        gap: 8px !important;
      }
      /* Hide language button & theme toggle in header row on mobile, keep language switcher in drawer menu */
      .nr .langbtn,
      .nr .tt {
        display: none !important;
      }
      /* Search container wraps below header logo/actions on mobile */
      .nav-search-container {
        order: 2 !important;
        width: auto !important;
        flex: 1 1 auto !important;
        max-width: 200px !important;
        margin: 0 4px !important;
        position: static !important;
      }
      .nav-search-dropdown {
        position: absolute !important;
        top: calc(100% + 6px) !important;
        left: 12px !important;
        right: 12px !important;
        width: auto !important;
        max-width: calc(100vw - 24px) !important;
        max-height: 60vh !important;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2) !important;
      }
      .nav-search-input,
      input, select, textarea {
        font-size: 16px !important;
      }
    }

    /* Theme Toggle Sun/Moon display logic */
    .t-sun {
      display: block;
    }
    .t-sun svg {
      stroke: var(--o) !important;
    }
    .t-moon {
      display: none;
    }
    [data-theme="light"] .t-sun,
    html[data-theme="light"] .t-sun {
      display: none !important;
    }
    [data-theme="light"] .t-moon,
    html[data-theme="light"] .t-moon {
      display: block !important;
    }
    [data-theme="dark"] .t-sun,
    html[data-theme="dark"] .t-sun {
      display: block !important;
    }
    [data-theme="dark"] .t-moon,
    html[data-theme="dark"] .t-moon {
      display: none !important;
    }
  `;

  // Inject CSS Style element
  const styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // Inject Favicon dynamically
  const faviconUrl = isSubPage ? "../logos/mega-logo.jpg" : "logos/mega-logo.jpg";
  let faviconLink = document.querySelector("link[rel~='icon']");
  if (!faviconLink) {
    faviconLink = document.createElement("link");
    faviconLink.rel = "icon";
    document.head.appendChild(faviconLink);
  }
  faviconLink.href = faviconUrl;


    const curPath = window.location.pathname;
    const isHome = curPath.endsWith("/") || curPath.includes("mega-furniture.html") || (!curPath.includes("/pages/") && curPath.length <= 1);
    const isShop = curPath.includes("shop.html");
    const isReviews = curPath.includes("reviews.html");
    const isVideos = curPath.includes("videos.html");
    const isAbout = curPath.includes("about.html");
    const isCustom = curPath.includes("custom-work.html");
    const isContact = curPath.includes("contact.html");
    const isTrack = curPath.includes("track.html");

    // Mobile Drawer
    const headerHtml = `
      <nav class="global-header">
        <!-- ROW 1 -->
        <div class="nav-row nav-row-1">
          <!-- Search container -->
          <div class="nav-search-container">
            <form action="${shopPath}" method="GET" class="nav-search-form" id="nav-search-form">
              <input type="text" name="search" id="srch-nav" class="nav-search-input" data-ph-ar="ابحث..." data-ph-en="Search..." placeholder="Search..." autocomplete="off" />
              <button type="submit" class="nav-search-submit" title="Search">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
            </form>
            <div class="nav-search-dropdown" id="nav-search-dropdown"></div>
          </div>

          <!-- Logo Center -->
          <a class="logo-container" href="${homePath}">
            <img class="logo-img" src="${logoPath}" alt="Mega Furniture" />
            <div class="logo-wordmark">MEGA <span>Furniture</span></div>
          </a>

          <!-- Right Side Icons -->
          <div class="nr">
            <button class="langbtn" id="langbtn" onclick="toggleLang()">${lang === "ar" ? "EN" : "عربي"}</button>
            <button class="tt" id="tt" onclick="if(typeof toggleTheme === 'function') toggleTheme()" title="Toggle theme">
              <span class="t-sun">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <circle cx="12" cy="12" r="4" />
                  <line x1="12" y1="2" x2="12" y2="5" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="5" y2="12" />
                  <line x1="19" y1="12" x2="22" y2="12" />
                  <line x1="4.93" y1="4.93" x2="6.93" y2="6.93" />
                  <line x1="17.07" y1="17.07" x2="19.07" y2="19.07" />
                  <line x1="4.93" y1="19.07" x2="6.93" y2="17.07" />
                  <line x1="17.07" y1="6.93" x2="19.07" y2="4.93" />
                </svg>
              </span>
              <span class="t-moon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </span>
            </button>



            <button class="wb" onclick="if(typeof openWish === 'function') openWish(); else if(typeof openWishlist === 'function') openWishlist(); else if(typeof openWishDrawer === 'function') openWishDrawer(); else window.location.href='${shopPath}';" title="Favorites">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span class="cbadge wbadge" id="wbadge" style="display:none">0</span>
            </button>
            <button class="cb" onclick="openCart()" title="Cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 3h2l2.7 13.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L23 8H6" />
                <circle cx="9" cy="21" r="1.5" />
                <circle cx="18" cy="21" r="1.5" />
              </svg>
              <span class="cbadge" id="cbadge">0</span>
            </button>
            <button class="hbg" id="hbg" onclick="toggleMobDrawer()">
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>

        <!-- ROW 2 -->
        <div class="nav-row nav-row-2">
          <ul class="nav-links-row-2">
            <li><a class="nlink-r2 ${isHome ? 'active' : ''}" href="${homePath}" data-t="nav-home">Home</a></li>
            <li><a class="nlink-r2 ${isShop ? 'active' : ''}" href="${shopPath}" data-t="nav-shop">Shop</a></li>
            <li><a class="nlink-r2 ${isReviews ? 'active' : ''}" href="${reviewsPath}" data-t="nav-reviews">Reviews</a></li>
            <li><a class="nlink-r2 ${isVideos ? 'active' : ''}" href="${videosPath}" data-t="nav-videos">Videos</a></li>
            <li><a class="nlink-r2 ${isAbout ? 'active' : ''}" href="${aboutPath}" data-t="nav-about">About us</a></li>
            <li><a class="nlink-r2 ${isCustom ? 'active' : ''}" href="${customPath}" data-t="nav-custom-work">Custom work</a></li>
            <li><a class="nlink-r2 ${isContact ? 'active' : ''}" href="${contactPath}" data-t="nav-contact">Contact</a></li>
            <li><a class="nlink-r2 ${isTrack ? 'active' : ''}" href="${trackPath}" data-t="nav-track">Track Order</a></li>
          </ul>
        </div>

        <!-- ROW 3 -->
        <div class="nav-row nav-row-3">
          <ul class="nav-links-row-3" id="mega-menu-categories">
            <!-- Populated dynamically via JS -->
          </ul>
        </div>
      </nav>

      <!-- Mobile Drawer -->
      <div class="mob-drawer-overlay" id="mob-overlay" onclick="toggleMobDrawer()"></div>
      <div class="mob-drawer" id="mob-drawer">
        <div class="mob-drawer-hdr">
          <div class="logo-wordmark">MEGA <span>FURNITURE</span></div>
          <button class="mob-drawer-close" onclick="toggleMobDrawer()">✕</button>
        </div>
        <div class="mob-drawer-body">
          <!-- Page Links -->
          <ul class="mob-links-list">
            <li><a class="mob-nav-link ${isHome ? 'active' : ''}" href="${homePath}" data-t="nav-home" onclick="toggleMobDrawer()">Home</a></li>
            <li><a class="mob-nav-link ${isShop ? 'active' : ''}" href="${shopPath}" data-t="nav-shop" onclick="toggleMobDrawer()">Shop</a></li>
            <li><a class="mob-nav-link ${isReviews ? 'active' : ''}" href="${reviewsPath}" data-t="nav-reviews" onclick="toggleMobDrawer()">Reviews</a></li>
            <li><a class="mob-nav-link ${isVideos ? 'active' : ''}" href="${videosPath}" data-t="nav-videos" onclick="toggleMobDrawer()">Videos</a></li>
            <li><a class="mob-nav-link ${isAbout ? 'active' : ''}" href="${aboutPath}" data-t="nav-about" onclick="toggleMobDrawer()">About us</a></li>
            <li><a class="mob-nav-link ${isCustom ? 'active' : ''}" href="${customPath}" data-t="nav-custom-work" onclick="toggleMobDrawer()">Custom work</a></li>
            <li><a class="mob-nav-link ${isContact ? 'active' : ''}" href="${contactPath}" data-t="nav-contact" onclick="toggleMobDrawer()">Contact</a></li>
            <li><a class="mob-nav-link ${isTrack ? 'active' : ''}" href="${trackPath}" data-t="nav-track" onclick="toggleMobDrawer()">Track Order</a></li>
          </ul>
        
        <!-- Mobile Drawer Actions (Language & Theme Toggle) -->
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--b); display: flex; gap: 12px; align-items: center; justify-content: center;">
          <button class="langbtn" onclick="toggleLang()">
            ${lang === "ar" ? "EN" : "عربي"}
          </button>
          <button class="tt" onclick="toggleTheme()" title="Toggle Theme">
            <span class="t-sun">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="19" y1="12" x2="22" y2="12" />
                <line x1="4.93" y1="4.93" x2="6.93" y2="6.93" />
                <line x1="17.07" y1="17.07" x2="19.07" y2="19.07" />
                <line x1="4.93" y1="19.07" x2="6.93" y2="17.07" />
                <line x1="17.07" y1="6.93" x2="19.07" y2="4.93" />
              </svg>
            </span>
            <span class="t-moon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </div>
  `;

  // Find existing nav tag to replace, or insert before announcement bar / body start
  const currentNav = document.querySelector("nav");
  if (currentNav) {
    currentNav.outerHTML = headerHtml;
  } else {
    const genAnn = document.getElementById("gen-ann-bar");
    if (genAnn) {
      genAnn.insertAdjacentHTML("beforebegin", headerHtml);
    } else {
      document.body.insertAdjacentHTML("afterbegin", headerHtml);
    }
  }

  // Set up global toggleTheme if not already overridden/present
  window.toggleTheme = function () {
    const h = document.documentElement;
    const cur = h.getAttribute("data-theme") || "light";
    const next = cur === "dark" ? "light" : "dark";
    const newBg = next === "light" ? "#F7F3EC" : "#0A0A0A";
    const curtain = document.createElement("div");
    curtain.style.cssText =
      "position:fixed;inset:0;background:" +
      newBg +
      ";transform-origin:top;transform:scaleY(0);z-index:100001;pointer-events:none;transition:none";
    document.body.appendChild(curtain);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        curtain.style.transition =
          "transform 480ms cubic-bezier(0.76,0,0.24,1)";
        curtain.style.transform = "scaleY(1)";
      });
    });
    setTimeout(() => {
      h.setAttribute("data-theme", next);
      localStorage.setItem("megaTheme", next);
      curtain.style.transformOrigin = "bottom";
      curtain.style.transform = "scaleY(0)";
      setTimeout(() => curtain.remove(), 520);
    }, 490);
  };

  // Intercept addEventListener on #tt to prevent duplicate theme toggle from page inline scripts
  const ttBtn = document.getElementById("tt");
  if (ttBtn) {
    const originalAddEventListener = ttBtn.addEventListener;
    ttBtn.addEventListener = function (type, listener, options) {
      if (type === "click") {
        return;
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
  }


  // Spacing handled natively by position: sticky header and relative announcement bars

  // Load and Render Mega Menu Categories & Products
  let categories = [];
  let products = [];

  Promise.all([
    fetch(apiBase + "/api/categories").then((r) => r.json()).catch(() => []),
    fetch(apiBase + "/api/products").then((r) => r.json()).catch(() => []),
  ]).then(([cats, prods]) => {
    categories = cats;
    products = prods;
    renderMegaMenu();
    renderMobCategories();
  });

  function clientCategoryMatches(product, category) {
    const cats = product.categories || [];
    if (cats.includes(category.slug) || cats.includes(category.id)) return true;
    
    // Check subcategories of this category
    const childCats = categories.filter((c) => c.parentId === category.id);
    const childValues = childCats.flatMap(c => [c.slug, c.id].filter(Boolean));
    return cats.some((v) => childValues.includes(v));
  }

  function iu(p) {
    if (!p) return "";
    if (p.startsWith("http") || p.startsWith("data:")) return p;
    const isSub = window.location.pathname.includes("/pages/");
    if (p.startsWith("/")) {
      return isSub ? ".." + p : p;
    }
    return (isSub ? "../" : "") + "uploads/" + p;
  }

  function renderMegaMenu() {
    const container = document.getElementById("mega-menu-categories");
    if (!container) return;

    // Filter main menu top-level categories dynamically (no parentId)
    const mainCats = categories.filter((c) => !c.parentId);

    const lang = localStorage.getItem("megaLang") || "en";

    const itemsHtml = mainCats.map((cat) => {
      const name = lang === "ar" ? cat.nameAr : cat.nameEn;
      const subs = categories.filter((c) => c.parentId === cat.id);
      const catProds = products.filter((p) => clientCategoryMatches(p, cat));

      const hasSubs = subs.length > 0;
      const hasProds = catProds.length > 0;

      if (!hasSubs && !hasProds) {
        // Bare link with no dropdown
        return `
          <li>
            <a class="nlink-r3" href="${shopPath}?cat=${cat.slug}" data-ar="${cat.nameAr}" data-en="${cat.nameEn}">${name}</a>
          </li>
        `;
      }

      // Dropdown with columns
      let subsColHtml = "";
      if (hasSubs) {
        subsColHtml = `
          <div class="mega-col">
            <div class="mega-col-title" data-ar="تسوق بالقطعة" data-en="Shop by piece">${lang === "ar" ? "تسوق بالقطعة" : "Shop by piece"}</div>
            <ul class="mega-list">
              ${subs.map((s) => `
                <li><a class="mega-link" href="${shopPath}?cat=${s.slug}" data-ar="${s.nameAr}" data-en="${s.nameEn}">${lang === "ar" ? s.nameAr : s.nameEn}</a></li>
              `).join("")}
            </ul>
          </div>
        `;
      }

      let prodsColHtml = "";
      if (hasProds) {
        prodsColHtml = `
          <div class="mega-col mega-products-col" style="min-width: 320px;">
            <div class="mega-col-title" data-ar="منتجات مميزة" data-en="Featured Products">${lang === "ar" ? "منتجات مميزة" : "Featured Products"}</div>
            <div class="mega-products-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 8px;">
              ${catProds.slice(0, 3).map((p) => {
                const pName = lang === "ar" ? p.nameAr || p.nameEn : p.nameEn || p.nameAr;
                const pPhoto = p.mainPhoto || (p.photos && p.photos[0]) || "";
                const hasDisc = p.salePrice != null && p.salePrice < p.price;
                const pPrice = hasDisc ? p.salePrice : p.price;
                return `
                  <a class="mega-product-item" href="${isSubPage ? "" : "pages/"}product.html?id=${p.id}" style="display: flex; flex-direction: column; gap: 4px; text-decoration: none; color: inherit; transition: transform 0.2s;">
                    <img class="mega-product-img" src="${iu(pPhoto)}" alt="${pName}" loading="lazy" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 6px; background: var(--s2, #f5f5f5);" />
                    <h5 class="mega-product-name" style="font-size: 11px; font-weight: 600; color: var(--t, #333); margin: 4px 0 0; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;" data-ar="${p.nameAr}" data-en="${p.nameEn}">${pName}</h5>
                    <span class="mega-product-price" style="font-size: 10px; font-weight: 700; color: var(--o, #F5A623);">EGP ${Number(pPrice).toLocaleString()}</span>
                  </a>
                `;
              }).join("")}
            </div>
          </div>
        `;
      }

      return `
        <li class="menu-item-with-dropdown">
          <a class="nlink-r3" href="${shopPath}?cat=${cat.slug}" data-ar="${cat.nameAr}" data-en="${cat.nameEn}">
            ${name}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="6,9 12,15 18,9"/>
            </svg>
          </a>
          <div class="mega-dropdown" style="display: flex; gap: 32px; padding: 20px; min-width: ${hasSubs && hasProds ? '550px' : '220px'};">
            ${subsColHtml}
            ${prodsColHtml}
          </div>
        </li>
      `;
    }).join("");

    container.innerHTML = itemsHtml;

    // Fix category hover behavior: on touch screens or first-interaction hover simulation, prevent navigation and toggle active.
    container.querySelectorAll(".menu-item-with-dropdown > a.nlink-r3").forEach((link) => {
      link.addEventListener("click", (e) => {
        const dropdown = link.nextElementSibling;
        const isVisible = window.getComputedStyle(dropdown).visibility === "visible" || dropdown.classList.contains("active");
        if (!isVisible) {
          e.preventDefault();
          // Hide any other active dropdowns
          container.querySelectorAll(".mega-dropdown.active").forEach((el) => {
            if (el !== dropdown) el.classList.remove("active");
          });
          dropdown.classList.add("active");
        }
      });
    });
  }

  function renderMobCategories() {
    const container = document.getElementById("mob-categories-accordion");
    if (!container) return;

    // Filter main menu top-level categories dynamically (no parentId)
    const mainCats = categories.filter((c) => !c.parentId);

    const lang = localStorage.getItem("megaLang") || "en";

    const accordionHtml = mainCats.map((cat, idx) => {
      const name = lang === "ar" ? cat.nameAr : cat.nameEn;
      const subs = categories.filter((c) => c.parentId === cat.id);
      const catProds = products.filter((p) => clientCategoryMatches(p, cat));

      const hasSubs = subs.length > 0;
      const hasProds = catProds.length > 0;

      if (!hasSubs && !hasProds) {
        return `
          <div class="mob-accordion-item">
            <a class="nlink-r2" style="padding: 0; font-size: 16px; font-weight: 600;" href="${shopPath}?cat=${cat.slug}" onclick="toggleMobDrawer()" data-ar="${cat.nameAr}" data-en="${cat.nameEn}">${name}</a>
          </div>
        `;
      }

      return `
        <div class="mob-accordion-item">
          <div class="mob-accordion-title" onclick="toggleMobAccordion(${idx})">
            <span data-ar="${cat.nameAr}" data-en="${cat.nameEn}">${name}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
               <polyline points="6,9 12,15 18,9"/>
            </svg>
          </div>
          <div class="mob-accordion-content" id="mob-acc-${idx}">
            ${hasSubs ? `
              <div style="font-weight: 700; font-size: 11px; text-transform: uppercase; color: var(--o); margin-top: 5px;" data-ar="تسوق بالقطعة" data-en="Shop by piece">${lang === "ar" ? "تسوق بالقطعة" : "Shop by piece"}</div>
              ${subs.map((s) => `
                <a class="mega-link" href="${shopPath}?cat=${s.slug}" onclick="toggleMobDrawer()" data-ar="${s.nameAr}" data-en="${s.nameEn}">${lang === "ar" ? s.nameAr : s.nameEn}</a>
              `).join("")}
            ` : ""}
            ${hasProds ? `
              <div style="font-weight: 700; font-size: 11px; text-transform: uppercase; color: var(--o); margin-top: 10px;" data-ar="منتجات مميزة" data-en="Featured Products">${lang === "ar" ? "منتجات مميزة" : "Featured Products"}</div>
              ${catProds.slice(0, 3).map((p) => {
                const pName = lang === "ar" ? p.nameAr || p.nameEn : p.nameEn || p.nameAr;
                const pPrice = p.salePrice || p.price;
                return `
                  <a class="mega-link" href="${isSubPage ? "" : "pages/"}product.html?id=${p.id}" onclick="toggleMobDrawer()" data-ar="${p.nameAr}" data-en="${p.nameEn}">${pName} - EGP ${Number(pPrice).toLocaleString()}</a>
                `;
              }).join("")}
            ` : ""}
          </div>
        </div>
      `;
    }).join("");

    container.innerHTML = accordionHtml;
  }

  // Global Mob Drawer Toggles
  window.toggleMobDrawer = function () {
    const d = document.getElementById("mob-drawer");
    if (d) d.classList.toggle("open");
    const o = document.getElementById("mob-overlay");
    if (o) o.classList.toggle("open");
    const h = document.getElementById("hbg");
    if (h) h.classList.toggle("open");
  };

  // Global interceptor to fix announcement bar language toggling across ALL pages
  document.addEventListener("click", function(e) {
    if (e.target.closest("#langbtn") || e.target.closest(".langbtn")) {
       setTimeout(() => {
          fetch("/api/announcement").then(r => r.json()).then(ann => {
             if (!ann || !ann.active) return;
             const l = localStorage.getItem("megaLang") || "en";
             const msg = l === "ar" ? ann.message_ar : ann.message_en;
             if (!msg) return;
             let html = msg;
             if (ann.link) {
               const lt = l === "ar" ? (ann.linkText_ar || ann.linkText_en) : (ann.linkText_en || ann.linkText_ar);
               if (lt) html += ` <a href="${ann.link}" style="color:var(--o);text-decoration:none;font-weight:500;margin-inline-start:8px">${lt}</a>`;
             }
             const container = document.getElementById("gen-ann-msg-container");
             if (container) {
               let unitHtml = `<span class="ann-item">${html}</span><span class="ann-bullet">&bull;</span>`;
               let half = unitHtml.repeat(4);
               container.innerHTML = half + half;
             }
          }).catch(()=>{});
       }, 50);
    }
  });

  window.toggleMobAccordion = function (idx) {
    const content = document.getElementById(`mob-acc-${idx}`);
    if (content) {
      content.classList.toggle("open");
    }
  };

  // Live Header Search Autocomplete
  let searchProductsCache = null;
  async function fetchSearchProducts() {
    if (searchProductsCache) return searchProductsCache;
    try {
      const res = await fetch(apiBase + "/api/products");
      if (res.ok) {
        searchProductsCache = await res.json();
      }
    } catch(e) {}
    return searchProductsCache || [];
  }

  function initHeaderSearch() {
    const input = document.getElementById("srch-nav");
    const dropdown = document.getElementById("nav-search-dropdown");
    if (!input || !dropdown) return;

    let timer = null;

    input.addEventListener("input", () => {
      if (typeof applyFilters === "function") applyFilters();
      clearTimeout(timer);
      const q = input.value.trim().toLowerCase();
      if (!q) {
        dropdown.classList.remove("active");
        dropdown.innerHTML = "";
        return;
      }
      timer = setTimeout(async () => {
        const products = await fetchSearchProducts();
        const curLang = localStorage.getItem("megaLang") || "en";
        const matches = products.filter(p => {
          const name = ((p.nameAr || "") + " " + (p.nameEn || "") + " " + (p.descriptionAr || "") + " " + (p.descriptionEn || "") + " " + (p.categories || []).join(" ")).toLowerCase();
          return name.includes(q);
        }).slice(0, 6);

        if (!matches.length) {
          dropdown.innerHTML = `<div style="padding:16px; text-align:center; font-size:13px; color:var(--tm);">${curLang === "ar" ? "لا توجد نتائج" : "No products found"}</div>`;
          dropdown.classList.add("active");
          return;
        }

        const itemsHtml = matches.map(p => {
          const title = curLang === "ar" ? (p.nameAr || p.nameEn) : (p.nameEn || p.nameAr);
          let rawImg = p.mainPhoto || (p.photos && p.photos[0]) || p.image || (p.images && p.images[0]) || "";
          let img = rawImg ? iu(rawImg) : (isSubPage ? "../logos/mega-logo.jpg" : "logos/mega-logo.jpg");
          const prodUrl = isSubPage ? `product.html?id=${p.id}` : `pages/product.html?id=${p.id}`;
          return `
            <a class="search-res-item" href="${prodUrl}">
              <img class="search-res-img" src="${img}" alt="${title}" onerror="this.src='${isSubPage?'../logos/mega-logo.jpg':'logos/mega-logo.jpg'}'" />
              <div class="search-res-info">
                <span class="search-res-title">${title}</span>
                <span class="search-res-price">EGP ${Number(p.price||0).toLocaleString()}</span>
              </div>
            </a>
          `;
        }).join("");

        const viewAllText = curLang === "ar" ? `عرض كل النتائج (${matches.length}+) ←` : `View all results (${matches.length}+) →`;
        const viewAllUrl = `${shopPath}?search=${encodeURIComponent(q)}`;

        dropdown.innerHTML = itemsHtml + `<a class="search-res-more" href="${viewAllUrl}">${viewAllText}</a>`;
        dropdown.classList.add("active");
      }, 180);
    });

    document.addEventListener("click", (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove("active");
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        dropdown.classList.remove("active");
      }
    });
  }

  // Wishlist Badge Sync
  window.updWbadge = function () {
    try {
      const wish = JSON.parse(localStorage.getItem("megaWish") || "[]");
      const b = document.getElementById("wbadge");
      if (b) {
        b.textContent = wish.length > 0 ? wish.length : "0";
        b.style.display = wish.length > 0 ? "flex" : "none";
      }
    } catch (e) {}
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", window.updWbadge);
  } else {
    window.updWbadge();
  }

  // Initialize search after DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHeaderSearch);
  } else {
    initHeaderSearch();
  }

  // Close active dropdowns when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".menu-item-with-dropdown")) {
      document.querySelectorAll(".mega-dropdown.active").forEach((el) => {
        el.classList.remove("active");
      });
    }
  });
})();
