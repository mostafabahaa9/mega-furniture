const fs = require('fs');

let c = fs.readFileSync('pages/shop.html', 'utf8');

if (!c.includes('function changeCardImg')) {
  const fn = `
      window.changeCardImg = function(imgId, src, elem) {
        const img = document.getElementById(imgId);
        if (img) img.src = src;
        if (elem) {
          const container = elem.parentElement;
          container.querySelectorAll('.pswatch').forEach(el => el.style.borderColor = 'var(--b)');
          elem.style.borderColor = 'var(--t)';
        }
      };
      function variantsToLegacy(variants) {`;
  c = c.replace('function variantsToLegacy(variants) {', fn);
  fs.writeFileSync('pages/shop.html', c, 'utf8');
  console.log('Fixed shop.html global function');
}
