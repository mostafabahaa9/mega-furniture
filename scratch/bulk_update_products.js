const fs = require('fs');
const path = require('path');

const PRODUCTS_PATH = path.join(__dirname, '../data/products.json');
const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));

const CATEGORY_DEFAULTS = {
  "bedroom": {
    specStructureAr: "خشب زان أحمر كابوتونيه عالي الجودة مع MDF ميلامين مقاوم للرطوبة والصدمات.",
    specStructureEn: "High-quality Red Beech wood frame with moisture-resistant melamine MDF.",
    specFabricAr: "تنجيد قماش قطيفة/كيتان فاخر بالرأسية معالج ضد البقع والتأكل.",
    specFabricEn: "Premium stain-resistant Velvet/Linen fabric headboard upholstery.",
    specFillingAr: "إسفنج عالي الكثافة (كثافة 30 كجم/م³) لراحة ومتانة ممتدة.",
    specFillingEn: "High-density 30 kg/m³ foam for long-lasting ergonomic support.",
    specDimensionsNoteAr: "الأبعاد والقطع قابلة للتعديل حسب الطلب والمساحة المتاحة.",
    specDimensionsNoteEn: "Dimensions and set components can be customized upon request.",
    productCareAr: "التنظيف بممسحة قماشية جافة ناعمة وتجنب استخدام المواد الكيميائية القاسية.",
    productCareEn: "Wipe with a soft dry cloth. Avoid harsh chemical cleaners.",
    pieces: [
      { nameEn: "Bed", nameAr: "السرير", width: 160, length: 195, depth: null, height: 120 },
      { nameEn: "Wardrobe", nameAr: "الدولاب", width: 240, length: null, depth: 60, height: 220 },
      { nameEn: "Nightstand", nameAr: "كومود", width: 50, length: null, depth: 40, height: 45 },
      { nameEn: "Dressing Table", nameAr: "تسريحة", width: 120, length: null, depth: 45, height: 80 }
    ]
  },
  "beds": {
    specStructureAr: "شاسيه خشب زان أحمر كابوتونيه متين وقواعد مولل خشبية قوية.",
    specStructureEn: "Sturdy Red Beechwood frame with solid wooden slats support.",
    specFabricAr: "قماش كيتان / قطيفة عالي الجودة معالج ضد البقع والأتربة.",
    specFabricEn: "Stain and dust resistant premium Linen/Velvet upholstery fabric.",
    specFillingAr: "طبقات إسفنج مرن عالي الكثافة لحماية مريحة.",
    specFillingEn: "High-resilience cushion foam layer.",
    specDimensionsNoteAr: "مقاس السرير يتناسب مع المراتب القياسية.",
    specDimensionsNoteEn: "Fits standard mattress sizing.",
    productCareAr: "تنظيف جاف للبقع، والتنظيف الدوري بالمكنسة الكهربائية.",
    productCareEn: "Spot clean with damp cloth, vacuum regularly.",
    dimensions: { width: 160, length: 200, depth: null, height: 120, pieces: [] }
  },
  "living-room": {
    specStructureAr: "هيكل داخلي من خشب الزان الأحمر وأربطة مرنة عالية التحمل.",
    specStructureEn: "Internal frame of kiln-dried Red Beechwood with heavy-duty elastic webbing.",
    specFabricAr: "قماش كيتان فاخر قابل للتنظيف ومقاوم للتأكل والتمزق.",
    specFabricEn: "Premium breathable Linen fabric, abrasion and tear resistant.",
    specFillingAr: "إسفنج عالي الكثافة (كثافة 33 كجم/م³) مع طبقة فيبر ناعمة.",
    specFillingEn: "High-density 33 kg/m³ foam with plush top fiber layer.",
    specDimensionsNoteAr: "الأبعاد تشمل الكنب والفوتيهات حسب مكونات الطقم.",
    specDimensionsNoteEn: "Dimensions include sofas and armchairs as per set components.",
    productCareAr: "تنظيف جاف فقط أو استخدام منظفات الأقمشة الرغوية المخصصة.",
    productCareEn: "Dry clean only or use foam fabric cleaners.",
    pieces: [
      { nameEn: "Three Seater Sofa", nameAr: "كنبة ثلاثية", width: 220, length: 90, depth: null, height: 85 },
      { nameEn: "Two Seater Sofa", nameAr: "كنبة ثنائية", width: 170, length: 90, depth: null, height: 85 },
      { nameEn: "Armchair", nameAr: "فوتيه", width: 85, length: 85, depth: null, height: 85 }
    ]
  },
  "lcorner": {
    specStructureAr: "هيكل خشب زان أحمر معالج مع شيزلونج مريح وقواعد تثبيت قوية.",
    specStructureEn: "Treated Red Beechwood frame with ergonomic chaise lounge.",
    specFabricAr: "قماش كيتان / جلد مقلوب عالي التحمل وسهل التنظيف.",
    specFabricEn: "Heavy-duty, easy-clean Linen / Suede fabric.",
    specFillingAr: "إسفنج مضغوط عالي الكثافة لراحة الظهر والجلسة.",
    specFillingEn: "High-density compressed foam for back and seat comfort.",
    specDimensionsNoteAr: "اتجاه الشيزلونج (يمين/شمال) يحدد عند المواجهة.",
    specDimensionsNoteEn: "Chaise lounge arrangement (Left/Right) is determined when facing the sofa.",
    productCareAr: "تنظيف جاف باستخدام مسحوق تنظيف الأقمشة والجاف.",
    productCareEn: "Dry clean using dedicated upholstery foam cleaner.",
    dimensions: { width: 300, length: 200, depth: null, height: 85, pieces: [] }
  },
  "sofa": {
    specStructureAr: "هيكل خشبي متين من الزان الأحمر مع أرجل مقواة.",
    specStructureEn: "Solid Red Beechwood frame with reinforced legs.",
    specFabricAr: "قماش كيتان فاخر ناعم الملمس وسهل العناية.",
    specFabricEn: "Soft-touch premium Linen fabric, easy to maintain.",
    specFillingAr: "إسفنج عالي الكثافة (كثافة 33) لراحة فاخرة.",
    specFillingEn: "High-density 33 density foam for plush seating comfort.",
    specDimensionsNoteAr: "أبعاد قياسية مريحة تناسب مختلف مساحات غرف المعيشة.",
    specDimensionsNoteEn: "Standard comfortable dimensions suitable for various living spaces.",
    productCareAr: "التنظيف بالمكنسة الكهربائية والمسح الفوري للبقع.",
    productCareEn: "Vacuum regularly and wipe spills immediately.",
    dimensions: { width: 220, length: null, depth: 90, height: 85, pieces: [] }
  },
  "dining-room": {
    specStructureAr: "خشب زان أحمر طبيعي مع قشرة أروا فاخرة ومفصلات هيدروليك ناعمة.",
    specStructureEn: "Solid Red Beechwood with natural Oak veneer and soft-close hydraulic hinges.",
    specFabricAr: "الكراسي منجدة بقماش جلد مقلوب أو قطيفة معالج ضد السوائل.",
    specFabricEn: "Dining chairs upholstered in liquid-repellent Suede/Velvet fabric.",
    specFillingAr: "حشو مقاعد الكراسي إسفنج مضغوط كثافة 30.",
    specFillingEn: "Chair seats padded with high-density 30 foam.",
    specDimensionsNoteAr: "الطقم يضم طاولة السفرة، والبوفيه، وكراسي السفرة.",
    specDimensionsNoteEn: "Set includes Dining Table, Buffet, and Dining Chairs.",
    productCareAr: "مسح الخشب بملمع الأثاث المخصص وتجنب السوائل الحارقة.",
    productCareEn: "Use specialized wood polish and avoid corrosive liquids.",
    pieces: [
      { nameEn: "Dining Table", nameAr: "طاولة سفرة", width: 180, length: 90, depth: null, height: 78 },
      { nameEn: "Buffet", nameAr: "بوفيه", width: 200, length: null, depth: 45, height: 90 }
    ]
  },
  "buffet": {
    specStructureAr: "خشب زان أحمر وقشرة أروا طبيعية مع أدراج هيدروليكية ومقابض مودرن.",
    specStructureEn: "Red Beechwood with natural Oak veneer, hydraulic drawers and modern handles.",
    specFabricAr: "لا يوجد (هيكل خشبي كامل).",
    specFabricEn: "N/A (Full wooden structure).",
    specFillingAr: "لا يوجد.",
    specFillingEn: "N/A.",
    specDimensionsNoteAr: "يوفر مساحات تخزين متعددة وأرفف داخلية واسعة.",
    specDimensionsNoteEn: "Provides ample storage space with wide internal shelves.",
    productCareAr: "مسح السطح بقطعة قماش دقيقة الألياف ناعمة.",
    productCareEn: "Wipe surfaces with a soft microfiber cloth.",
    dimensions: { width: 180, length: null, depth: 45, height: 90, pieces: [] }
  },
  "tv-unit": {
    specStructureAr: "هيكل خشب كونتر زان وميلامين مع أدراج ميكانيكية سلسة الحركة.",
    specStructureEn: "Counter Beechwood and melamine structure with smooth ball-bearing drawers.",
    specFabricAr: "لا يوجد (هيكل خشبي بالكامل).",
    specFabricEn: "N/A (Solid wood & veneer structure).",
    specFillingAr: "لا يوجد.",
    specFillingEn: "N/A.",
    specDimensionsNoteAr: "تتسع لشاشات التلفزيون حتى 75 بوصة مع فتحات لإخفاء الأسلاك.",
    specDimensionsNoteEn: "Accommodates TVs up to 75 inches with cable management holes.",
    productCareAr: "التنظيف بقطعة قماش دقيقة الألياف (مايكروفايبر) جافة.",
    productCareEn: "Dust with a dry microfiber cloth.",
    dimensions: { width: 180, length: null, depth: 40, height: 45, pieces: [] }
  },
  "office": {
    specStructureAr: "خشب MDF ميلامين عالي الجودة مقاوِم للخدش مع أرجل معدنية إلكتروستاتيك.",
    specStructureEn: "Scratch-resistant melamine MDF with electrostatic steel legs.",
    specFabricAr: "تنجيد كرسي المكتب بقماش شبكي هواء (Mesh) للتنفس.",
    specFabricEn: "Desk chair upholstered in breathable Mesh fabric.",
    specFillingAr: "إسفنج عالي الكثافة لكرسي المكتب مريح للظهر.",
    specFillingEn: "High-density ergonomic seat foam.",
    specDimensionsNoteAr: "المكتب مزود بوحدة أدراج جانبيّة متحركة أو ثابتة.",
    specDimensionsNoteEn: "Desk includes attached or mobile pedestal drawers.",
    productCareAr: "المسح بمنظف الأسطح المتعدد الاستخدامات وجفافه فوراً.",
    productCareEn: "Wipe with multi-surface cleaner and dry immediately.",
    dimensions: { width: 140, length: null, depth: 60, height: 75, pieces: [] }
  },
  "kids/teens-room": {
    specStructureAr: "خشب زان وميلامين صديق للبيئة وآمن للأطفال بحواف دائرية.",
    specStructureEn: "Eco-friendly Beechwood and melamine with child-safe rounded edges.",
    specFabricAr: "قماش قطني معالج ناعم وسهل التنظيف.",
    specFabricEn: "Soft, easy-to-clean cotton-blend fabric.",
    specFillingAr: "إسفنج مرن عالي الجودة وصحي للظهر.",
    specFillingEn: "Elastic, spine-supportive foam.",
    specDimensionsNoteAr: "الغرفة تشمل سريرين، دولاب، وكومود أو مكتب دراسة.",
    specDimensionsNoteEn: "Includes twin beds, wardrobe, and nightstand or study desk.",
    productCareAr: "سهولة التنظيف بماء دافئ وصابون خفيف.",
    productCareEn: "Easy to clean with warm water and mild soap.",
    pieces: [
      { nameEn: "Bed", nameAr: "السرير", width: 120, length: 195, depth: null, height: 110 },
      { nameEn: "Wardrobe", nameAr: "الدولاب", width: 160, length: null, depth: 50, height: 200 }
    ]
  },
  "shoe-cabinet": {
    specStructureAr: "خشب كونتر/MDF ميلامين مع أرفف داخلية متعددة وآلية فتح هيدروليكية.",
    specStructureEn: "Melamine Counter/MDF wood with adjustable internal shelves.",
    specFabricAr: "لا يوجد.",
    specFabricEn: "N/A.",
    specFillingAr: "لا يوجد.",
    specFillingEn: "N/A.",
    specDimensionsNoteAr: "تتسع لـ 15 إلى 25 زوجاً من الأحذية.",
    specDimensionsNoteEn: "Capacity: Holds 15 to 25 pairs of shoes.",
    productCareAr: "التهوية الدورية والمسح بقطعة قماش جافة.",
    productCareEn: "Air periodically and wipe with a dry cloth.",
    dimensions: { width: 100, length: null, depth: 35, height: 120, pieces: [] }
  },
  "matters": {
    specStructureAr: "شاسيه سوست بوكيت منفصلة/متصلة نبال ألمانية مع طبقات لباد عازل.",
    specStructureEn: "Pocket/Bonnell German steel springs with protective felt insulation layers.",
    specFabricAr: "قماش دبل نت فاخر معالج ضد البكتيريا وحشرات الفراش.",
    specFabricEn: "Premium antibacterial & hypoallergenic knitted fabric.",
    specFillingAr: "إسفنج عالي الكثافة 30 + طبقة فيبر ناعمة التنجيد (ارتفاع 26 سم).",
    specFillingEn: "High-density 30 foam + plush fiber quilting (26 cm total height).",
    specDimensionsNoteAr: "متوفرة بكافة المقاسات القياسية بالطلب.",
    specDimensionsNoteEn: "Available in all standard mattress sizes upon order.",
    productCareAr: "تدوير المرتبة كل 3 أشهر وتجنب القفز عليها.",
    productCareEn: "Rotate mattress every 3 months; do not bend or fold.",
    dimensions: { width: 160, length: 195, depth: null, height: 26, pieces: [] }
  },
  "chair": {
    specStructureAr: "أرجل خشب زان أحمر طبيعي مع هيكل متين.",
    specStructureEn: "Natural Red Beechwood legs with sturdy inner frame.",
    specFabricAr: "قماش قطيفة / جلد مقلوب فاخر معالج ضد البقع.",
    specFabricEn: "Premium stain-resistant Velvet / Suede fabric.",
    specFillingAr: "إسفنج عالي الكثافة (كثافة 30 كجم/م³) لراحة الجلوس.",
    specFillingEn: "High-density 30 kg/m³ seating foam.",
    specDimensionsNoteAr: "تصميم مريح للظهر والجلسة.",
    specDimensionsNoteEn: "Ergonomic seating and back support design.",
    productCareAr: "تنظيف جاف للبقع ومسح الأرجل بمقماش ناعم.",
    productCareEn: "Spot clean stains, wipe legs with a soft cloth.",
    dimensions: { width: 75, length: 80, depth: null, height: 80, pieces: [] }
  },
  "tables": {
    specStructureAr: "هيكل خشبي من الزان الأحمر أو المعدن المقاوم للرؤية والخدوش.",
    specStructureEn: "Solid Red Beechwood or scratch-resistant metal frame.",
    specFabricAr: "لا يوجد.",
    specFabricEn: "N/A.",
    specFillingAr: "لا يوجد.",
    specFillingEn: "N/A.",
    specDimensionsNoteAr: "سطح خشب متين وعالي التحمل.",
    specDimensionsNoteEn: "Durable high-strength wooden top.",
    productCareAr: "مسح السطح بقطعة قماش ناعمة جافة.",
    productCareEn: "Wipe top with a soft dry cloth.",
    dimensions: { width: 80, length: 60, depth: null, height: 60, pieces: [] }
  },
  "dressing": {
    specStructureAr: "خشب كونتر وزان مع زجاج شفاف أو مضلع وأرفف ملابس متعددة.",
    specStructureEn: "Counter and Beechwood with clear/fluted glass and clothing organizers.",
    specFabricAr: "لا يوجد.",
    specFabricEn: "N/A.",
    specFillingAr: "لا يوجد.",
    specFillingEn: "N/A.",
    specDimensionsNoteAr: "سعة تخزينية واسعة للملابس والأغراض الشخصية.",
    specDimensionsNoteEn: "Spacious storage capacity for clothes and personal belongings.",
    productCareAr: "مسح الزجاج بمُنظف الزجاج المخصص والخشب بقماش جاف.",
    productCareEn: "Clean glass with glass cleaner and wipe wood with dry cloth.",
    dimensions: { width: 240, length: null, depth: 60, height: 240, pieces: [] }
  }
};

