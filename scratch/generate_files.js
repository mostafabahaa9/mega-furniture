const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'all_items.json'), 'utf8'));

let md = '# 🛋️ Mega Furniture Full Catalog & Dimensions Reference\n\n';
md += 'All categories, furniture items, SKUs, and expected piece dimensions compiled from live shop catalog.\n\n';

let csvLines = ['Category,Item Name,SKU,Dimensions / Piece Details'];

for (const catKey in data) {
  const cat = data[catKey];
  md += `## ${cat.categoryName}\n\n`;
  md += '| Item Name | SKU | Dimensions & Piece Breakdown |\n';
  md += '| :--- | :--- | :--- |\n';

  cat.items.forEach(item => {
    const name = item.nameEn || item.nameAr || item.sku;
    let dimsStr = 'Dimensions not specified';
    const d = item.dimensions;

    if (d && d.pieces && d.pieces.length > 0) {
      dimsStr = d.pieces.map(pc => {
        const parts = [];
        if (pc.width) parts.push('W:' + pc.width + 'cm');
        if (pc.length) parts.push('L:' + pc.length + 'cm');
        if (pc.depth) parts.push('D:' + pc.depth + 'cm');
        if (pc.height) parts.push('H:' + pc.height + 'cm');
        const pName = pc.nameEn || pc.nameAr || 'Piece';
        return pName + ' (' + (parts.join(' x ') || 'N/A') + ')';
      }).join('; ');
    } else if (d) {
      const parts = [];
      if (d.width) parts.push('W:' + d.width + 'cm');
      if (d.length) parts.push('L:' + d.length + 'cm');
      if (d.depth) parts.push('D:' + d.depth + 'cm');
      if (d.height) parts.push('H:' + d.height + 'cm');
      if (parts.length) dimsStr = parts.join(' x ');
    }

    md += `| **${name}** | \`${item.sku}\` | ${dimsStr} |\n`;

    const safeCat = (cat.categoryName || catKey).replace(/"/g, '""');
    const safeName = name.replace(/"/g, '""');
    const safeSku = (item.sku || '').replace(/"/g, '""');
    const safeDims = dimsStr.replace(/"/g, '""');
    csvLines.push(`"${safeCat}","${safeName}","${safeSku}","${safeDims}"`);
  });

  md += '\n';
}

const artifactPath = 'C:\\Users\\ME\\.gemini\\antigravity\\brain\\f3f29cbf-c52a-4e58-b53f-8b5bc2633caa\\mega_furniture_catalog_dimensions.md';
fs.writeFileSync(artifactPath, md, 'utf8');

const csvPath = path.join(__dirname, 'mega_furniture_catalog_dimensions.csv');
fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf8');

console.log('Successfully created artifact and CSV file!');
