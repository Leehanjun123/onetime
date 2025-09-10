const express = require('express');
const router = express.Router();

// 0ø x |°0
router.post('/register', (req, res) => {
  res.json({ message: 'Register endpoint - Coming soon' });
});

router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint - Coming soon' });
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

module.exports = router;