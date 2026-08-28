const fs = require('fs');
let code = fs.readFileSync('admin.html', 'utf8');

const startIndex = code.indexOf('async function loadPromoBanners()');
const actualStart = code.lastIndexOf('// ', startIndex);
const endIndex = code.indexOf('\n      // ', startIndex);
const block = code.substring(actualStart, endIndex);

const newJs = block
    .replace(/PROMO BANNERS/g, 'OFFERS BANNERS')
    .replace(/PromoBanners/g, 'OffersBanners')
    .replace(/promoBanner/g, 'offersBanner')
    .replace(/PromoBanner/g, 'OffersBanner')
    .replace(/promo-banners/g, 'offers-banners')
    .replace(/promo-banner/g, 'offers-banner')
    .replace(/Promo banner/g, 'Offers banner')
    .replace(/Promo Banner/g, 'Offers Banner');

// We will explicitly append it right before the endIndex.
if (!code.includes('loadOffersBanners() {')) {
    code = code.slice(0, endIndex) + '\n      ' + newJs + code.slice(endIndex);
}

fs.writeFileSync('admin.html', code, 'utf8');
console.log('Injected offers banners JS logic forcefully');
