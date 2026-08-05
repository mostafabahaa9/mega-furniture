const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { read, write } = require('../utils/db');
const { adminAuth } = require('../middleware/auth');

router.post('/visits', (req, res) => {
  const { name, phone, preferredDate, preferredTime, numberOfPeople } = req.body;
  if (!name || !phone || !preferredDate || !preferredTime) {
    return res.status(400).json({ error: 'name, phone, preferredDate and preferredTime are required' });
  }

  const visits = read('visits');
  const visit = {
    id: uuidv4(),
    name,
    phone,
    preferredDate,
    preferredTime,
    numberOfPeople: parseInt(numberOfPeople) || 1,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  visits.push(visit);
  write('visits', visits);
  res.status(201).json({ success: true, id: visit.id });
});

router.get('/admin/visits', adminAuth, (req, res) => {
  res.json(read('visits').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

router.put('/admin/visits/:id/status', adminAuth, (req, res) => {
  const visits = read('visits');
  const idx = visits.findIndex(v => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  if (!['pending', 'confirmed', 'rejected'].includes(req.body.status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  visits[idx].status = req.body.status;
  write('visits', visits);
  res.json(visits[idx]);
});

module.exports = router;
