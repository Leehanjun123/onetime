const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check - absolutely minimal
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ message: '일데이 Backend API is running!', version: '1.0.0' });
});

// Simple auth endpoints without database dependencies
app.post('/api/auth/register', (req, res) => {
  res.status(201).json({ 
    message: '회원가입이 완료되었습니다',
    user: { id: 'test', email: req.body.email, name: req.body.name },
    token: 'test-token'
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    message: '로그인 성공',
    user: { id: 'test', email: req.body.email },
    token: 'test-token'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Minimal Backend Server running on port ${PORT}`);
});