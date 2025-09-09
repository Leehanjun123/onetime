const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: '일데이 Backend API is running!', 
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is healthy' });
});

// API routes
app.get('/api/jobs', (req, res) => {
  res.json({ 
    message: 'Jobs API endpoint',
    jobs: []
  });
});

app.get('/api/users', (req, res) => {
  res.json({ 
    message: 'Users API endpoint',
    users: []
  });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  res.json({ message: 'Login endpoint - not implemented yet' });
});

app.post('/api/auth/register', (req, res) => {
  res.json({ message: 'Register endpoint - not implemented yet' });
});

app.get('/api/auth/profile', (req, res) => {
  res.json({ message: 'Profile endpoint - not implemented yet' });
});

// Notification routes
app.post('/api/v1/test-notification', (req, res) => {
  res.json({ message: 'Test notification sent successfully' });
});

app.get('/api/notifications', (req, res) => {
  res.json({ notifications: [] });
});

// Matching routes  
app.post('/api/v1/matching/request', (req, res) => {
  res.json({ message: 'Matching request received' });
});

// Work session routes
app.post('/api/v1/work-session/checkin', (req, res) => {
  res.json({ message: 'Check-in successful' });
});

app.post('/api/v1/work-session/checkout', (req, res) => {
  res.json({ message: 'Check-out successful' });
});

// Additional API endpoints for frontend compatibility
app.get('/api/v1/jobs/:id', (req, res) => {
  res.json({ job: { id: req.params.id, title: 'Sample Job' } });
});

app.get('/api/profile', (req, res) => {
  res.json({ profile: {} });
});

app.get('/api/v1/settlements', (req, res) => {
  res.json({ settlements: [] });
});

app.get('/api/v1/certifications', (req, res) => {
  res.json({ certifications: [] });
});

app.get('/api/v1/portfolio', (req, res) => {
  res.json({ portfolio: [] });
});

app.get('/api/v1/reviews', (req, res) => {
  res.json({ reviews: [] });
});

app.get('/api/v1/reviews/stats', (req, res) => {
  res.json({ stats: {} });
});

app.get('/api/v1/work-session/history', (req, res) => {
  res.json({ history: [] });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'API endpoint not found',
    path: req.originalUrl 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 일데이 Backend Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});