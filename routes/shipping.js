const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { read, write } = require('../utils/db');
const { adminAuth } = require('../middleware/auth');

/** Public: zones for checkout UI */
router.get('/shipping', (req, res) => {
  res.json(read('shipping'));
});

router.get('/admin/shipping', adminAuth, (req, res) => {
  res.json(read('shipping'));
});

router.post('/admin/shipping', adminAuth, (req, res) => {
  const zones = read('shipping');
  const { governorateAr, governorateEn, fee, etaDays } = req.body;
  if (!governorateEn && !governorateAr) return res.status(400).json({ error: 'Name required' });
  const z = {
    id: uuidv4(),
    governorateAr: governorateAr || '',
    governorateEn: governorateEn || '',
    fee: Number(fee) || 0,
    etaDays: etaDays || ''
  };
  zones.push(z);
  write('shipping', zones);
  res.status(201).json(z);
});

router.put('/admin/shipping/:id', adminAuth, (req, res) => {
  const zones = read('shipping');
  const idx = zones.findIndex(z => z.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const b = req.body;
  if (b.governorateAr !== undefined) zones[idx].governorateAr = b.governorateAr;
  if (b.governorateEn !== undefined) zones[idx].governorateEn = b.governorateEn;
  if (b.fee !== undefined) zones[idx].fee = Number(b.fee);
  if (b.etaDays !== undefined) zones[idx].etaDays = b.etaDays;
  write('shipping', zones);
  res.json(zones[idx]);
});

router.delete('/admin/shipping/:id', adminAuth, (req, res) => {
  write('shipping', read('shipping').filter(z => z.id !== req.params.id));
  res.json({ success: true });
});

module.exports = router;
