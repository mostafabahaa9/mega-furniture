const fs = require('fs');
let code = fs.readFileSync('admin.html', 'utf8');

const startIndex = code.indexOf('async function loadPromoBanners()');
let jsBlock = '';

if (startIndex !== -1) {
    // Find the end of this block by looking for the next function or section
    // In admin.html, it's followed by `// ── BANNERS ──` or similar
    const endIndex = code.indexOf('\n      // ──', startIndex);
    if (endIndex !== -1) {
        // the comment // ── PROMO BANNERS ── is before loadPromoBanners()
        const actualStart = code.lastIndexOf('// ──', startIndex);
        if (actualStart !== -1) {
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
            
            if (!code.includes('loadOffersBanners')) {
                 console.log('loadOffersBanners not found globally, something went wrong earlier');
            }
            if (!code.includes('OFFERS BANNERS ──')) {
               code = code.slice(0, endIndex) + '\n      ' + newJs + code.slice(endIndex);
            }
        }
    }
}

fs.writeFileSync('admin.html', code, 'utf8');
console.log('Injected offers banners JS logic');
