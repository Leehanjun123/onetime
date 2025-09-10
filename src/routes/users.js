const express = require('express');
const router = express.Router();

// 0ø ¬© |°0
router.get('/profile', (req, res) => {
  res.json({ message: 'User profile endpoint - Coming soon' });
});

router.put('/profile', (req, res) => {
  res.json({ message: 'Update profile endpoint - Coming soon' });
});

module.exports = router;