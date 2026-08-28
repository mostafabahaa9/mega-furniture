const fs = require('fs');
let code = fs.readFileSync('admin.html', 'utf8');

// Sidebar link
const sidebarRegex = /<button class=\"slink\" onclick=\"goto\('promo-banners'\)\">[\s\S]*?<\/button>/;
const sidebarMatch = code.match(sidebarRegex);
if (sidebarMatch) {
  const newSidebar = sidebarMatch[0]
    .replace('promo-banners', 'offers-banners')
    .replace('Promo Banners', 'Offers Banners')
    .replace('بانرات', 'بانرات العروض');
  code = code.replace(sidebarMatch[0], sidebarMatch[0] + '\n          ' + newSidebar);
}

// Panel HTML
const panelRegex = /<!-- PROMO BANNERS -->[\s\S]*?<\/div>\s*(?=<!--)/;
const panelMatch = code.match(panelRegex);
if (panelMatch) {
  const newPanel = panelMatch[0]
    .replace(/PROMO BANNERS/g, 'OFFERS BANNERS')
    .replace(/promo-banners/g, 'offers-banners')
    .replace(/promo-banner/g, 'offers-banner')
    .replace(/Promo Banners/g, 'Offers Banners')
    .replace(/Promo Banner/g, 'Offers Banner')
    .replace(/openPromoBannerModal/g, 'openOffersBannerModal');
  code = code.replace(panelMatch[0], panelMatch[0] + '\n          ' + newPanel);
}

// Modal HTML
const modalRegex = /<!-- PROMO BANNER MODAL -->[\s\S]*?<\/div>\s*<\/div>\s*(?=<!--)/;
const modalMatch = code.match(modalRegex);
if (modalMatch) {
  const newModal = modalMatch[0]
    .replace(/PROMO BANNER MODAL/g, 'OFFERS BANNER MODAL')
    .replace(/promo-banner/g, 'offers-banner')
    .replace(/Promo Banner/g, 'Offers Banner')
    .replace(/closePromoBannerModal/g, 'closeOffersBannerModal')
    .replace(/handlePromoBannerPhotoSelect/g, 'handleOffersBannerPhotoSelect')
    .replace(/savePromoBanner/g, 'saveOffersBanner');
  code = code.replace(modalMatch[0], modalMatch[0] + '\n    ' + newModal);
}

// JS vars
code = code.replace('allPromoBanners = [],', 'allPromoBanners = [],\n        allOffersBanners = [],');
code = code.replace('editingPromoBannerId = null;', 'editingPromoBannerId = null,\n        editingOffersBannerId = null;');
code = code.replace('promoBannerPhotoData = null,', 'promoBannerPhotoData = null,\n        offersBannerPhotoData = null,');
code = code.replace('loadPromoBanners();', 'loadPromoBanners();\n        loadOffersBanners();');
code = code.replace('"promo-banners": {', '"offers-banners": { title: "Offers Banners", sub: "Manage offers page banners" },\n        "promo-banners": {');

// JS logic block
const jsRegex = /\/\/ ── PROMO BANNERS ──[\s\S]*?(?=\/\/ ──)/;
const jsMatch = code.match(jsRegex);
if (jsMatch) {
  const newJs = jsMatch[0]
    .replace(/PROMO BANNERS/g, 'OFFERS BANNERS')
    .replace(/PromoBanners/g, 'OffersBanners')
    .replace(/promoBanner/g, 'offersBanner')
    .replace(/PromoBanner/g, 'OffersBanner')
    .replace(/promo-banners/g, 'offers-banners')
    .replace(/promo-banner/g, 'offers-banner')
    .replace(/Promo banner/g, 'Offers banner')
    .replace(/Promo Banner/g, 'Offers Banner');
  code = code.replace(jsMatch[0], jsMatch[0] + '\n      ' + newJs);
}

fs.writeFileSync('admin.html', code, 'utf8');
console.log('Modified admin.html to add Offers Banners');
