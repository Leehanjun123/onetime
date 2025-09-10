const express = require('express');
const http = require('http');
const cors = require('cors');
const { testConnection, disconnect } = require('./config/database');
const { initializeSocket } = require('./config/socket');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Socket.IO 초기화
const io = initializeSocket(server);

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3001',
    'http://localhost:3000',
    'https://frontend-leehanjun123s-projects.vercel.app',
    'https://onetime-frontend.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 데이터베이스 연결 테스트
testConnection();

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: '일데이 Backend API is running!', 
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({ 
    status: 'OK', 
    message: 'Server is healthy',
    database: dbStatus.success ? 'connected' : 'disconnected'
  });
});

// Static files middleware for uploaded files
app.use('/uploads', express.static('uploads'));

// Import routes
const jobRoutes = require('./routes/jobs');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const notificationRoutes = require('./routes/notifications');

// Use routes
app.use('/api/jobs', jobRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);

// Notification routes (temporary endpoints)
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

// Analytics API endpoints
app.get('/api/analytics/dashboard', (req, res) => {
  res.json({ 
    stats: {
      totalUsers: 127000,
      totalJobs: 8500,
      totalMatches: 45000,
      averageRating: 4.8
    },
    charts: {
      dailyRegistrations: [],
      jobsByCategory: [],
      revenueByMonth: []
    }
  });
});

app.get('/api/v1/analytics/dashboard', (req, res) => {
  res.json({ 
    stats: {
      totalUsers: 127000,
      totalJobs: 8500,
      totalMatches: 45000,
      averageRating: 4.8
    },
    charts: {
      dailyRegistrations: [],
      jobsByCategory: [],
      revenueByMonth: []
    }
  });
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

// 서버 시작
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 일데이 Backend Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`⚡ Socket.IO enabled for real-time notifications`);
});

// 앱 종료 시 정리
process.on('SIGINT', async () => {
  console.log('서버 종료 중...');
  await disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('서버 종료 중...');
  await disconnect();
  process.exit(0);
});