const DEFAULT_GENERIC = {
  specStructureAr: "خشب زان أحمر عالي الجودة مع MDF ميلامين فاخر.",
  specStructureEn: "High-quality Red Beechwood with premium melamine MDF.",
  specFabricAr: "قماش فاخر معالج عالي التحمل.",
  specFabricEn: "Premium treated durable fabric.",
  specFillingAr: "إسفنج مرن عالي الكثافة (كثافة 30 كجم/م³).",
  specFillingEn: "High-density 30 kg/m³ elastic foam.",
  specDimensionsNoteAr: "مصنع وفق أعلى معايير الجودة والأبعاد القياسية.",
  specDimensionsNoteEn: "Manufactured to standard high-quality specifications.",
  productCareAr: "التنظيف بممسحة قماشية جافة ناعمة.",
  productCareEn: "Wipe with a soft dry cloth."
};

let updatedCount = 0;

products.forEach(p => {
  const cats = p.categories || [];
  let defaults = null;
  for (const cat of cats) {
    if (CATEGORY_DEFAULTS[cat]) {
      defaults = CATEGORY_DEFAULTS[cat];
      break;
    }
  }

  // Fallback category detection from SKU / Name if categories array is empty
  if (!defaults) {
    const sku = (p.sku || '').toUpperCase();
    const name = (p.nameEn || p.nameAr || '').toLowerCase();
    if (sku.includes('BEDROOM') || name.includes('bedroom')) defaults = CATEGORY_DEFAULTS['bedroom'];
    else if (sku.includes('BED') || name.includes('bed')) defaults = CATEGORY_DEFAULTS['beds'];
    else if (sku.includes('SOFA') || name.includes('sofa')) defaults = CATEGORY_DEFAULTS['sofa'];
    else if (sku.includes('LSHAPE') || name.includes('lshape') || name.includes('corner')) defaults = CATEGORY_DEFAULTS['lcorner'];
    else if (sku.includes('LIVING') || name.includes('living')) defaults = CATEGORY_DEFAULTS['living-room'];
    else if (sku.includes('DINNING') || sku.includes('DINING') || name.includes('dinning') || name.includes('dining')) defaults = CATEGORY_DEFAULTS['dining-room'];
    else if (sku.includes('BUFFET') || name.includes('buffet')) defaults = CATEGORY_DEFAULTS['buffet'];
    else if (sku.includes('UNIT') || name.includes('tv')) defaults = CATEGORY_DEFAULTS['tv-unit'];
    else if (sku.includes('OFFICE') || name.includes('office')) defaults = CATEGORY_DEFAULTS['office'];
    else if (sku.includes('KROOM') || name.includes('kids')) defaults = CATEGORY_DEFAULTS['kids/teens-room'];
    else if (sku.includes('SCABINET') || name.includes('shoe')) defaults = CATEGORY_DEFAULTS['shoe-cabinet'];
    else if (sku.includes('MATTRESS') || name.includes('mattress')) defaults = CATEGORY_DEFAULTS['matters'];
    else if (sku.includes('CHAIR') || name.includes('chair')) defaults = CATEGORY_DEFAULTS['chair'];
    else if (sku.includes('TABLE') || name.includes('table')) defaults = CATEGORY_DEFAULTS['tables'];
    else if (sku.includes('DRESSING') || name.includes('dressing')) defaults = CATEGORY_DEFAULTS['dressing'];
  }

  if (!defaults) defaults = DEFAULT_GENERIC;

  // Apply Specs & Care if empty
  if (!p.specStructureAr) p.specStructureAr = defaults.specStructureAr;
  if (!p.specStructureEn) p.specStructureEn = defaults.specStructureEn;
  if (!p.specFabricAr) p.specFabricAr = defaults.specFabricAr;
  if (!p.specFabricEn) p.specFabricEn = defaults.specFabricEn;
  if (!p.specFillingAr) p.specFillingAr = defaults.specFillingAr;
  if (!p.specFillingEn) p.specFillingEn = defaults.specFillingEn;
  if (!p.specDimensionsNoteAr) p.specDimensionsNoteAr = defaults.specDimensionsNoteAr;
  if (!p.specDimensionsNoteEn) p.specDimensionsNoteEn = defaults.specDimensionsNoteEn;
  if (!p.productCareAr) p.productCareAr = defaults.productCareAr;
  if (!p.productCareEn) p.productCareEn = defaults.productCareEn;

  // Apply Dimensions if empty
  const dims = p.dimensions || {};
  const hasDims = (dims.width || dims.length || dims.height || (dims.pieces && dims.pieces.length));

  if (!hasDims) {
    if (defaults.pieces) {
      p.dimensions = { length: null, width: null, depth: null, height: null, pieces: defaults.pieces };
    } else if (defaults.dimensions) {
      p.dimensions = defaults.dimensions;
    }
  }

  updatedCount++;
});

fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2), 'utf8');
console.log(`Successfully updated ${updatedCount} products in data/products.json!`);
