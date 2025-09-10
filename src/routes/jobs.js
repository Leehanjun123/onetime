const express = require('express');
const router = express.Router();

// 0ø ‘Å |°0
router.get('/', (req, res) => {
  res.json({ message: 'Job list endpoint - Coming soon' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create job endpoint - Coming soon' });
});

router.get('/:id', (req, res) => {
  res.json({ message: `Job ${req.params.id} endpoint - Coming soon` });
});

module.exports = router;