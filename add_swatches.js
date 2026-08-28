const fs = require('fs');

function processShop() {
  let c = fs.readFileSync('pages/shop.html', 'utf8');

  // 1. Add global changeCardImg function
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
      /* ── VARIANTS MAPPING HELPERS ── */`;
    c = c.replace('/* ── VARIANTS MAPPING HELPERS ── */', fn);
  }

  // 2. Add .pswatch CSS
  if (!c.includes('.pswatch')) {
    const css = `
      .pswatch { width:24px; height:24px; border:1px solid var(--b); border-radius:4px; cursor:pointer; padding:2px; background:var(--s); flex-shrink:0; transition: border-color 0.2s; }
      .pswatch img, .pswatch div { width:100%; height:100%; border-radius:2px; object-fit:cover; }
      .pgrid {`;
    c = c.replace('.pgrid {', css);
  }

  // 3. Inject ID into image (only for product, not set)
  c = c.replace(
    '${imgSrc ? `<img src="${imgSrc}" alt="${nm(p)}"',
    '${imgSrc ? `<img id="img-shop-${p.id}" src="${imgSrc}" alt="${nm(p)}"'
  );

  // 4. Inject swatches Html string generator
  const beforeLogic = 'const wOn = getWish().includes(p.id);';
  const newLogic = `const wOn = getWish().includes(p.id);
        
        let swatchesHtml = "";
        if (p.colors && p.colors.length > 0) {
          const displayColors = p.colors.slice(0, 5);
          const extra = p.colors.length > 5 ? p.colors.length - 5 : 0;
          const swatchItems = displayColors.map((c, idx) => {
            const cImg = c.photo ? iu(c.photo) : null;
            const inner = cImg ? \`<img src="\${cImg}">\` : \`<div style="background:\${c.hex || '#ccc'}"></div>\`;
            const srcToSwap = cImg || imgSrc;
            const bcolor = idx === 0 ? 'var(--t)' : 'var(--b)';
            return \`<div class="pswatch" style="border-color:\${bcolor}" onclick="event.stopPropagation(); changeCardImg('img-shop-\${p.id}', '\${srcToSwap}', this)" title="\${c.nameEn || c.name}">\${inner}</div>\`;
          }).join("");
          const extraHtml = extra > 0 ? \`<div style="font-size:11px;color:var(--tm);align-self:center;margin-left:4px">+\${extra}</div>\` : "";
          swatchesHtml = \`<div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">\${swatchItems}\${extraHtml}</div>\`;
        }
`;
  if (c.includes(beforeLogic) && !c.includes('swatchesHtml =')) {
    c = c.replace(beforeLogic, newLogic);
  }

  // 5. Inject swatchesHtml into card body output
  const cardBodyEnd = '        ${discLabel ? `<div style="font-size:11px;color:var(--o);margin-top:3px;font-weight:600">${discLabel}</div>` : ""}\n      </div>';
  const newCardBodyEnd = '        ${discLabel ? `<div style="font-size:11px;color:var(--o);margin-top:3px;font-weight:600">${discLabel}</div>` : ""}\n        ${swatchesHtml}\n      </div>';
  
  if (c.includes(cardBodyEnd) && !c.includes('${swatchesHtml}')) {
    c = c.replace(cardBodyEnd, newCardBodyEnd);
  }

  fs.writeFileSync('pages/shop.html', c, 'utf8');
}

function processOffers() {
  let c = fs.readFileSync('pages/offers.html', 'utf8');

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
      function renderProductCard(p) {`;
    c = c.replace('function renderProductCard(p) {', fn);
  }

  if (!c.includes('.pswatch')) {
    const css = `
      .pswatch { width:24px; height:24px; border:1px solid var(--b); border-radius:4px; cursor:pointer; padding:2px; background:var(--s); flex-shrink:0; transition: border-color 0.2s; }
      .pswatch img, .pswatch div { width:100%; height:100%; border-radius:2px; object-fit:cover; }
      .products-grid {`;
    if (c.includes('.pgrid {')) c = c.replace('.pgrid {', css);
    else c = c.replace('.products-grid {', css + '\n      .products-grid {');
  }

  c = c.replace(
    '${imgSrc ? \'<img src="\' + imgSrc',
    '${imgSrc ? \'<img id="img-offers-\'+p.id+\'" src="\' + imgSrc'
  );

  const beforeLogic = "        const wOn = (function(){ try { return JSON.parse(localStorage.getItem('megaWish')||'[]').includes(p.id); } catch(e){ return false; } })();";
  const newLogic = `        const wOn = (function(){ try { return JSON.parse(localStorage.getItem('megaWish')||'[]').includes(p.id); } catch(e){ return false; } })();
        
        let mappedColors = p.colors || [];
        if (!mappedColors.length && p.variants && p.variants.length) {
          const colorMap = new Map();
          for (const v of p.variants) {
            const cn = (v.colorName || v.colorNameAr || "").trim();
            if (cn && !colorMap.has(cn)) {
              colorMap.set(cn, { name: cn, nameEn: v.colorNameEn || "", hex: v.colorHex || "", photo: v.colorPhoto || "" });
            }
          }
          mappedColors = Array.from(colorMap.values());
        }
        
        let swatchesHtml = "";
        if (mappedColors.length > 0) {
          const displayColors = mappedColors.slice(0, 5);
          const extra = mappedColors.length > 5 ? mappedColors.length - 5 : 0;
          const swatchItems = displayColors.map((c, idx) => {
            const cImg = c.photo ? (c.photo.startsWith("http") ? c.photo : window.location.origin + "/uploads/" + c.photo) : null;
            const inner = cImg ? \`<img src="\${cImg}">\` : \`<div style="background:\${c.hex || '#ccc'}"></div>\`;
            const srcToSwap = cImg || imgSrc;
            const bcolor = idx === 0 ? 'var(--t)' : 'var(--b)';
            return \`<div class="pswatch" style="border-color:\${bcolor}" onclick="event.stopPropagation(); changeCardImg('img-offers-\${p.id}', '\${srcToSwap}', this)" title="\${c.nameEn || c.name}">\${inner}</div>\`;
          }).join("");
          const extraHtml = extra > 0 ? \`<div style="font-size:11px;color:var(--tm);align-self:center;margin-left:4px">+\${extra}</div>\` : "";
          swatchesHtml = \`<div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">\${swatchItems}\${extraHtml}</div>\`;
        }`;
        
  if (c.includes(beforeLogic) && !c.includes('swatchesHtml =')) {
     c = c.replace(beforeLogic, newLogic);
  }

  const oldBodyClosing = "            ${discLabel ? '<div style=\"font-size:11px;color:var(--o);margin-top:3px;font-weight:600\">' + discLabel + '</div>' : ''}\n          </div>";
  const newBodyClosing = "            ${discLabel ? '<div style=\"font-size:11px;color:var(--o);margin-top:3px;font-weight:600\">' + discLabel + '</div>' : ''}\n            ${swatchesHtml}\n          </div>";
          
  if (c.includes(oldBodyClosing) && !c.includes('${swatchesHtml}')) {
     c = c.replace(oldBodyClosing, newBodyClosing);
  }

  fs.writeFileSync('pages/offers.html', c, 'utf8');
}

processShop();
processOffers();
console.log('Swatches added safely');
